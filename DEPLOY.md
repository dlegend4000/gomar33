# Firebase Deployment Guide

This guide will help you deploy both the frontend and backend to Firebase.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged into Firebase: `firebase login`
3. Firebase project initialized: `gomar33-cc75d`

## Step 1: Set Up Environment Variables

### For Firebase Functions (Backend)

Set the Google API key for Firebase Functions:

```bash
firebase functions:config:set google.api_key="YOUR_GOOGLE_API_KEY"
```

Or if using Firebase Functions v2+ (secrets):

```bash
firebase functions:secrets:set GOOGLE_API_KEY
```

Then enter your API key when prompted.

**Note:** Replace `YOUR_GOOGLE_API_KEY` with your actual API key from Google Cloud Console.

### For Frontend (Hosting)

The frontend environment variables are baked into the build. Make sure your `.env` file has:
- `VITE_GOOGLE_API_KEY` - For Lyria playback
- `VITE_CLERK_PUBLISHABLE_KEY` - For authentication (optional)

These are included in the build when you run `npm run build:client`.

## Step 2: Build Everything

Build both frontend and backend:

```bash
npm run build:client
npm run build:functions
```

Or build everything at once:

```bash
npm run build
```

## Step 3: Deploy

### Deploy Everything (Recommended)

```bash
npm run deploy:all
```

Or deploy individually:

```bash
# Deploy only hosting (frontend)
npm run deploy:hosting

# Deploy only functions (backend)
npm run deploy:functions
```

### Manual Deployment

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

## Step 4: Verify Deployment

After deployment, your app will be available at:
- **Frontend:** `https://gomar33-cc75d.web.app` (or your custom domain)
- **API Endpoints:**
  - `https://gomar33-cc75d.web.app/api/health`
  - `https://gomar33-cc75d.web.app/api/interpret`
  - `https://gomar33-cc75d.web.app/api/interpret/first`
  - `https://gomar33-cc75d.web.app/api/interpret/modify`

## Troubleshooting

### Functions Not Deploying

1. Check you're logged in: `firebase login`
2. Verify project: `firebase projects:list`
3. Check function logs: `firebase functions:log`

### Environment Variables Not Working

1. For Functions: Check config with `firebase functions:config:get`
2. For Frontend: Rebuild after changing `.env` file
3. Clear cache: `npm run build:client` again

### API Routes Not Working

1. Check `firebase.json` rewrites are correct
2. Verify functions are deployed: `firebase functions:list`
3. Check function logs for errors

## Quick Deploy Command

```bash
# Set API key (one time) - Replace YOUR_GOOGLE_API_KEY with your actual key
firebase functions:config:set google.api_key="YOUR_GOOGLE_API_KEY"

# Deploy everything
npm run deploy:all
```

