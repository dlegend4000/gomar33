# API Key Security Guide

## Current Situation

The Google API key is visible in WebSocket connections because the Google GenAI SDK connects directly from the browser to Google's servers. This is a limitation of the current architecture.

## Solution: Restrict API Key in Google Cloud Console

**This is the most important security measure you can take.**

### Steps to Restrict Your API Key:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Find your API key: `AIzaSyBHs5rrDMZOHTqGRKf-U81846ZJEF362Ww`

2. **Click on the API key to edit it**

3. **Set Application Restrictions:**
   - Select "HTTP referrers (web sites)"
   - Add your Firebase Hosting domain:
     - `https://gomar33-cc75d.web.app/*`
     - `https://gomar33-cc75d.firebaseapp.com/*`
   - For local development, add:
     - `http://localhost:*`
     - `http://127.0.0.1:*`

4. **Set API Restrictions:**
   - Select "Restrict key"
   - Only enable:
     - **Generative Language API** (for Gemini)
     - **Lyria RealTime API** (if available as separate service)
   - Disable all other APIs

5. **Set Usage Quotas (Optional but Recommended):**
   - Go to "Quotas" tab
   - Set daily/monthly limits to prevent abuse
   - Set requests per minute limits

6. **Save Changes**

### What This Does:

- ✅ Prevents the API key from being used from other domains
- ✅ Limits which APIs can be called
- ✅ Prevents abuse even if someone extracts the key
- ✅ Allows you to monitor usage

### Important Notes:

- The API key will still be visible in WebSocket URLs, but it will only work from your domain
- If someone copies the key, they can't use it from their own website
- You can rotate the key anytime without rebuilding the frontend

## Alternative: WebSocket Proxy (Advanced)

For complete security, you would need to:
1. Deploy a WebSocket proxy server (Cloud Run)
2. Modify the Google GenAI SDK to connect to your proxy
3. Proxy all messages between client and Google

This is complex and requires reverse-engineering the WebSocket protocol. The API key restriction approach above is the recommended solution.

## Monitoring

Monitor your API key usage:
- Go to: https://console.cloud.google.com/apis/dashboard
- Check "Generative Language API" usage
- Set up alerts for unusual activity

