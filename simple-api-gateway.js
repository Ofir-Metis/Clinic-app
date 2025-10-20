const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-emergency'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Healthcare Clinic Platform - Emergency API Gateway',
    status: 'operational',
    version: '1.0.0-emergency',
    frontend: 'http://localhost:5173',
    health: '/health'
  });
});

// Proxy to working services
const services = {
  '/api/auth': 'http://localhost:3001',
  '/api/files': 'http://localhost:3003', 
  '/api/notes': 'http://localhost:3006',
  '/api/notifications': 'http://localhost:3004'
};

// Setup proxies for working services
Object.entries(services).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${path}`]: ''
    },
    onError: (err, req, res) => {
      console.log(`Proxy error for ${path}:`, err.message);
      res.status(503).json({
        error: 'Service Unavailable',
        service: path,
        message: `Backend service at ${target} is not responding`
      });
    }
  }));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Emergency API Gateway running on port ${PORT}`);
  console.log(`🎯 Available services:`);
  console.log(`   Frontend: http://localhost:5173`);
  console.log(`   API: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`\n🔧 Working service proxies:`);
  Object.entries(services).forEach(([path, target]) => {
    console.log(`   ${path} -> ${target}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down Emergency API Gateway...');
  process.exit(0);
});