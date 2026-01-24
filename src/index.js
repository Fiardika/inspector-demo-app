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

// FIXED: Safe calculator - manual parsing, no eval/Function
app.get('/calc', (req, res) => {
  const expr = req.query.expr || '';
  
  // Validate characters without regex on user input (prevent ReDoS)
  const allowedChars = '0123456789+-*/.  ';
  for (const char of expr) {
    if (!allowedChars.includes(char)) {
      return res.status(400).json({ error: 'Invalid expression' });
    }
  }
  
  try {
    // Parse and calculate manually
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/])/g) || [];
    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Empty expression' });
    }
    
    // Simple left-to-right calculation (no operator precedence for simplicity)
    let result = parseFloat(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i];
      const num = parseFloat(tokens[i + 1]);
      if (isNaN(num)) break;
      if (op === '+') result += num;
      else if (op === '-') result -= num;
      else if (op === '*') result *= num;
      else if (op === '/') result = num !== 0 ? result / num : NaN;
    }
    
    res.json({ result });
  } catch (e) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// FIXED: Safe file reader - restrict to allowed directory
const fs = require('fs');
const path = require('path');
const ALLOWED_DIR = path.resolve(__dirname, 'public');
app.get('/file', (req, res) => {
  const filename = req.query.name;
  
  if (!filename) {
    return res.status(400).json({ error: 'Filename required' });
  }
  
  // Resolve full path and verify it's within allowed directory
  const requestedPath = path.resolve(ALLOWED_DIR, filename);
  
  // Security check: ensure resolved path is within ALLOWED_DIR
  if (!requestedPath.startsWith(ALLOWED_DIR + path.sep)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const content = fs.readFileSync(requestedPath, 'utf8');
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

// VULNERABILITY: Server-Side Request Forgery (SSRF)
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  const response = await axios.get(url);
  res.json(response.data);
});

// VULNERABILITY: Hardcoded JWT secret
const JWT_SECRET = "my-super-secret-jwt-key-12345";

// VULNERABILITY: NoSQL Injection simulation
app.get('/search', (req, res) => {
  const query = req.query.q;
  // Simulated MongoDB query - vulnerable to injection
  const filter = JSON.parse(query);
  res.json({ filter, message: 'Search executed' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
