import { CheckOutlined, CloseOutlined, CloudOutlined, EyeInvisibleOutlined, EyeOutlined, LinkOutlined, RocketOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Input, List, Radio, Select, Spin, Switch, Tooltip, notification } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PullRequestSummaryDto } from '../../../shared';
import './shared.css';

const { Option } = Select;

export interface PullRequestSummaryDoc extends PullRequestSummaryDto {
  _id: string;
  updatedAt: Date;
}

function PullRequestSummaryList() {
  const [stateFilter, setStateFilter] = useState(null);
  const [labelFilter, setLabelFilter] = useState('');
  const [sortAttribute, setSortAttribute] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pullRequestSummaries, setPullRequestSummaries] = useState<PullRequestSummaryDoc[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [approverCountFilter, setApproverCountFilter] = useState<number | null>(null);
  const [isReviewerLenseActive, setIsReviewerLenseActive] = useState(false);
  const [enteredReviewerUsername, setEnteredReviewerUsername] = useState('');
  const [displayedReviewerUsername, setDisplayedReviewerUsername] = useState('');
  const [reviewerUsernameFocused, setReviewerUsernameFocused] = useState(false);
  const [searchTermFocused, setSearchTermFocused] = useState(false);
  const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;

  useEffect(() => {
    async function fetchPullRequestSummaries() {
      try {
        const response = await axios.get<PullRequestSummaryDoc[]>(`${apiBaseUrl}/api/pullrequestsummaries`);
        setPullRequestSummaries(response.data);
      } catch (error) {
        console.log('Error fetching pull requests:', error);
      }
    }

    fetchPullRequestSummaries();
  }, [apiBaseUrl]);

  useEffect(() => {
    console.log("approverCountFilter changed:", approverCountFilter);
  }, [approverCountFilter]);

  const uniqueApproverCounts = useMemo(() => {
    const countsSet = new Set<number>();
    pullRequestSummaries.forEach((pr) => countsSet.add(pr.approvers.length));
    return Array.from(countsSet).sort((a, b) => a - b); // Sorting for better UX
  }, [pullRequestSummaries]);

  const daysSinceLastParticipation = (pr: PullRequestSummaryDoc, username: string): number | null => {
    const userComments = pr.participantComments.filter(comment => comment.author === username);
  
    if (userComments.length > 0) {
      const lastCommentDate = new Date(userComments[userComments.length - 1].timestamp); // assuming the comments are ordered chronologically
      const today = new Date();
      return Math.floor((today.getTime() - lastCommentDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  
    return null;
  }

  const filteredPullRequests = useMemo(() => {
    let filtered = pullRequestSummaries;
  
    if (searchTerm) {
      filtered = filtered.filter(pr => {
        const teamMatch = pr.proposal.team && pr.proposal.team.name?.includes(searchTerm);
        const titleMatch = pr.proposal.title && pr.proposal.title.includes(searchTerm);
        const fullTextMatch = JSON.stringify(pr).includes(searchTerm);
  
        return teamMatch || titleMatch || fullTextMatch;
      });
    }
  
    if (stateFilter) {
      filtered = filtered.filter(pr => pr.status === stateFilter);
    }
  
    if (labelFilter) {
      filtered = filtered.filter(pr => pr.labels.some(label => label.name === labelFilter));
    }

    if (approverCountFilter !== null) {
      filtered = filtered.filter(pr => pr.approvers.length === approverCountFilter);
    }
  
    return filtered;
  }, [pullRequestSummaries, stateFilter, labelFilter, searchTerm, approverCountFilter]);
  

  const syncOpenPRs = async () => {
    setSyncLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/crawler/scan-prs`);
      notification.success({
        message: 'Sync successful',
        description: response.data.message,
      });
      // You can also update the state to reflect the changes
    } catch (error) {
      console.error('Error syncing with GitHub:', error);
      notification.error({
        message: 'Sync failed',
        description: 'An error occurred while syncing with GitHub.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const sortedPullRequests = useMemo(() => {
    return filteredPullRequests.sort((a, b) => {
      if (isReviewerLenseActive) {
        const daysA = daysSinceLastParticipation(a, displayedReviewerUsername);
        const daysB = daysSinceLastParticipation(b, displayedReviewerUsername);
  
        // Both PRs have user participation, sort by most recent participation
        if (daysA && daysB) {
          return daysA - daysB;
        }
  
        // Only PR 'a' has user participation, so 'a' should come first
        if (daysA && !daysB) {
          return -1;
        }
  
        // Only PR 'b' has user participation, so 'b' should come first
        if (!daysA && daysB) {
          return 1;
        }
      }

      // Handle sorting by 'prId'
      if (sortAttribute === 'proposal.prId') {
        return sortOrder === 'asc' ? a.prId - b.prId : b.prId - a.prId;
      }
  
      // Either the feature is inactive or neither PR has user participation, use the existing logic to sort
      const valueA = _.get(a, sortAttribute);
      const valueB = _.get(b, sortAttribute);

      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }, [filteredPullRequests, displayedReviewerUsername, sortAttribute, sortOrder, isReviewerLenseActive]);

  const syncAllPRs = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/crawler/scan-prs?include-closed=true`);
      console.log(response.data.message);
      // You can also show a notification or update the state to reflect the changes
    } catch (error) {
      console.error('Error rescanning all PRs:', error);
    }
  };

  const uniqueLabels = useMemo(() => {
    const labelsSet = new Set<string>();
    pullRequestSummaries.forEach((pr) =>
      pr.labels.forEach((label) => labelsSet.add(label.name))
    );
    return Array.from(labelsSet);
  }, [pullRequestSummaries]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Select
            allowClear
            style={{ width: 150, marginRight: '16px' }}
            placeholder="Filter by state"
            onChange={(value) => setStateFilter(value)}
          >
            <Option value="open">Open</Option>
            <Option value="closed">Closed</Option>
            <Option value="merged">Merged</Option>
          </Select>
          <Select
            allowClear
            style={{ width: 150, marginRight: '16px' }}
            placeholder="Filter by label"
            onChange={(value) => setLabelFilter(value)}
          >
            {uniqueLabels.map((label) => (
              <Option key={label} value={label}>
                {label}
              </Option>
            ))}
          </Select>
          <Select
            allowClear
            style={{ width: 150, marginRight: '16px' }}
            placeholder="Filter by approvals"
            onChange={(value) => setApproverCountFilter(value || value === 0 ? Number(value) : null)}
          >
            {uniqueApproverCounts.map((count) => (
              <Option key={count} value={count}>
                {count} Approver{count !== 1 ? "s" : ""}
              </Option>
            ))}
          </Select>
          <Select
            style={{ width: 150, marginRight: '16px' }}
            defaultValue={sortAttribute}
            onChange={(value) => setSortAttribute(value)}
          >
            <Option value="updatedAt">Updated At</Option>
            <Option value="status">Status</Option>
            <Option value="lastUpdateSuccessful">Update Status</Option>
            <Option value="proposal.title">Title</Option>
            <Option value="proposal.author">Author</Option>
            <Option value="proposal.prId">ID</Option>
          </Select>
          <Radio.Group
            defaultValue={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <Radio.Button value="asc">Asc</Radio.Button>
            <Radio.Button value="desc">Desc</Radio.Button>
          </Radio.Group>
        </div>

        <Tooltip title="Search by team name, app name, or full text" open={searchTermFocused}>
          <Input
            placeholder="Search by team name, app name, or full text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '300px' }}
            onFocus={() => setSearchTermFocused(true)}
            onBlur={() => setSearchTermFocused(false)}
            prefix={<SearchOutlined />}
          />
        </Tooltip>


        <div>
          <Switch
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
            checked={isReviewerLenseActive}
            onClick={() => {setIsReviewerLenseActive(!isReviewerLenseActive)}}
            style={{marginRight: '10px'}}
            />
        
          <Tooltip title="Enter username and press enter" open={reviewerUsernameFocused}>
            <Input
              autoFocus
              disabled={!isReviewerLenseActive}
              placeholder="Enter username and press enter"
              value={enteredReviewerUsername}
              onChange={(e) => setEnteredReviewerUsername(e.target.value)}
              onPressEnter={() => setDisplayedReviewerUsername(enteredReviewerUsername)}
              style={{width: '300px'}}
              onFocus={() => setReviewerUsernameFocused(true)}
              onBlur={() => setReviewerUsernameFocused(false)}
              prefix={<SearchOutlined />}
            />
          </Tooltip>
        </div>

      </div>

      <List
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Pull Requests</div>
            <Button
              onClick={syncOpenPRs}
              icon={<SyncOutlined />}
              size="small"
              type="primary"
              style={{ marginRight: '8px' }}
              loading={syncLoading}
            >
              {syncLoading ? <Spin /> : 'Sync open PRs'}
            </Button>
            <Button
              onClick={syncAllPRs}
              icon={<SyncOutlined />}
              size="small"
              type="primary"
            >
              Sync all PRs
            </Button>
          </div>
        }
        bordered
        dataSource={sortedPullRequests}
        renderItem={(pr) => (
          <List.Item
            // If the grant committee member hasn't engaged in the discussion, grey out the PR
            style={isReviewerLenseActive && !daysSinceLastParticipation(pr, displayedReviewerUsername) ? { opacity: 0.5 } : {}}
          >
            <List.Item.Meta
              title={
                <span>
                  <span
                    className="status-label"
                    style={{
                      backgroundColor:
                        pr.status === 'open'
                          ? '#28a745'
                          : pr.status === 'closed'
                          ? '#cb2431'
                          : '#6f42c1',
                      color: '#ffffff',
                    }}
                  >
                    {pr.status}
                  </span>&nbsp;
                  <Link to={`/pullrequests/${pr._id}`}>
                   #{pr.prId} - {pr.proposal.title} by {pr.proposal.author}
                  </Link>&nbsp;
                  {pr.labels.map((label) => (
                    <span
                      key={label.name}
                      className={`status-label`}
                      style={{
                        marginLeft: '8px',
                        color: `#${label.color}`,
                        background: 'rgb(42 42 42)',
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                  {pr.lastUpdateSuccessful ? (
                    <RocketOutlined
                      style={{ color: '#52c41a', marginLeft: '8px' }}
                    />
                  ) : (
                    <CloudOutlined
                      style={{ color: '#f5222d', marginLeft: '8px' }}
                    />
                  )}
                  <span style={{ marginLeft: '8px' }}>
                    {new Date(pr.updatedAt).toLocaleString()}
                  </span>
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open in GitHub"
                    style={{ float: 'right' }}
                  />
                  {isReviewerLenseActive && daysSinceLastParticipation(pr, displayedReviewerUsername) && (
                    <span className="toast" style={{marginLeft: '10px'}}>
                      Participated ({daysSinceLastParticipation(pr, displayedReviewerUsername)} days ago)
                    </span>
                  )}
                </span>
              }
              description={
                <>
                  {pr.approvers && pr.approvers.length > 0 && (
                    <>
                      <CheckOutlined style={{ color: '#52c41a' }} />
                      <span>{pr.approvers.length}</span>
                    </>
                  )}
                  {pr.rejectors && pr.rejectors.length > 0 && (
                    <>
                      <CloseOutlined style={{ color: '#f5222d' }} />
                      <span>{pr.rejectors.length}</span>
                    </>
                  )}
                </>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No pull requests found' }}
      />
    </div>
  );
}

export default PullRequestSummaryList;
