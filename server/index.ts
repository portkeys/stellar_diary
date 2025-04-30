// This is a proxy TypeScript file that simply redirects to our Python server
// It's used to prevent the npm run dev command from failing

import * as http from 'http';
import * as https from 'https';
import { spawn } from 'child_process';

console.log("Starting proxy server for Python backend...");
console.log("Front-end code should use the Vite development server's proxy configuration");
console.log("to communicate with the Python server running on port 5000.");

// Start Python server if it's not already running
// Use process.cwd() to ensure we're using the absolute path
const pythonProcess = spawn('python', [process.cwd() + '/run.py']);

pythonProcess.stdout.on('data', (data: Buffer) => {
  console.log(`Python server output: ${data.toString()}`);
});

pythonProcess.stderr.on('data', (data: Buffer) => {
  console.error(`Python server error: ${data.toString()}`);
});

pythonProcess.on('close', (code: number | null) => {
  console.log(`Python server process exited with code ${code}`);
});

// Create a simple proxy server
const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes: http.IncomingMessage) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e: Error) => {
    console.error(`Proxy request error: ${e.message}`);
    res.statusCode = 500;
    res.end(`Proxy error: ${e.message}`);
  });

  req.pipe(proxyReq, { end: true });
});

// Listen on port 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`TypeScript proxy server running at http://localhost:${PORT}`);
  console.log(`Forwarding requests to Python server at http://localhost:5000`);
});

// Handle SIGINT
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  server.close();
  pythonProcess.kill();
  process.exit(0);
});