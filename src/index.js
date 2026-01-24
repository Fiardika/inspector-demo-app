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

// New feature: Get server time
app.get('/time', (req, res) => {
  const now = new Date();
  res.json({
    utc: now.toUTCString(),
    iso: now.toISOString(),
    timestamp: now.getTime()
  });
});

// FIXED: Safe calculator - only allows numbers and basic operators
app.get('/calc', (req, res) => {
  const expression = req.query.expr || '';
  // Whitelist: only digits, +, -, *, /, ., (, ), spaces
  if (!/^[\d+\-*/().\s]+$/.test(expression)) {
    return res.status(400).json({ error: 'Invalid expression' });
  }
  try {
    const result = Function('"use strict"; return (' + expression + ')')();
    res.json({ result });
  } catch (e) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// FIXED: Safe file reader - restrict to allowed directory
const fs = require('fs');
const path = require('path');
const ALLOWED_DIR = path.join(__dirname, 'public');
app.get('/file', (req, res) => {
  const filename = req.query.name;
  const safePath = path.join(ALLOWED_DIR, path.basename(filename));
  
  if (!safePath.startsWith(ALLOWED_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const content = fs.readFileSync(safePath, 'utf8');
    res.send(content);
  } catch (e) {
    res.status(404).json({ error: 'File not found' });
  }
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
