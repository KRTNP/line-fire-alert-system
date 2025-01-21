require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const line = require('@line/bot-sdk');
const { lineConfig } = require('./config/line');
const lineService = require('./services/lineService');
const logger = require('./utils/logger');

if (!process.env.PORT) {
  logger.error('Environment variable PORT is missing');
  process.exit(1);
}

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use('/webhook', line.middleware(lineConfig));

// LINE Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events;
    await Promise.all(events.map(event => lineService.handleEvent(event)));
    res.status(200).end();
  } catch (err) {
    logger.error('Webhook Error:', err);
    res.status(500).end();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});