const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mock user endpoint (simulates DEV_AUTH_BYPASS=true)
app.get('/me', (req, res) => {
  res.json({
    sub: 'test-user-123',
    roles: ['user', 'designer'],
    features: ['drc', 'analytics']
  });
});

// Mock DRC run endpoint
app.post('/drc/run', (req, res) => {
  const { id, name, cores } = req.body;

  // Simulate some processing time
  setTimeout(() => {
    // Mock DRC results
    const findings = Math.random() > 0.7 ? [
      {
        code: 'WIRE_LENGTH',
        message: 'Wire length exceeds recommended maximum',
        severity: 'warn',
        path: 'wire.1'
      }
    ] : [];

    res.json({
      design_id: id,
      findings: findings,
      severity_summary: {
        info: findings.filter(f => f.severity === 'info').length,
        warn: findings.filter(f => f.severity === 'warn').length,
        error: findings.filter(f => f.severity === 'error').length
      }
    });
  }, 500); // 500ms delay to simulate processing
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /me');
  console.log('  POST /drc/run');
});