# Inspector Demo App

Simple Node.js app untuk demo Amazon Inspector Code Security.

## Vulnerabilities (Intentional untuk Demo)

### SAST Findings:
1. **Hardcoded Secret** - API key di-hardcode di source code
2. **SQL Injection** - User input tidak di-sanitize

### SCA Findings:
- `lodash@4.17.20` - CVE-2021-23337 (Command Injection)
- `axios@0.21.1` - CVE-2021-3749 (ReDoS)
- `express@4.17.1` - Multiple vulnerabilities

## Run Locally

```bash
npm install
npm start
```

## Build Docker

```bash
docker build -t inspector-demo-app .
docker run -p 3000:3000 inspector-demo-app
```

## Endpoints

- `GET /health` - Health check
- `GET /greet?name=John` - Greeting
- `GET /user?id=123` - User lookup (vulnerable)
- `GET /fetch` - Fetch GitHub API
