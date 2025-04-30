// This is a proxy TypeScript file that redirects to our Python server
// and serves a navigation page at the root

import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
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

// Create a server that handles navigation and proxies API requests
const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = req.url || '/';
  
  // Serve our navigation page at the root
  if (url === '/') {
    fs.readFile(path.join(process.cwd(), 'public', 'index.html'), (err, data) => {
      if (err) {
        // If we can't find our navigation page, proxy to Python server
        proxyRequest(req, res);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }
  
  // Handle API requests by proxying to Python server
  if (url.startsWith('/api')) {
    proxyRequest(req, res);
    return;
  }
  
  // For any other requests, redirect to the Vite server
  res.writeHead(302, { 'Location': `http://localhost:5173${url}` });
  res.end();
});

function proxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
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
}

// Listen on port 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`TypeScript proxy server running at http://localhost:${PORT}`);
  console.log(`Forwarding API requests to Python server at http://localhost:5000`);
  console.log(`Serving navigation page at http://localhost:${PORT}`);
  console.log(`Redirecting app requests to Vite server at http://localhost:5173`);
});

// Handle SIGINT
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  server.close();
  pythonProcess.kill();
  process.exit(0);
});