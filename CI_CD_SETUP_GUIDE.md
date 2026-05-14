# Step-by-step: deploy this app to AWS yourself

Everything has been rolled back. Your repo still has the CI/CD scaffolding (`.github/workflows/deploy.yml`, `scripts/provision-aws.sh`, `.ebignore`, `.ebextensions/`, `Procfile`, `AWS_DEPLOY.md`) but **no AWS resources exist** and **no GitHub secrets are set**. Follow the steps below to do the whole thing yourself.

---

## Prerequisites — check these once

```bash
# 1. AWS CLI is authenticated
aws sts get-caller-identity
# Should print your account number + user ARN.

# 2. GitHub CLI is signed in
gh auth status
# Should say "Logged in to github.com".

# 3. You're in the project root
cd /Users/Jee/fsd_Project

# 4. You're on main with no uncommitted changes
git status
git branch --show-current     # → main
```

---

## Step 1 — MongoDB Atlas (5 min)

You need a Mongo connection string before anything else.

1. Sign in / sign up at <https://www.mongodb.com/cloud/atlas/register>
2. **Create a free shared cluster (M0)**. Any region; closest to `us-east-1` is best.
3. **Database Access** (left sidebar) → **Add new database user**
   - Authentication method: Password
   - Username + password — write them down
   - Built-in role: "Atlas admin" (fine for this project)
