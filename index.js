const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Only handle /ping endpoint
  if (req.url === '/ping' && (req.method === 'GET' || req.method === 'POST')) {
    console.log(`[${new Date().toISOString()}] Received request to /ping`);
    
    // Send response immediately to client
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      status: 'success', 
      message: 'Ping received and forwarded',
      timestamp: new Date().toISOString()
    }));

    // Send request to external website (fire and forget)
    const externalUrl = 'https://docker-atlx.onrender.com';
    
    const options = {
      method: 'GET',
      timeout: 5000 // 5 second timeout
    };

    const externalReq = https.request(externalUrl, options, (externalRes) => {
      // Just log the response, don't wait for it
      console.log(`[${new Date().toISOString()}] External request sent, status: ${externalRes.statusCode}`);
    });

    externalReq.on('error', (err) => {
      // Log errors but don't affect the main response
      console.log(`[${new Date().toISOString()}] External request error: ${err.message}`);
    });

    externalReq.on('timeout', () => {
      console.log(`[${new Date().toISOString()}] External request timeout`);
      externalReq.destroy();
    });

    externalReq.end();

  } else {
    // Handle other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'error', 
      message: 'Endpoint not found. Use /ping' 
    }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Send requests to: http://localhost:${PORT}/ping`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
