import axios from "axios";
import { ProposalModel, PullRequestSummaryModel, TeamModel, databaseConnection } from "./db/model";
import { Message, Milestone, ProposalInfo } from "../../shared";
import { extractProposalInfo } from ".";
import { parseMilestones } from "./milestone-parser";

const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// github config
const apiKey = process.env.GITHUB_API_KEY || '';
const isPullRequest = true;
const githubOrg = process.env.GITHUB_ORG;
const githubRepo = process.env.GITHUB_REPO;

const getPrPageFromGithub = async (page: number, options = {}): Promise<number[]> => {
  const response = await axios.get(`https://api.github.com/repos/${githubOrg}/${githubRepo}/pulls`, {
    params: {
      ...options,
      page: page,
      per_page: 100 // 100 is the page limit for the "pulls" endpoint
    },
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  const prIds = response.data.map((pr: any) => pr.number);

  // Check if there is a 'next' page by looking at the 'link' header
  const linkHeader = response.headers['link'];
  if (linkHeader) {
    const hasNextPage = linkHeader.includes('rel="next"');
    if (hasNextPage) {
      const nextPagePrIds = await getPrPageFromGithub(page + 1, options);
      return prIds.concat(nextPagePrIds);
    }
  }

  return prIds;
};

export const getPrIdsFromGithub = async (options = {}) => {
  try {
    // Start from the first page
    const allPrIds = await getPrPageFromGithub(1, options);
    return allPrIds;
  } catch (error) {
    console.error('Error fetching PR IDs from GitHub:', error);
    return [];
  }
};

export const getPrIdsOfStoredPrs = async (onlyActivePrs: boolean = true) => {
  try {
    const query = onlyActivePrs ? { status: 'open' } : {};
    const pullRequestSummaries = await PullRequestSummaryModel.find(query, 'prId'); // Fetch only the 'prId' field of the pull requests
    const prIds = pullRequestSummaries.map(pr => pr.prId);
    return prIds;
  } catch (error) {
    console.error('Error fetching PR IDs:', error);
    return [];
  }
};

interface PrFile {
  filename: string;
  content: string; // base64-encoded
}

const getChangedFilesFromPR = async (prId: number) => {
  try {
    const filesUrl = `https://api.github.com/repos/${githubOrg}/${githubRepo}/pulls/${prId}/files`;
    console.info(`🔄 FETCHING ${filesUrl}...`)
    const response = await axios.get(filesUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const files = response.data;

    const fileContentsPromises: PrFile[] = files.map(async (file: any) => {
      const contentResponse = await axios.get(file.contents_url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      return {
        filename: file.filename,
        content: contentResponse.data.content,
      };
    });

    console.info(`✅ GOT ${files.length} FILE(S) FROM GITHUB PR`);

    const fileContents = await Promise.all(fileContentsPromises);

    return fileContents;
  } catch (error) {
    console.error('Error fetching changed files:', error);
    throw error;
  }
};

export const getGithubData = async (prId: number, isPullRequest: boolean) => {

  // Connect to db
  await databaseConnection.assureConnection();

  // Get PR description
  const pr = await axios.get<any>(`https://api.github.com/repos/${githubOrg}/${githubRepo}/pulls/${prId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
  }).then((response) => response.data);

  // check if the PR is merged
  if (pr.state === 'closed') {
    try {
      console.log(`Checking if PR ${prId} is merged...`)
      await axios.get<any>(`https://api.github.com/repos/${githubOrg}/${githubRepo}/pulls/${prId}/merge`, { // if this request succeeds, the PR is merged
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
      });

      console.log(`Merge verified: PR ${prId} is merged!`)
      pr.state = 'merged';
    } catch (error) {
      // If there's an error (likely a 404), the PR is closed but not merged
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        console.log(`Merge not verified: PR ${prId} is closed without merging!`)
      } else {
        console.error('Error checking merge status:', error);
      }
    }
  }

  const conditionalPrDescription = isPullRequest
    ? [{
      name: pr.user.login,
      content: pr.body,
      timestamp: pr.created_at,
    }]
    : [];

  // Normal comments
  const normalComments = await axios.get<any[]>(`https://api.github.com/repos/${githubOrg}/${githubRepo}/issues/${prId}/comments?per_page=100`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
    params: {
      state: 'all'
    }
  }).then((response) => response.data.map((comment) => ({
    name: comment.user.login,
    content: comment.body,
    timestamp: comment.created_at,
  })));

  // Review comments
  const reviewResponse = isPullRequest
  ? await axios.get<any[]>(`https://api.github.com/repos/${githubOrg}/${githubRepo}/pulls/${prId}/reviews?per_page=100`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
    params: {
      state: 'all'
    }
  }).then((response) => {
    const reviews = response.data;
    const mostRecentReviewRecords = reviews.reduce<Record<string, any>>(
      (reviews, review) => {
        // Check if we already have a review for this user
        const existingReview = reviews[review.user.login];

        // If we don't have a review yet or this review is more recent, add it to the object
        if (!existingReview || new Date(review.submitted_at) > new Date(existingReview.submitted_at)) {
          reviews[review.user.login] = review;
        }

        return reviews;
      },
      {}
    );

    const mostRecentReviews = Object.values(mostRecentReviewRecords).map((review) => ({
      name: review.user.login,
      status: review.state,
    }));

    return {
      reviewComments: reviews.map((comment) => ({
        name: comment.user.login,
        content: comment.body,
        timestamp: comment.submitted_at,
      })),
      approvers: mostRecentReviews.filter(r => r.status === 'APPROVED').map(r => r.name),
      rejectors: mostRecentReviews.filter(r => r.status === 'CHANGES_REQUESTED').map(r => r.name),
    };
  })
  : {
    reviewComments: [],
    approvers: [],
    rejectors: [],
  };

  const { reviewComments, approvers, rejectors } = reviewResponse;

  // Inline comments
  const inlineComments = isPullRequest
  ? await axios.get<any[]>(`https://api.github.com/repos/${githubOrg}/${githubRepo}/pulls/${prId}/comments`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  }).then((response) => response.data.map((comment) => ({
    name: comment.user.login,
    content: comment.body,
    timestamp: comment.created_at,
  })))
  : [];

  // All comments
  const participantComments = [...conditionalPrDescription, ...normalComments, ...inlineComments, ...reviewComments]
    .map((comment) => ({
      author: comment.name,
      message: comment?.content || '',
      timestamp: new Date(comment.timestamp),
    } as Message));

  const allComments = participantComments
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((comment) => ({
      name: comment.author,
      content: comment.message
        ?.replace(/(\r\n\r\n\r\n|\n\n\n|\r\r\r)/gm, "<br>") // replace triple line breaks with single line breaks
        .replace(/(\r\n\r\n|\n\n|\r\r)/gm, "<br>") // replace double line breaks with single line breaks
        .replace(/\[([^\]]+)\]\((?:[^)\s]+|(?:\([^)\s]+\))*)\)/g, '$1') // remove links, e.g. [link](https://link.com)
    } as any));

  // File contents
  const changedFilesFromPR = await getChangedFilesFromPR(prId);

  // Proposal content
  const proposalContent = Buffer
    .from(changedFilesFromPR[0].content, 'base64')
    .toString('utf-8');

  // Proposal info
  const proposalInfo = changedFilesFromPR.length === 1
    ? extractProposalInfo(
      proposalContent
    )
    : null;
  
  const grantApplicationDoc = changedFilesFromPR.length === 1
    ? changedFilesFromPR[0].content
    : 'N/A';

  console.info(`🔄 PARSING ${prId}`)
  const milestones = parseMilestones(Buffer.from(grantApplicationDoc, 'base64').toString('utf-8'));

  return {
    allComments,
    approvers,
    rejectors,
    proposalInfo,
    pr,
    changedFilesFromPR,
    grantApplicationDoc,
    milestones,
    participantComments,
  };
};

