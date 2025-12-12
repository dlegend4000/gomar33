/**
 * WebSocket Proxy Server for Lyria RealTime API
 * 
 * This server proxies WebSocket connections between the client and Google's Lyria API,
 * keeping the API key on the server side.
 * 
 * Deploy to Cloud Run:
 * gcloud run deploy lyria-proxy --source . --region us-central1 --allow-unauthenticated
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('ERROR: GOOGLE_API_KEY environment variable is not set');
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lyria-websocket-proxy' });
});

const server = http.createServer(app);

// WebSocket server for client connections
const wss = new WebSocketServer({ 
  server,
  path: '/ws/lyria'
});

wss.on('connection', (clientWs, req) => {
  console.log('Client connected');

  // Connect to Google's Lyria WebSocket with API key
  const googleWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateMusic?key=${GOOGLE_API_KEY}`;
  
  const googleWs = new WebSocket(googleWsUrl);

  // Forward messages from client to Google
  clientWs.on('message', (data) => {
    if (googleWs.readyState === WebSocket.OPEN) {
      googleWs.send(data);
    }
  });

  // Forward messages from Google to client
  googleWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });

  // Handle errors
  clientWs.on('error', (error) => {
    console.error('Client WebSocket error:', error);
    googleWs.close();
  });

  googleWs.on('error', (error) => {
    console.error('Google WebSocket error:', error);
    clientWs.close();
  });

  // Handle close
  clientWs.on('close', () => {
    console.log('Client disconnected');
    googleWs.close();
  });

  googleWs.on('close', () => {
    console.log('Google WebSocket closed');
    clientWs.close();
  });

  googleWs.on('open', () => {
    console.log('Connected to Google Lyria API');
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket proxy server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws/lyria`);
});

