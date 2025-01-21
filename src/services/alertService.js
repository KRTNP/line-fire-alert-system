const db = require('../config/database');
const { client } = require('../config/line');
const logger = require('../utils/logger');

class AlertService {
  static async createAlert(data) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create alert record
      const alertQuery = `
        INSERT INTO alerts (location, description, severity, status)
        VALUES ($1, $2, $3, 'active')
        RETURNING *
      `;
      
      const alertResult = await client.query(alertQuery, [
        data.location,
        data.description,
        data.severity
      ]);

      // Get all users to notify
      const users = await client.query('SELECT line_user_id FROM users');

      await client.query('COMMIT');
      
      // Send LINE notifications asynchronously
      this.broadcastAlert(alertResult.rows[0], users.rows);
      
      return alertResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating alert:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getActiveAlerts() {
    try {
      const query = `
        SELECT * FROM alerts 
        WHERE status = 'active' 
        ORDER BY created_at DESC
      `;
      
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active alerts:', error);
      throw error;
    }
  }

  static async broadcastAlert(alert, users) {
    const message = this.createAlertMessage(alert);

    for (const user of users) {
      try {
        await client.pushMessage(user.line_user_id, message);
      } catch (error) {
        logger.error(`Failed to send alert to user ${user.line_user_id}:`, error);
      }
    }
  }

  static createAlertMessage(alert) {
    return {
      type: 'flex',
      altText: 'Wildfire Alert',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [{
            type: 'text',
            text: '🔥 Wildfire Alert',
            weight: 'bold',
            size: 'xl',
            color: '#FF0000'
          }]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `Location: ${alert.location}`,
              wrap: true
            },
            {
              type: 'text',
              text: alert.description,
              wrap: true,
              margin: 'md'
            },
            {
              type: 'text',
              text: `Severity: ${alert.severity}/5`,
              margin: 'md',
              color: '#FF0000'
            }
          ]
        }
      }
    };
  }
}

module.exports = AlertService;