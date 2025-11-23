# Deployment Fix Checklist

## Issues Fixed
1. ✅ OAuth scope missing `admin:repo_hook` - preventing repository connections
2. ⚠️ Missing `ANALYSIS_SERVICE_URL` environment variable - preventing PR analysis

---

## Step 1: Deploy Code Changes

### 1.1 Commit the OAuth Fix
```bash
cd /Users/nehachaudhari/Developer/aicode-review-assistant
git add services/api-service/src/routes/auth.js
git commit -m "Fix OAuth scope: change write:repo_hook to admin:repo_hook for proper webhook permissions"
git push origin main
```

### 1.2 Wait for Render Deployment
- Go to Render dashboard
- Check that `api-service` deployment completes successfully
- Expected time: 2-5 minutes

---

## Step 2: Configure Environment Variables on Render

### 2.1 Add ANALYSIS_SERVICE_URL to github-service

1. Go to Render dashboard
2. Select your **github-service**
3. Navigate to **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `ANALYSIS_SERVICE_URL`
   - **Value:** `https://analysis-service-n34r.onrender.com`
6. Click **Save Changes**
7. Service will auto-redeploy (2-5 minutes)

### 2.2 Verify Other Required Environment Variables

Check that these are set in **github-service**:
- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `WEBHOOK_URL` - Your github-service public URL + `/webhooks/github`
- ✅ `WEBHOOK_SECRET` - Secret for verifying GitHub webhooks
- ✅ `PORT` - Usually 3002
- ✅ `NODE_ENV` - Set to `production`
- ⚠️ `ANALYSIS_SERVICE_URL` - **NEW - Just added above**

---

## Step 3: Test the Fix

### 3.1 Re-Authenticate on Dashboard

**IMPORTANT:** Existing users must re-login to get new permissions.

1. Go to your production dashboard
2. Log out (clear localStorage or sign out)
3. Click "Sign in with GitHub"
4. GitHub will show permission request including:
   - ✅ Read user email
   - ✅ Access repositories
   - ✅ **Manage webhooks** ← NEW PERMISSION
5. Click "Authorize"

### 3.2 Connect a Repository

1. Go to Repositories page
2. Click "Connect" on a test repository
3. **Expected:** Success message, repository appears in connected list
4. **If fails:** Check browser console and Render logs

### 3.3 Create a Test PR

1. In your connected GitHub repository, create a new branch
2. Add/modify a Python file (e.g., `test.py`)
3. Create a Pull Request
4. **Expected:**
   - PR appears on dashboard within 10 seconds
   - Analysis starts automatically
   - Within 1-2 minutes: AI comments appear on GitHub PR (if CRITICAL/HIGH issues found)

---

## Step 4: Verify Database

### 4.1 Check Repository Connection

```sql
-- Check that webhook_id is NOT null
SELECT
  full_name,
  is_active,
  CASE
    WHEN webhook_id IS NULL THEN '❌ NO WEBHOOK'
    ELSE '✅ WEBHOOK REGISTERED'
  END as webhook_status,
  created_at
FROM repositories
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** `webhook_status` = ✅ WEBHOOK REGISTERED

### 4.2 Check Webhook Events

```sql
-- Check that PRs are being received
SELECT
  we.pr_number,
  we.action,
  we.sender_username,
  r.full_name as repository,
  we.received_at
FROM webhook_events we
JOIN repositories r ON we.repository_id = r.id
ORDER BY we.received_at DESC
LIMIT 10;
```

**Expected:** New rows appear when PRs are created/updated

### 4.3 Check Analysis Status

```sql
-- Check that analysis is completing successfully
SELECT
  a.pr_number,
  r.full_name as repository,
  a.status,
  a.started_at,
  a.completed_at,
  CASE
    WHEN a.status = 'completed' THEN '✅ SUCCESS'
    WHEN a.status = 'failed' THEN '❌ FAILED'
    WHEN a.status = 'processing' AND a.started_at < NOW() - INTERVAL '10 minutes' THEN '⚠️ STUCK'
    ELSE '⏳ IN PROGRESS'
  END as health_status
FROM analysis a
JOIN repositories r ON a.repository_id = r.id
ORDER BY a.started_at DESC
LIMIT 10;
```

**Expected:**
- Status = `completed`
- Health status = ✅ SUCCESS

### 4.4 Check GitHub Tokens

```sql
-- Verify users have valid GitHub tokens
SELECT
  github_username,
  email,
  CASE
    WHEN github_token IS NULL THEN '❌ NO TOKEN'
    WHEN LENGTH(github_token) < 20 THEN '⚠️ INVALID TOKEN'
    ELSE '✅ TOKEN EXISTS'
  END as token_status,
  created_at
