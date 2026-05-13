# AWS CI/CD Deployment — CodePipeline + CodeBuild + Elastic Beanstalk

This project ships with everything CodePipeline needs to build and deploy the
Saffron Table app (React frontend + Node/Express backend) to Elastic Beanstalk.

```
GitHub push  ─►  CodePipeline (Source)
                     │
                     ▼
                CodeBuild  ── reads  buildspec.yml
                     │       runs `npm ci` + `npm run build`
                     ▼
            Elastic Beanstalk  ── reads  Procfile + .ebextensions/ + .platform/
                     │       runs `node server/src/index.js`
                     ▼
              https://<env>.<region>.elasticbeanstalk.com
```

## Files added to the repo

| File | Purpose |
|---|---|
| `buildspec.yml`              | Tells CodeBuild how to install, build, and package the app. |
| `Procfile`                   | Tells Elastic Beanstalk the start command (`node server/src/index.js`). |
| `.ebextensions/*.config`     | EB option settings — Node command, env vars, health check path. |
| `.platform/nginx/conf.d/`    | EB Nginx tweaks (body size, timeouts). |
| `.ebignore`                  | Excludes local-only files from the deploy bundle. |
| `aws/pipeline.cfn.yml`       | CloudFormation template that creates the entire pipeline. |

A small block was added to `server/src/app.js` that serves `dist/` (the Vite
build) when `NODE_ENV=production`, so a single EB environment serves both API
and SPA.

---

## One-time AWS setup

You need three things in AWS before deploying:

### 1. Elastic Beanstalk application + environment

In the AWS Console → **Elastic Beanstalk → Create application**:

- Platform: **Node.js 20** running on Amazon Linux 2023
- Application code: **Sample application** (just to bootstrap; the pipeline
  will replace it on the first run)
- Environment name: e.g. `saffron-table-env`
- Application name: e.g. `saffron-table`

Once created, open **Configuration → Updates, monitoring, and logging →
Environment properties** and add:

| Key             | Value |
|-----------------|-------|
| `MONGODB_URI`   | your MongoDB Atlas connection string |
| `JWT_SECRET`    | a long random string |
| `CLIENT_URL`    | `https://<your-env>.<region>.elasticbeanstalk.com` |
| `NODE_ENV`      | `production` |

> **Why MongoDB Atlas?** EB instances are ephemeral. Use Atlas (free tier is
> fine) or a separate Mongo instance — do not rely on `mongo-data/`.

### 2. GitHub CodeConnections connection

In **Developer Tools → Settings → Connections → Create connection**:

- Provider: **GitHub**
- Authorize AWS to access your repo
- Copy the resulting **Connection ARN**

### 3. Deploy the pipeline via CloudFormation

```bash
aws cloudformation deploy \
  --template-file aws/pipeline.cfn.yml \
  --stack-name saffron-table-pipeline \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    GitHubConnectionArn=<paste-connection-arn> \
    GitHubOwner=<your-github-username> \
    GitHubRepo=fsd_Project \
    GitHubBranch=main \
    EBApplicationName=saffron-table \
    EBEnvironmentName=saffron-table-env
```

CloudFormation prints `PipelineConsoleUrl` in its Outputs tab. Open it to watch
the pipeline run.

> Prefer clicking? You can build the same thing in **CodePipeline → Create
> pipeline** with Source = GitHub (via connection), Build = new CodeBuild
> project pointing at `buildspec.yml`, Deploy = Elastic Beanstalk. The
> CloudFormation template is just a reproducible version of those clicks.

---

## How to verify it works

### A. Watch the pipeline run

1. Push any commit to `main` (or click **Release change** in the pipeline view).
2. AWS Console → **CodePipeline → saffron-table-pipeline**.
3. Each of the three stages — Source, Build, Deploy — should turn green within
   ~5–8 minutes on first run.
4. Click the Build stage → **Details** to see CodeBuild logs. You should see
   `npm ci`, `npm run build`, and `Build finished on …`.

### B. Hit the deployed app

After the Deploy stage goes green:

1. AWS Console → **Elastic Beanstalk → saffron-table-env**.
2. The environment **URL** is shown at the top, e.g.
   `http://saffron-table-env.eba-xxxx.us-east-1.elasticbeanstalk.com`.
3. From your terminal:

   ```bash
   # 1. Health endpoint — proves the API is up.
   curl -i http://<env-url>/api/health
   # expect: HTTP/1.1 200 OK   {"status":"ok"}

   # 2. SPA — proves the Vite build is being served.
   curl -i http://<env-url>/
   # expect: 200 OK and HTML containing <div id="root">
   ```

4. Open the URL in a browser — the React app should load and talk to `/api/*`
   on the same origin.

### C. Confirm the loop end-to-end

Make a visible change and prove it shipped automatically:

```bash
# Edit something obvious, e.g. the document title in index.html.
git add -A && git commit -m "ci: test pipeline"
git push origin main
```

Watch CodePipeline turn green, then hard-refresh the EB URL. Your change is
live without any manual deploy step — that confirms the full pipeline is
working.

### D. If something fails

| Stage | Where to look |
|---|---|
| Source  | CodePipeline → Source action → check connection is "Available" |
| Build   | CodeBuild → Build history → latest → **Phase details / Logs** |
| Deploy  | EB Console → Environment → **Logs → Request last 100 lines** |
| Runtime | EB Console → Environment → **Health** and `/var/log/web.stdout.log` |

Common gotchas:
- **Health check red** → environment variable `MONGODB_URI` not set, or Atlas
  IP allow-list is blocking EB. In Atlas, allow `0.0.0.0/0` for a quick test.
- **502 from Nginx** → app crashed at boot. Check `web.stdout.log`.
- **CORS errors** → set `CLIENT_URL` to the EB URL.

---

## Local smoke test (optional, before pushing)

You can simulate the production server locally:

```bash
npm ci
npm run build               # produces dist/
NODE_ENV=production node server/src/index.js
# then visit http://localhost:5000  — SPA + API both served
```

If that works locally, the EB deployment will work too — they run the same
command.
