module.exports = {
  // Monitoring settings
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsRetentionHours: parseInt(process.env.METRICS_RETENTION_HOURS || '24'),
    alertingEnabled: process.env.ALERTING_ENABLED !== 'false',
  },
  
  // Performance thresholds
  thresholds: {
    responseTime: parseInt(process.env.THRESHOLD_RESPONSE_TIME || '2000'), // 2s
    errorRate: parseFloat(process.env.THRESHOLD_ERROR_RATE || '5'), // 5%
    memoryUsage: parseFloat(process.env.THRESHOLD_MEMORY_USAGE || '85'), // 85%
    diskUsage: parseFloat(process.env.THRESHOLD_DISK_USAGE || '90'), // 90%
    cpuUsage: parseFloat(process.env.THRESHOLD_CPU_USAGE || '80'), // 80%
  },
  
  // Alerting configuration
  alerting: {
    channels: (process.env.ALERT_CHANNELS || 'console').split(','),
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(','),
    slackWebhook: process.env.ALERT_SLACK_WEBHOOK,
  },
  
  // Health check settings
  healthChecks: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30s
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '10000'), // 10s
    retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3'),
  },
};
