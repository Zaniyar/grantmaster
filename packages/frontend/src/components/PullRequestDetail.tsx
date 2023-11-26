import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Tabs } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { MilestonesView } from './MilestonesView';

import './shared.css';
import { PullRequestSummaryDto } from '../../../shared';

const { TabPane } = Tabs;

type PullRequestDetailParams = {
  id: string;
};

function PullRequestDetail() {
  const navigate = useNavigate();
  const [pullRequestSummary, setPullRequestSummary] = useState<PullRequestSummaryDto>();
  const { id } = useParams<PullRequestDetailParams>();
  const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;

  useEffect(() => {
    async function fetchPullRequest() {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/pullrequests/${id}`);
        const data = response.data;
        setPullRequestSummary(data);
      } catch (error) {
        console.log('Error fetching pull request:', error);
      }
    }

    fetchPullRequest();
  }, [id, apiBaseUrl]);

  if (!pullRequestSummary) {
    return <div>Loading...</div>;
  }

  const rescanSinglePr = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/crawler/run-single/${pullRequestSummary.prId}`);
      console.log(response.data.message);
      // You can also show a notification or update the state to reflect the changes
    } catch (error) {
      console.error(`Error rescanning PR #${pullRequestSummary.prId}:`, error);
    }
  };

  const green = '#28a745';

  return (
    <div>
      <h1 className="align-center">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        />&nbsp;
        <Button
          icon={<SyncOutlined />}
          onClick={rescanSinglePr}
          type="primary"
        />&nbsp;
        <span>
          {pullRequestSummary.proposal.title} by {pullRequestSummary.proposal.author}
        </span>&nbsp;
        <span
          className="status-label"
          style={{
            backgroundColor:
              pullRequestSummary.status === 'open'
                ? green
                : pullRequestSummary.status === 'closed'
                ? '#cb2431'
                : '#6f42c1',
            color: '#ffffff',
          }}
        >
          {pullRequestSummary.status}
        </span>
      </h1>
      <Card title="Overview" style={{ marginBottom: 16 }} extra={<a href={pullRequestSummary.url} target='_blank' rel='noreferrer'>Open PR</a>}>
        <Descriptions>
          <Descriptions.Item label="Approvers">
            {pullRequestSummary.approvers.length}{' '}
            <span style={{ color: 'green' }}>
              <CheckOutlined />
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Rejectors">
            {pullRequestSummary.rejectors.length}{' '}
            <span style={{ color: 'red' }}>
              <CloseOutlined />
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Level">
            {pullRequestSummary.proposal.level}{' '}
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            {pullRequestSummary.proposal.currencyAmount.amount} {pullRequestSummary.proposal.currencyAmount.currency}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Address">
            <span className="truncate">
              {pullRequestSummary.proposal.paymentAddress}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Total FTE">
            {pullRequestSummary.proposal.totalFTE}
          </Descriptions.Item>
          <Descriptions.Item label="Total Duration">
            {pullRequestSummary.proposal.totalDuration}
          </Descriptions.Item>
          <Descriptions.Item label="Team">
            {pullRequestSummary.proposal.team.name}
          </Descriptions.Item>
          <Descriptions.Item label="Last updated">
            {new Date(pullRequestSummary.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Grant Application Doc" key="1">
          <Card>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}>
              {pullRequestSummary.proposal.document}
            </ReactMarkdown>
          </Card>
        </TabPane>

        <TabPane tab="Milestones" key="2">
          {pullRequestSummary.proposal.milestones && pullRequestSummary.proposal.milestones.length > 0 ? (
            <MilestonesView milestones={pullRequestSummary.proposal.milestones} />
          ) : (
            <span>No milestones available</span>
          )}
        </TabPane>
      </Tabs>

    </div>
  );
}

export default PullRequestDetail;