4. **Network Access** → **Add IP Address** → `0.0.0.0/0` (allow from anywhere — required because Beanstalk's outbound IP changes)
5. **Database** → click your cluster → **Connect** → **Drivers** → **Node.js** → copy the connection string. Looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the real password, and add `saffron-table` as the database name:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/saffron-table?retryWrites=true&w=majority
   ```

Save this string — you'll paste it into a command in step 4.

---

## Step 2 — (recommended) set a $1 billing alarm

So you get an email if anything slips out of free tier.

```bash
# Enable billing alerts (one-time):
#   AWS Console → root account → Account → Billing preferences →
#   tick "Receive Billing Alerts" → Save

aws sns create-topic --name billing-alerts
aws sns subscribe \
  --topic-arn "$(aws sns list-topics --query 'Topics[?contains(TopicArn,`billing-alerts`)].TopicArn | [0]' --output text)" \
  --protocol email --notification-endpoint YOUR@EMAIL.COM
# Confirm the subscription via the email AWS sends.

aws cloudwatch put-metric-alarm \
  --alarm-name "Billing > $1" \
  --metric-name EstimatedCharges --namespace AWS/Billing \
  --statistic Maximum --period 21600 --threshold 1 \
  --comparison-operator GreaterThanThreshold --evaluation-periods 1 \
  --dimensions Name=Currency,Value=USD --region us-east-1 \
  --alarm-actions "$(aws sns list-topics --query 'Topics[?contains(TopicArn,`billing-alerts`)].TopicArn | [0]' --output text)"
```

---

## Step 3 — provision all AWS resources

This single script creates: S3 frontend bucket, S3 bundle bucket, CloudFront distribution, Elastic Beanstalk app + environment, IAM deployer user with a least-privilege policy.

```bash
./scripts/provision-aws.sh
```

The script is **idempotent** — re-running it skips anything that already exists. It takes about 5 minutes (most of that is EB launch). When it finishes it prints a summary block — **copy those values**, you'll need them.

Note: the script's EB instance type is **`t2.micro`** (free tier eligible). Don't change it unless you know you've outgrown free tier.

---

## Step 4 — wait for Beanstalk to be ready

EB takes 5–8 minutes to launch. Poll until status is `Ready` and health is `Green`:

```bash
aws elasticbeanstalk describe-environments \
  --application-name saffron-table \
  --environment-names saffron-table-prod \
  --query 'Environments[0].{Status:Status,Health:Health,CNAME:CNAME}' --output table
```

Re-run that command every 30s until you see:
```
Status: Ready · Health: Green · CNAME: saffron-table-prod.eba-XXXX.us-east-1.elasticbeanstalk.com
```

---

## Step 5 — wire `/api/*` through CloudFront → Beanstalk

This makes the API reachable over **HTTPS** through the same domain as the frontend, avoiding mixed-content errors.

```bash
EB_CNAME="$(aws elasticbeanstalk describe-environments \
  --application-name saffron-table --environment-names saffron-table-prod \
  --query 'Environments[0].CNAME' --output text)"

DIST_ID="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='saffron-table-frontend'].Id | [0]" --output text)"

aws cloudfront get-distribution-config --id "$DIST_ID" > /tmp/cf.json
ETAG=$(jq -r '.ETag' /tmp/cf.json)

jq --arg eb "$EB_CNAME" '
  .DistributionConfig.Origins.Quantity = 2 |
  .DistributionConfig.Origins.Items += [{
    "Id": "eb-backend", "DomainName": $eb, "OriginPath": "",
    "CustomHeaders": {"Quantity": 0},
    "CustomOriginConfig": {
      "HTTPPort": 80, "HTTPSPort": 443,
      "OriginProtocolPolicy": "http-only",
      "OriginSslProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]},
      "OriginReadTimeout": 30, "OriginKeepaliveTimeout": 5
    },
    "ConnectionAttempts": 3, "ConnectionTimeout": 10,
    "OriginShield": {"Enabled": false}
  }] |
  .DistributionConfig.CacheBehaviors = {
    "Quantity": 1,
    "Items": [{
      "PathPattern": "/api/*", "TargetOriginId": "eb-backend",
      "TrustedSigners": {"Enabled": false, "Quantity": 0},
      "TrustedKeyGroups": {"Enabled": false, "Quantity": 0},
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {
        "Quantity": 7,
        "Items": ["GET","HEAD","OPTIONS","PUT","POST","PATCH","DELETE"],
        "CachedMethods": {"Quantity": 2, "Items": ["GET","HEAD"]}
      },
      "SmoothStreaming": false, "Compress": true,
      "LambdaFunctionAssociations": {"Quantity": 0},
      "FunctionAssociations": {"Quantity": 0},
      "FieldLevelEncryptionId": "",
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      "OriginRequestPolicyId": "216adef6-5c7f-47e4-b989-5492eafa07d3",
      "GrpcConfig": {"Enabled": false}
    }]
  } | .DistributionConfig
' /tmp/cf.json > /tmp/cf-new.json

aws cloudfront update-distribution --id "$DIST_ID" --if-match "$ETAG" \
  --distribution-config file:///tmp/cf-new.json \
  --query 'Distribution.Status' --output text
```

CloudFront propagates to its global edges in ~5 minutes, but the change works immediately.

---

## Step 6 — set Beanstalk environment variables

Paste your Atlas connection string from Step 1:

```bash
CLOUDFRONT_DOMAIN="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='saffron-table-frontend'].DomainName | [0]" --output text)"

aws elasticbeanstalk update-environment \
  --environment-name saffron-table-prod \
  --option-settings \
    "Namespace=aws:elasticbeanstalk:application:environment,OptionName=MONGODB_URI,Value=mongodb+srv://USER:PASS@cluster.mongodb.net/saffron-table?retryWrites=true&w=majority" \
    "Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET,Value=$(openssl rand -hex 32)" \
    "Namespace=aws:elasticbeanstalk:application:environment,OptionName=CLIENT_URL,Value=https://${CLOUDFRONT_DOMAIN}"
```

Wait until status is back to `Ready` (1–2 min):

```bash
aws elasticbeanstalk describe-environments --environment-names saffron-table-prod \
  --query 'Environments[0].Status' --output text
```

---

## Step 7 — broaden the IAM policy

The base policy from `provision-aws.sh` is too narrow for actual deploys. Add this expanded policy:

```bash
cat > /tmp/deploy-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ProjectS3",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::saffron-table-frontend-*",
        "arn:aws:s3:::saffron-table-frontend-*/*",
        "arn:aws:s3:::saffron-table-eb-bundles-*",
        "arn:aws:s3:::saffron-table-eb-bundles-*/*",
        "arn:aws:s3:::elasticbeanstalk-*",
        "arn:aws:s3:::elasticbeanstalk-*/*"
      ]
    },
    {
      "Sid": "CloudFront",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation","cloudfront:GetDistribution","cloudfront:ListDistributions"],
      "Resource": "*"
    },
    {
      "Sid": "BeanstalkAndDependencies",
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:*", "cloudformation:*", "autoscaling:*",
        "elasticloadbalancing:*", "ec2:Describe*", "ec2:CreateTags",
        "ec2:DeleteTags", "sns:*", "sqs:*", "cloudwatch:*", "logs:*",
        "iam:ListInstanceProfiles", "iam:GetInstanceProfile",
        "iam:PassRole", "iam:GetRole"
      ],
      "Resource": "*"
    }
  ]
}
JSON

