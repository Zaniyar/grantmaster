import React from 'react';
import { Collapse } from 'antd';
import { Deliverable, Milestone } from '../../../shared';

const { Panel } = Collapse;

interface MilestonesProps {
  milestones: Milestone[];
}

export const MilestonesView: React.FC<MilestonesProps> = ({ milestones }) => {
  return (
    <Collapse accordion>
      {milestones.map((milestone, index) => (
        <Panel header={milestone.name} key={index}>
          <p>Duration: {milestone.duration}</p>
          <p>FTE: {milestone.FTE}</p>
          <p>Costs: {milestone.costs}</p>
          <p>License: {milestone.license}</p>
          <h3>Deliverables:</h3>
          <ul>
            {milestone.deliverables.map((deliverable: Deliverable, dIndex: number) => (
              <li key={dIndex}>
                <h4>{deliverable.number} {deliverable.name}</h4>
                <p>{deliverable.specification}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </Collapse>
  );
};
