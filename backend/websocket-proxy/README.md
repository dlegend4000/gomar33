# Lyria WebSocket Proxy

This service proxies WebSocket connections to Google's Lyria RealTime API, keeping the API key on the server side.

## Deployment to Cloud Run

```bash
# Set your API key
export GOOGLE_API_KEY=your_api_key_here

# Deploy to Cloud Run
gcloud run deploy lyria-proxy \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --port 8080

# Get the service URL
gcloud run services describe lyria-proxy --region us-central1 --format 'value(status.url)'
```

## Update Frontend

After deploying, update `src/lib/lyriaMusic.ts` to connect to your proxy instead of Google directly.