POLICY_ARN="$(aws iam list-policies --scope Local \
  --query "Policies[?PolicyName=='saffron-table-deployer-policy'].Arn | [0]" --output text)"

aws iam create-policy-version --policy-arn "$POLICY_ARN" \
  --policy-document file:///tmp/deploy-policy.json --set-as-default
```

---

## Step 8 — create access keys for GitHub Actions

```bash
aws iam create-access-key --user-name saffron-table-deployer
```

**Important: this is the only time you'll see the SecretAccessKey.** Copy both values now.

---

## Step 9 — push 8 GitHub Secrets

```bash
# Collect everything
EB_CNAME="$(aws elasticbeanstalk describe-environments --environment-names saffron-table-prod \
  --query 'Environments[0].CNAME' --output text)"

DIST_ID="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='saffron-table-frontend'].Id | [0]" --output text)"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

# Push them
gh secret set AWS_ACCESS_KEY_ID         --body "<paste-AccessKeyId-from-step-8>"
gh secret set AWS_SECRET_ACCESS_KEY     --body "<paste-SecretAccessKey-from-step-8>"
gh secret set S3_BUCKET                 --body "saffron-table-frontend-${ACCOUNT_ID}"
gh secret set EB_BUNDLE_BUCKET          --body "saffron-table-eb-bundles-${ACCOUNT_ID}"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "$DIST_ID"
gh secret set EB_APP_NAME               --body "saffron-table"
gh secret set EB_ENV_NAME               --body "saffron-table-prod"
gh secret set VITE_API_BASE_URL         --body "/api"

# Verify
gh secret list
```

---

## Step 10 — trigger the deploy

```bash
# Easy way: make any tiny change and push
git commit --allow-empty -m "ci: kick off first deploy"
git push origin main

# Watch the pipeline
gh run watch
```

The pipeline runs three jobs in parallel/series:

1. **build-and-test** — `npm ci`, `npm run build`, Trivy security scan
2. **deploy-frontend** — sync `dist/` to S3, invalidate CloudFront
3. **deploy-backend** — zip + upload, create EB application version, update environment, wait for Ready

Total time: about 3–5 minutes.

---

## Step 11 — verify it's live

```bash
CLOUDFRONT_DOMAIN="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='saffron-table-frontend'].DomainName | [0]" --output text)"

echo "Frontend: https://${CLOUDFRONT_DOMAIN}"
echo

# Health check
curl -s "https://${CLOUDFRONT_DOMAIN}/api/health"
# → {"status":"ok"}

