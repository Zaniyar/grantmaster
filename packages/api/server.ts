import { PullRequestSummaryDoc, PullRequestSummaryDto } from '../shared';

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

// Endpoint to trigger pull requests scan
app.get('/api/crawler/scan-prs', async (req, res) => {
});

// endpoint to get all pull request summaries
app.get('/api/pullrequestsummaries', async (req, res) => {
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
