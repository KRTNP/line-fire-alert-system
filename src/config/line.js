const line = require('@line/bot-sdk');
require('dotenv').config();
const logger = require('../utils/logger');

// Ensure environment variables are set
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
  logger.error('LINE channel access token or secret is missing');
  process.exit(1);
}

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(lineConfig);

module.exports = {
  lineConfig,
  client
};