import React, { useEffect, useState } from 'react';
import { TeamPageDto } from '../../../shared';
import { Button, Card, Descriptions, Input } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import Highlighter from 'react-highlight-words';

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamPageDto[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamPageDto[]>([]);
  const [searchText, setSearchText] = useState('');
  const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3001`;

  useEffect(() => {
    async function fetchTeams() {
      const response = await fetch(`${apiBaseUrl}/api/teams`);
      const data = await response.json();
      setTeams(data);
      setFilteredTeams(data); // Initialize with all teams
    }

    fetchTeams();
  }, [apiBaseUrl]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchText(searchValue);

    const filtered = teams.filter(team => {
      const combinedAttributes = [
        team.name,
        team.contactName,
        team.contactEmail,
        team.entity?.name,
        team.entity?.address,
        team.website,
        ...(team.members || []),
        ...(team.repos || []),
        ...(team.linkedinProfiles || [])
      ].join(' ').toLowerCase();

      return combinedAttributes.includes(searchValue.toLowerCase());
    });

    setFilteredTeams(filtered);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} />
          &nbsp;
          <span style={{ marginRight: '20px' }}>Teams</span>
        </h1>

        <Input.Search
          placeholder="Search..."
          value={searchText}
          onChange={handleSearch}
          style={{ width: '50%'}}
        />
      </div>

      {filteredTeams.map((team, index) => (
        <div key={index}>
          <Card title={
            <Highlighter
              searchWords={[searchText]}
              autoEscape={true}
              textToHighlight={team.name || ''}
            />
          } style={{ marginBottom: 16 }}>
            <Descriptions>
              {team.contactName && 
                <Descriptions.Item label="Contact Name">
                  <Highlighter
                    searchWords={[searchText]}
                    autoEscape={true}
                    textToHighlight={team.contactName || ''}
                  />
                </Descriptions.Item>
              }
              {team.contactEmail && 
                <Descriptions.Item label="Contact Email">
                  <Highlighter
                    searchWords={[searchText]}
                    autoEscape={true}
                    textToHighlight={team.contactEmail || ''}
                  />
                </Descriptions.Item>
              }
              {team.entity?.name && 
                <Descriptions.Item label="Entity Name">
                  <Highlighter
                    searchWords={[searchText]}
                    autoEscape={true}
                    textToHighlight={team.entity.name || ''}
                  />
                </Descriptions.Item>
              }
              {team.entity?.address && 
                <Descriptions.Item label="Entity Address">
                  <Highlighter
                    searchWords={[searchText]}
                    autoEscape={true}
                    textToHighlight={team.entity.address || ''}
                  />
                </Descriptions.Item>
              }
              {team.website && 
                <Descriptions.Item label="Website">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {team.website}
                  </ReactMarkdown>
                </Descriptions.Item>
              }
              {team.members && 
                <Descriptions.Item label="Members">
                  <Highlighter
                    searchWords={[searchText]}
                    autoEscape={true}
                    textToHighlight={team.members.join(', ') || ''}
                  />
                </Descriptions.Item>
              }
              {team.repos && 
                <Descriptions.Item label="Repos">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {team.repos.join(', ')}
                  </ReactMarkdown>
                </Descriptions.Item>
              }
              {team.linkedinProfiles && 
                <Descriptions.Item label="LinkedIn Profiles">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {team.linkedinProfiles.join(', ')}
                  </ReactMarkdown>
                </Descriptions.Item>
              }
              <Descriptions.Item label={`Pull Requests (${team.pullRequests.length})`}>
                {team.pullRequests && team.pullRequests.length > 0 && (
                  <div>
                    {team.pullRequests.map((pr, prIndex) => (
                      <React.Fragment key={prIndex}>
                        <Link to={`/pullrequests/${pr.prId}`}>
                          PR: {pr.prId} - {pr.status}
                        </Link>
                        {prIndex !== team.pullRequests.length - 1 && ', '}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ))}
      </div>
    );
  };
  
  export default TeamsPage;