/**
 * Vulnerable Demo Code for Inspector Code Security Testing
 * DO NOT USE IN PRODUCTION
 */

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

const app = express();

// ============================================
// SAST VULNERABILITIES
// ============================================

// CWE-798: Hardcoded Credentials
const DB_PASSWORD = "SuperSecret123!";
const API_KEY = "sk-live-abcdef123456789";
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const JWT_SECRET = "my-jwt-secret-key";

// CWE-94: Code Injection (eval)
app.get('/eval', (req, res) => {
  const code = req.query.code;
  const result = eval(code);
  res.json({ result });
});

// CWE-78: Command Injection
app.get('/exec', (req, res) => {
  const cmd = req.query.cmd;
  exec(cmd, (err, stdout) => {
    res.send(stdout);
  });
});

// CWE-89: SQL Injection
app.get('/user', (req, res) => {
  const id = req.query.id;
  const query = `SELECT * FROM users WHERE id = '${id}'`;
  res.json({ query });
});

// CWE-22: Path Traversal
app.get('/file', (req, res) => {
  const filename = req.query.name;
  const content = fs.readFileSync(filename, 'utf8');
  res.send(content);
});

// CWE-79: Cross-Site Scripting (XSS)
app.get('/greet', (req, res) => {
  const name = req.query.name;
  res.send(`<html><body><h1>Hello ${name}</h1></body></html>`);
});

// CWE-918: Server-Side Request Forgery (SSRF)
const axios = require('axios');
app.get('/fetch', async (req, res) => {
  const url = req.query.url;
  const response = await axios.get(url);
  res.json(response.data);
});

// CWE-327: Weak Cryptography
app.get('/hash', (req, res) => {
  const data = req.query.data;
  const hash = crypto.createHash('md5').update(data).digest('hex');
  res.json({ hash });
});

// CWE-502: Deserialization
app.post('/parse', (req, res) => {
  const data = req.body.data;
  const obj = JSON.parse(data);
  res.json(obj);
});

// CWE-611: XML External Entity (XXE) - if using xml parser
// CWE-1004: Cookie without HttpOnly
app.get('/login', (req, res) => {
  res.cookie('session', 'abc123', { httpOnly: false });
  res.send('Logged in');
});

// CWE-614: Cookie without Secure flag
app.get('/auth', (req, res) => {
  res.cookie('token', 'xyz789', { secure: false });
  res.send('Authenticated');
});

module.exports = app;
