const express = require('express');
const _ = require('lodash');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// VULNERABILITY (SAST): Hardcoded secret - Inspector akan detect ini
const API_KEY = "sk-secret-api-key-12345-do-not-share";

app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// VULNERABILITY (SAST): SQL Injection - user input langsung dipakai
app.get('/user', (req, res) => {
  const userId = req.query.id;
  // Simulasi query - ini vulnerable karena tidak di-sanitize
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  console.log('Executing query:', query);
  res.json({ message: 'User lookup simulated', query });
});

// Endpoint normal
app.get('/greet', (req, res) => {
  const name = _.escape(req.query.name || 'Guest');
  res.json({ greeting: `Hello, ${name}!` });
});

// VULNERABILITY (SAST): Another hardcoded secret for demo
const DB_PASSWORD = "super_secret_password_123!";

// New feature: Get server time
app.get('/time', (req, res) => {
  const now = new Date();
  res.json({
    utc: now.toUTCString(),
    iso: now.toISOString(),
    timestamp: now.getTime()
  });
});

// VULNERABILITY (SAST): Command injection - user input ke exec
const { exec } = require('child_process');
app.get('/ping', (req, res) => {
  const host = req.query.host;
  exec(`ping -c 1 ${host}`, (error, stdout) => {
    res.send(stdout || error.message);
  });
});

// New feature: Random number generator
app.get('/random', (req, res) => {
  const min = parseInt(req.query.min) || 1;
  const max = parseInt(req.query.max) || 100;
  const random = Math.floor(Math.random() * (max - min + 1)) + min;
  res.json({ min, max, result: random });
});

// Fetch external data
app.get('/fetch', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com');
    res.json({ github_api: response.data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
