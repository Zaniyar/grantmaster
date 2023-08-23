import { ConnectOptions, Schema, connect, model } from 'mongoose';
import { CurrencyAmount, Deliverable, Message, Milestone, PrLabel, ProposalChapters, ProposalDoc, PullRequestSummaryDoc, TeamDoc } from '../../../shared';

const currencyAmountSchema = new Schema<CurrencyAmount>({
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
});

const prLabelSchema = new Schema<PrLabel>({
  name: { type: String, required: true },
  color: { type: String, required: true },
});

const DeliverableSchema = new Schema<Deliverable>({
  name: { type: String, required: true },
  number: { type: String, required: true },
  specification: { type: String, required: true },
});

const MilestoneSchema = new Schema<Milestone>({
  name: { type: String, required: true },
  duration: { type: String, required: true },
  FTE: { type: String, required: true },
  costs: { type: String, required: true },
  deliverables: [DeliverableSchema],
  license: { type: String, required: true },
});

const TeamSchema = new Schema<TeamDoc>({
  name: { type: String, required: true },
  contactName: { type: String },
  contactEmail: { type: String },
  entity: {
    name: { type: String },
    address: { type: String },
  },
  website: { type: String },
  members: { type: [String] },
  repos: { type: [String] },
  linkedinProfiles: { type: [String] },
});

const ProposalSchema = new Schema<ProposalDoc>({
  title: { type: String, required: true },
  level: { type: Number, required: true },
  currencyAmount: { type: currencyAmountSchema, required: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  author: { type: String, required: true },
  paymentAddress: { type: String, required: true },
  totalFTE: { type: Number, required: true },
  totalDuration: { type: Number, required: true },
  document: { type: String, required: true },
  milestones: { type: [MilestoneSchema], required: true },
});

const messageSchema = new Schema<Message>({
  author: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date },
});

const pullRequestSummarySchema = new Schema<PullRequestSummaryDoc>({
  prId: { type: Number, required: true},
  url: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'merged'], required: true },
  labels: { type: [prLabelSchema], required: true },
  proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  approvers: { type: [String], required: true },
  rejectors: { type: [String], required: true },
  participantComments: { type: [messageSchema], required: true },  // Add this line
  lastUpdateSuccessful: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export const PullRequestSummaryModel = model<PullRequestSummaryDoc>('PullRequestSummary', pullRequestSummarySchema);
export const TeamModel = model<TeamDoc>('Team', TeamSchema);
export const ProposalModel = model<ProposalDoc>('Proposal', ProposalSchema);

interface MongoDBConnectOptions extends ConnectOptions {
  useNewUrlParser?: boolean;
  useUnifiedTopology?: boolean;
}

class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;

  private constructor() {}

  public static getInstance = (): DatabaseConnection => {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  };

  public assureConnection = async (): Promise<void> => {
    if (DatabaseConnection.instance) {
      return;
    }
    try {
      const options: MongoDBConnectOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // user: process.env.MONGODB_USER,
        // pass: process.env.MONGODB_PASSWORD,
      };

      await connect(`mongodb://${process.env.MONGO_HOST}/grants-dashboard`, options);
      console.log('MongoDB connected');
    } catch (error) {
      console.log('MongoDB connection error', error);
    }
  };
}

export const databaseConnection = DatabaseConnection.getInstance();