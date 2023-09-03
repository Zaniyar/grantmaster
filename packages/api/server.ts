import mongoose, { ConnectOptions } from 'mongoose';
import { getPrIdsFromGithub, summarisePrLight } from 'grantmaster-crawler/src';
import { ProposalModel, PullRequestSummaryModel, TeamModel, databaseConnection } from 'grantmaster-crawler/src/db/model';
import { PullRequestSummaryDoc, PullRequestSummaryDto } from '../shared';

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../crawler/.env') });

const app = express();

app.use(express.json());
app.use(cors());

if (!process.env.MONGODB_URI) {
  throw new Error('❌ MANDATORY ENVIRONMENT VARIABLE NOT SET: MONGODB_URI');
}

interface MongoDBConnectOptions extends ConnectOptions {
  useNewUrlParser?: boolean;
  useUnifiedTopology?: boolean;
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
} as MongoDBConnectOptions);

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});
// Endpoint to trigger pull requests scan
app.get('/api/crawler/scan-prs', async (req, res) => {
});

const getPrDto = async  (prDoc: PullRequestSummaryDoc): Promise<PullRequestSummaryDto> => {
  const pr = prDoc.toObject();
  const proposalDoc = await ProposalModel.findOne({ _id: pr.proposal });
  if (!proposalDoc) {
    throw new Error(`Proposal not found for PR ${pr.prId}`);
  }
  const proposal = proposalDoc.toObject();

  const teamDoc = await TeamModel.findOne({ _id: proposal.team });
  if (!teamDoc) {
    throw new Error(`Team not found for proposal ${proposal._id}`);
  }
  const team = teamDoc.toObject();

  return {
    ...pr,
    updatedAt: pr.updatedAt,
    proposal: {
      ...proposal,
      team,
    }
  };
}

// endpoint to get all pull request summaries
app.get('/api/pullrequestsummaries', async (req, res) => {
  try {
    const pullRequestSummaries = await PullRequestSummaryModel.find();

    const pullRequestSummariesDto = pullRequestSummaries.map(getPrDto);

    const resolvedPullRequestSummariesDto = await Promise.all(pullRequestSummariesDto);

    res.json(resolvedPullRequestSummariesDto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// endpoint to get a single pull request summary
app.get('/api/pullrequests/:id', async (req, res) => {
});

// endpoint to get all teams
app.get('/api/teams', async (req, res) => {
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);

  await databaseConnection.assureConnection();
});
