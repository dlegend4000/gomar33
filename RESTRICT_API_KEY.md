# Step-by-Step: Restrict Your Google API Key

## Your API Key
**Key:** `YOUR_GOOGLE_API_KEY_HERE`

## Steps to Restrict It

### 1. Open Google Cloud Console
Go to: **https://console.cloud.google.com/apis/credentials**

### 2. Find Your API Key
- Look for your API key in the credentials list
- Click on it to edit

### 3. Set Application Restrictions

**Select:** "HTTP referrers (web sites)"

**Add these referrers:**
```
https://gomar33-cc75d.web.app/*
https://gomar33-cc75d.firebaseapp.com/*
http://localhost:*
http://127.0.0.1:*
```

**Important:** Include the `/*` at the end for each domain!

### 4. Set API Restrictions

**Select:** "Restrict key"

**Enable ONLY these APIs:**
- ✅ **Generative Language API** (for Gemini and Lyria)
- ❌ Disable all other APIs

### 5. Set Usage Quotas (Recommended)

Click on **"Quotas"** tab:

**Set Daily Limit:**
- Requests per day: `10000` (adjust based on your needs)

**Set Per-Minute Limit:**
- Requests per minute: `100` (prevents abuse)

### 6. Save Changes

Click **"Save"** at the bottom

### 7. Verify It Works

After saving:
1. Wait 1-2 minutes for changes to propagate
2. Test your app at: https://gomar33-cc75d.web.app
3. Try making a music command
4. If it works, restrictions are set correctly!

## What This Does

✅ **Prevents key from being used on other websites**
✅ **Limits which APIs can be called**
✅ **Prevents abuse even if key is extracted**
✅ **Allows monitoring of usage**

## Testing Restrictions

To verify restrictions work:

1. **Test from your domain** (should work):
   - https://gomar33-cc75d.web.app

2. **Test from another domain** (should fail):
   - Try accessing from a different website
   - Should get "API key not valid" error

## Monitoring Usage

Check your API usage:
- Go to: https://console.cloud.google.com/apis/dashboard
- Select "Generative Language API"
- View usage graphs and metrics

## If Something Breaks

If your app stops working after restrictions:

1. **Check referrer format:**
   - Make sure you included `/*` at the end
   - Example: `https://gomar33-cc75d.web.app/*` ✅
   - NOT: `https://gomar33-cc75d.web.app` ❌

2. **Check API restrictions:**
   - Make sure "Generative Language API" is enabled
   - Check if "Lyria RealTime API" needs to be enabled separately

3. **Wait for propagation:**
   - Changes can take 1-5 minutes to take effect

4. **Check browser console:**
   - Look for API key errors
   - Check Network tab for failed requests

## Next Steps

After restricting:
1. ✅ Monitor usage in Google Cloud Console
2. ✅ Set up billing alerts (if using paid tier)
3. ✅ Rotate key periodically (every 90 days recommended)
4. ✅ Review access logs regularly