FROM users
ORDER BY created_at DESC;
```

**Expected:** All users show ✅ TOKEN EXISTS

---

## Step 5: Monitor Logs

### 5.1 GitHub Service Logs (Most Important)

Look for these messages in github-service logs:

**✅ Good Signs:**
```
[INFO] Webhook already exists for owner/repo, returning existing ID: 12345
[START] Starting analysis for PR #123 in owner/repo
[PYTHON] Found 3 Python files in PR (skipped migrations/tests)
[FILE 1/3] Processing: main.py
[ANALYZE] Analyzing Python file: main.py
[SUCCESS] Analysis complete: 5 vulnerabilities found
[SECURITY] Posted critical/high severity comment (2/5 issues)
```

**❌ Bad Signs:**
```
[ERROR] GitHub token not found for user
[ERROR] Analysis failed for main.py: connect ECONNREFUSED
[ERROR] Repository not found in database
[SKIP] No Python files found in this PR
```

### 5.2 API Service Logs

Look for:
```
POST /api/repositories/connect 200
Webhook registered successfully: ID 12345
```

### 5.3 Analysis Service Logs

Look for:
```
POST /api/analysis/analyze 200
Analyzing code for repository: owner/repo PR #123
Analysis completed: 5 vulnerabilities detected
```

---

## Troubleshooting

### Issue: "Repository connection failed"

**Check:**
1. User re-authenticated with new OAuth scopes?
2. GitHub token exists in database?
3. `WEBHOOK_URL` environment variable is set correctly?
4. Repository is accessible (not private without proper permissions)?

**Fix:**
- Re-login to get new token
- Check github-service logs for specific error

---

### Issue: "PR detected but no analysis"

**Check:**
1. `ANALYSIS_SERVICE_URL` environment variable set?
2. Analysis service is running and healthy?
3. PR contains Python files (not just tests/migrations)?

**Test Analysis Service:**
```bash
curl https://analysis-service-n34r.onrender.com/health
```

Expected: `{"status":"healthy"}`

**Fix:**
- Add `ANALYSIS_SERVICE_URL` environment variable
- Check analysis-service logs on Render

---

### Issue: "Analysis stuck in 'processing' status"

**Possible Causes:**
1. Analysis service timeout (10 minute limit)
2. Large files causing memory issues
3. Analysis service crashed during processing

**Fix:**
```sql
-- Reset stuck analysis
UPDATE analysis
SET status = 'failed'
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '10 minutes';
```

Then create a new PR or push to existing PR to retry.

---

### Issue: "AI not commenting on GitHub"

**Check:**
1. Analysis completed successfully? (status = 'completed')
2. Vulnerabilities found are CRITICAL or HIGH severity?
   - Only these severities post to GitHub
   - Medium/Low are only in email notifications
3. GitHub token has proper permissions?

**Fix:**
- Medium/Low issues won't post - this is expected behavior
- Check github-service logs for comment posting errors

---

## Success Criteria

All of these should be true after deployment:

- ✅ Users can log in via GitHub OAuth
- ✅ Users can connect repositories from dashboard
- ✅ `repositories.webhook_id` is NOT null
- ✅ PRs appear in dashboard when created
- ✅ Analysis completes within 2-3 minutes
- ✅ CRITICAL/HIGH issues get GitHub comments
- ✅ No errors in github-service logs

---

## Rollback Plan (If Something Goes Wrong)

### Revert OAuth Scope Change
```bash
cd /Users/nehachaudhari/Developer/aicode-review-assistant
git revert HEAD
git push origin main
```

### Remove Environment Variable
1. Go to Render dashboard
2. Select github-service
3. Remove `ANALYSIS_SERVICE_URL` variable
4. Note: This will break analysis in production

---

## Next Steps After Successful Deployment

1. Monitor first few PRs closely
2. Check logs for any unexpected errors
3. Verify GitHub comments are posting correctly
4. Consider adding:
   - Email notifications for failed analyses
   - Slack/Discord webhook for alerts
   - Health check dashboard
   - Retry mechanism for failed analyses

---

## Contact Info

If issues persist after following this checklist:
- Check Render service logs for detailed errors
- Review GitHub webhook delivery attempts in repo settings
- Verify PostgreSQL connection is stable
- Ensure all services are on the same Render region for low latency