export const summarisePrLight = async (prId: number) => {
  const githubData = await getGithubData(prId, isPullRequest);

  const { approvers, rejectors, proposalInfo, pr, grantApplicationDoc, milestones, participantComments } = githubData;

  await persistPrDoc(prId, pr, proposalInfo, approvers, rejectors, Buffer.from(grantApplicationDoc, 'base64').toString('utf-8'), milestones, participantComments);
}

const persistDoc = async (Model: any, query: any, object: any) => {
  try {
    // deep copy to avoid modifying any object that might be referenced elsewhere
    // (prevents "Performing an update on the path '_id' would modify the immutable field '_id'" error)
    const objectCopy = JSON.parse(JSON.stringify(object));
    delete objectCopy._id;

    // Use findOneAndUpdate with upsert option and query based on a unique field
    const updatedObject = await Model.findOneAndUpdate(
      query,
      objectCopy,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('✅ SUCCESSFULLY PERSISTED', updatedObject);
    return updatedObject;
  } catch (error) {
    console.info('❌ PERSIST FAILED');
    console.error(error);
  }
};

const persistPrDoc = async (
  prId: number,
  pr: any,
  proposalInfo: ProposalInfo | null,
  approvers: any[] = [],
  rejectors: any[] = [],
  grantApplicationDoc: string,
  milestones: Milestone[],
  participantComments: Message[],
) => {
  // Persist the Team first
  let team = new TeamModel(proposalInfo?.team);
  
  // _id changes here, so 'team' has to be re-assigned
  team = await persistDoc(TeamModel, { name: team.name }, team);

  // Persist the Proposal with reference to the Team
  let proposal = new ProposalModel({
    title: proposalInfo?.title || 'N/A',
    level: proposalInfo?.level || -1,
    currencyAmount: proposalInfo?.currencyAmount || { amount: 0, currency: 'N/A' },
    team: team._id,
    paymentAddress: proposalInfo?.paymentAddress || 'N/A',
    totalFTE: proposalInfo?.totalFTE || -1,
    totalDuration: proposalInfo?.totalDuration || -1,
    author: pr.user.login,
    summary: 'legacy',
    document: grantApplicationDoc,
    milestones,
  });

  // _id changes here, so 'proposal' has to be re-assigned
  proposal = await persistDoc(ProposalModel, { title: proposal.title }, proposal);

  // Construct the PullRequestSummary with reference to the Proposal
  let pullRequestSummary = {
    prId,
    url: `https://github.com/${githubOrg}/${githubRepo}/pull/${prId}`,
    status: pr.state,
    labels: pr.labels.map((label: any) => ({
      name: label.name,
      color: label.color
    })),
    proposal: proposal._id,
    approvers,
    rejectors,
    participantComments,
  };

  // Save the PullRequestSummary to DB using the new persistDoc function
  await persistDoc(PullRequestSummaryModel, { url: pullRequestSummary.url }, pullRequestSummary);
};
