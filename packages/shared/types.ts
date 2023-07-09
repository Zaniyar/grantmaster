import { Document } from 'mongoose';

export interface CurrencyAmount {
  amount: number;
  currency: string;
}

export interface PrLabel {
  name: string;
  color: string;
}

export interface Milestone {
  name: string;
  duration: string;
  FTE: string;
  costs: string;
  deliverables: Deliverable[];
  license: string;
}

export interface Deliverable {
  name: string;
  number: string;
  specification: string;
}

// Scope: follow-up grant
interface Evaluation {
  author: string;
  link: string;
  doc: string;
}

interface Proposal {
  title: string;
  level: number;
  currencyAmount: CurrencyAmount;
  paymentAddress: string;
  totalFTE: number;
  totalDuration: number;
  document: string;
  milestones: Milestone[];
  author: string;
}

interface PullRequestSummary {
  prId: number;
  url: string; // = PR
  status: 'open' | 'closed' | 'merged';
  labels: PrLabel[];
  proposal: Proposal | ProposalDoc['id'];
  approvers: string[]; // => committeeApprovals
  rejectors: string[]; // => committeeRejections
  participantComments: Message[];
  lastUpdateSuccessful: boolean;
}

export interface PullRequestSummaryDoc extends Document, PullRequestSummary {
  proposal: ProposalDoc['id'];
  updatedAt: Date; // automatically included since the 'timestamps' attribute is set to true in the schema
  createdAt: Date; // automatically included since the 'timestamps' attribute is set to true in the schema
}

export interface PullRequestSummaryDto extends PullRequestSummary {
  proposal: Proposal;
  updatedAt: Date; // automatically included since the 'timestamps' attribute is set to true in the schema
  createdAt: Date; // automatically included since the 'timestamps' attribute is set to true in the schema
}

export interface Message {
  author: string;
  message: string;
  timestamp: Date;
}