# Login through CloudFront → EB → Atlas
curl -s -X POST "https://${CLOUDFRONT_DOMAIN}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"rhea@example.com","password":"admin123"}' | jq '.user.name'
# → "Rhea Kapoor"
```

Open the frontend URL in your browser. Sign in as:

- Admin: `rhea@example.com` / `admin123`
- Editor: `omar@example.com` / `editor123`
- Viewer: `mina@example.com` / `viewer123`

---

## Daily workflow from here on

```bash
# Edit anything in src/ (frontend) or server/ (backend)
git commit -am "your change"
git push origin main
gh run watch      # ~3-5 min to fully live
```

---

## How to view it all in the AWS Console

Open <https://console.aws.amazon.com/>, region **N. Virginia (us-east-1)**:

| Service | What to look at |
|---|---|
| **GitHub Actions** (web: `https://github.com/Jee8825/fsd_Project/actions`) | Every push triggers a workflow run with three jobs |
| **CloudFront** | Distribution → Behaviors tab (S3 + `/api/*`), Invalidations tab (one per deploy) |
| **S3** | `saffron-table-frontend-*` (hashed JS/CSS bundles), `saffron-table-eb-bundles-*` (backend zip files) |
| **Elastic Beanstalk** | App `saffron-table` → Env `saffron-table-prod` → Events tab (deploy timeline), Application versions (every SHA you pushed) |
| **CloudWatch Logs** | `/aws/elasticbeanstalk/saffron-table-prod/var/log/web.stdout.log` — live Express server output |
| **IAM** | User `saffron-table-deployer` → its policy and current access key |
| **MongoDB Atlas** (`cloud.mongodb.com`) | Cluster0 → Browse Collections → `saffron-table` DB |
| **Billing** | Current bill should stay at $0 for 12 months |

---

## If you get stuck

Each step has a verification command — re-run it. The most common pitfalls:

| Symptom | Fix |
|---|---|
| Pipeline fails at "Configure AWS credentials" | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` are wrong or missing |
| Pipeline fails at "Update EB environment" with permission error | Step 7 was skipped — re-run the broader policy block |
| Frontend loads but API calls fail | Step 5 (CloudFront `/api/*` behavior) didn't propagate yet — wait 5 min, hard-refresh |
| EB env Health is Red | Step 6 (env vars) missing — check `MONGODB_URI` is correct |
| CloudFront returns 403 on every path | The S3 bucket policy granting CloudFront read isn't applied — re-run `./scripts/provision-aws.sh` |

---

## Tear-down (when you're done)

```bash
# Stop EB billing
aws elasticbeanstalk terminate-environment --environment-name saffron-table-prod

# Disable + delete CloudFront (takes ~15 min for the disable to propagate)
DIST_ID="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='saffron-table-frontend'].Id | [0]" --output text)"
aws cloudfront get-distribution-config --id "$DIST_ID" > /tmp/cf.json
ETAG=$(jq -r '.ETag' /tmp/cf.json)
jq '.DistributionConfig.Enabled = false | .DistributionConfig' /tmp/cf.json > /tmp/cf-off.json
aws cloudfront update-distribution --id "$DIST_ID" --if-match "$ETAG" \
  --distribution-config file:///tmp/cf-off.json
# wait ~15 min for status to flip to "Deployed", then:
ETAG=$(aws cloudfront get-distribution-config --id "$DIST_ID" --query ETag --output text)
aws cloudfront delete-distribution --id "$DIST_ID" --if-match "$ETAG"

# Empty + delete buckets
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
aws s3 rm "s3://saffron-table-frontend-${ACCOUNT_ID}" --recursive
aws s3 rb "s3://saffron-table-frontend-${ACCOUNT_ID}"
aws s3 rm "s3://saffron-table-eb-bundles-${ACCOUNT_ID}" --recursive
aws s3 rb "s3://saffron-table-eb-bundles-${ACCOUNT_ID}"

# IAM cleanup
aws iam list-access-keys --user-name saffron-table-deployer \
  --query 'AccessKeyMetadata[*].AccessKeyId' --output text \
  | xargs -n1 -I{} aws iam delete-access-key --user-name saffron-table-deployer --access-key-id {}
POLICY_ARN="$(aws iam list-policies --scope Local \
  --query 'Policies[?PolicyName==`saffron-table-deployer-policy`].Arn | [0]' --output text)"
aws iam detach-user-policy --user-name saffron-table-deployer --policy-arn "$POLICY_ARN"
aws iam delete-policy --policy-arn "$POLICY_ARN"
aws iam delete-user --user-name saffron-table-deployer

# Delete GitHub secrets
for s in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY S3_BUCKET EB_BUNDLE_BUCKET \
         CLOUDFRONT_DISTRIBUTION_ID EB_APP_NAME EB_ENV_NAME VITE_API_BASE_URL; do
  gh secret delete "$s"
done
```

---

That's the full path. Each step is reversible and each step has a verification — you can stop at any point and pick up later.
