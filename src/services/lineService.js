const { client } = require('../config/line');
const logger = require('../utils/logger');
const alertService = require('./alertService');
const db = require('../config/database');

class LineService {
  static async handleEvent(event) {
    try {
      switch (event.type) {
        case 'follow':
          return this.handleFollow(event);
        case 'unfollow':
          return this.handleUnfollow(event);
        case 'message':
          return this.handleMessage(event);
        case 'postback':
          return this.handlePostback(event);
        default:
          return Promise.resolve(null);
      }
    } catch (error) {
      logger.error('Error handling event:', error);
    }
  }

  static async handleFollow(event) {
    try {
      await db.query(
        'INSERT INTO users (line_user_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [event.source.userId]
      );
      return this.sendWelcomeMessage(event.replyToken);
    } catch (error) {
      logger.error('Error handling follow event:', error);
    }
  }

  static async handleUnfollow(event) {
    try {
      await db.query(
        'DELETE FROM users WHERE line_user_id = $1',
        [event.source.userId]
      );
    } catch (error) {
      logger.error('Error handling unfollow event:', error);
    }
  }

  static async handleMessage(event) {
    if (event.message.type !== 'text') {
      return this.replyText(event.replyToken, 'Sorry, I can only process text messages.');
    }

    const text = event.message.text.toLowerCase();

    switch (text) {
      case 'menu':
        return this.sendMainMenu(event.replyToken);
      case 'report':
        return this.startReportFlow(event.replyToken);
      case 'help':
        return this.sendHelpMessage(event.replyToken);
      default:
        if (await this.isInReportFlow(event.source.userId)) {
          return this.handleReportInput(event);
        }
        return this.replyText(event.replyToken, 
          'Please use the menu to interact with me. Type "menu" to see available options.');
    }
  }

  static async handlePostback(event) {
    const data = event.postback.data;

    switch (data) {
      case 'REPORT_FIRE':
        return this.startReportFlow(event.replyToken);
      case 'VIEW_ALERTS':
        return this.sendActiveAlerts(event.replyToken);
      case 'SAFETY_TIPS':
        return this.sendSafetyTips(event.replyToken);
      default:
        return Promise.resolve(null);
    }
  }

  static async sendMainMenu(replyToken) {
    const message = {
      type: 'flex',
      altText: 'Main Menu',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            text: 'Wildfire Alert System',
            weight: 'bold',
            size: 'xl',
            color: '#FF0000'
          }]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'postback',
                label: '🔥 Report Fire',
                data: 'REPORT_FIRE'
              },
              color: '#FF0000'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '⚠️ View Active Alerts',
                data: 'VIEW_ALERTS'
              }
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '📋 Safety Tips',
                data: 'SAFETY_TIPS'
              }
            }
          ]
        }
      }
    };

    return client.replyMessage(replyToken, message);
  }

  static async sendWelcomeMessage(replyToken) {
    const message = {
      type: 'flex',
      altText: 'Welcome Message',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'Welcome to Wildfire Alert System!',
              weight: 'bold',
              size: 'xl'
            },
            {
              type: 'text',
              text: 'I can help you report wildfires and receive alerts. Type "menu" to get started.',
              wrap: true,
              margin: 'md'
            }
          ]
        }
      }
    };

    return client.replyMessage(replyToken, message);
  }

  static async replyText(replyToken, text) {
    return client.replyMessage(replyToken, {
      type: 'text',
      text: text
    });
  }
}

module.exports = LineService;