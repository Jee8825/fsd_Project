# AWS CI/CD setup — saffron-table

## Architecture

```
git push main
      │
      ▼
┌──────────────────────┐
│  GitHub Actions      │  .github/workflows/deploy.yml
│  (build / scan)      │
└────┬────────────┬────┘
     │            │
     ▼            ▼
┌──────────┐  ┌─────────────────────┐
│  S3 +    │  │  Elastic Beanstalk  │
│ CloudFront│  │  (Node 20 / nginx) │
│  (React)  │  │  (Express + Mongo) │
└──────────┘  └──────────┬──────────┘
                         │
                         ▼
                  MongoDB Atlas
```

## One-time setup (about 20 minutes total)

### 1. Sign up for MongoDB Atlas
1. Open <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Create a **free shared cluster** (M0, 512 MB).
3. Under **Database Access** → create a user (note the username and password).
4. Under **Network Access** → add `0.0.0.0/0` (allow from anywhere). Tighten this later if needed.
5. **Connect** → "Drivers" → copy the connection string. It looks like:
   `mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/saffron-table?retryWrites=true&w=majority`
6. Save this string — you'll paste it into Beanstalk env vars in step 4.

### 2. Run the AWS provisioning script
This creates: S3 frontend bucket, S3 bundle bucket, CloudFront distribution, EB application, EB environment, IAM user with deploy policy.
```bash
cd /Users/Jee/fsd_Project
./scripts/provision-aws.sh
```
At the end it prints a summary block — copy those values, you'll need them in step 5.

> **Cost note — designed to run free:**
>
> | Resource | Free tier | After free tier |
> |---|---|---|
> | EC2 `t2.micro` (Beanstalk) | 750 hrs/month for 12 months | ~$8.50/month |
> | S3 (frontend + bundles) | 5 GB + 20k GETs/month for 12 months | ~$0.10/month at this size |
> | CloudFront | **1 TB egress + 10M requests/month forever** | $0 at project scale |
> | Elastic Beanstalk service | always free (you only pay for the EC2) | always free |
> | MongoDB Atlas (M0) | 512 MB **forever** | always free |
> | IAM, CloudWatch basic | always free | always free |
>
> Total during the 12-month new-account free tier: **$0/month**.
> After the free year, the only thing that starts billing is the t2.micro (~$8.50/month). Set a billing alarm to be safe — see "Set a $1 billing alarm" below.

### 3. Get the EB environment's public URL
EB takes 5–8 min to finish provisioning. When it's ready:
```bash
aws elasticbeanstalk describe-environments \
  --application-name saffron-table \
  --environment-names saffron-table-prod \
  --query 'Environments[0].{Status:Status,Health:Health,CNAME:CNAME}'
```
Wait until `Status: Ready, Health: Green`. The `CNAME` is your backend URL, something like `saffron-table-prod.eba-xxxxxx.us-east-1.elasticbeanstalk.com`.

### 4. Set Beanstalk environment variables
The backend needs `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`. Set them on the EB environment:
```bash
EB_CNAME="$(aws elasticbeanstalk describe-environments \
  --application-name saffron-table --environment-names saffron-table-prod \
  --query 'Environments[0].CNAME' --output text)"

CLOUDFRONT_DOMAIN="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='saffron-table-frontend'].DomainName | [0]" --output text)"

aws elasticbeanstalk update-environment \
  --environment-name saffron-table-prod \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=MONGODB_URI,Value="mongodb+srv://USER:PASS@cluster.mongodb.net/saffron-table" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET,Value="$(openssl rand -hex 32)" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=CLIENT_URL,Value="https://${CLOUDFRONT_DOMAIN}"
```
Replace `USER:PASS@cluster.mongodb.net/saffron-table` with your real Atlas connection string from step 1.

### 5. Create access keys + push GitHub Secrets
```bash
aws iam create-access-key --user-name saffron-table-deployer
# Note the AccessKeyId and SecretAccessKey — they're shown ONCE.
```

Now register every secret with GitHub using the `gh` CLI:
```bash
cd /Users/Jee/fsd_Project

# Auth + project values from provisioning summary
gh secret set AWS_ACCESS_KEY_ID         --body "<paste-AccessKeyId>"
gh secret set AWS_SECRET_ACCESS_KEY     --body "<paste-SecretAccessKey>"
gh secret set S3_BUCKET                 --body "saffron-table-frontend-948834064449"
gh secret set EB_BUNDLE_BUCKET          --body "saffron-table-eb-bundles-948834064449"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "<id-from-script-output>"
gh secret set EB_APP_NAME               --body "saffron-table"
gh secret set EB_ENV_NAME               --body "saffron-table-prod"

# Frontend build needs the API URL baked in
gh secret set VITE_API_BASE_URL         --body "http://${EB_CNAME}/api"
```

### 6. Push to trigger the first deploy
```bash
git add -A
git commit -m "ci: add AWS deploy pipeline"
git push origin main
gh run watch        # follow the build live
```
The pipeline runs three jobs:

1. **build-and-test** — `npm ci`, `npm run build`, Trivy scan.
2. **deploy-frontend** — sync `dist/` to S3, invalidate CloudFront.
3. **deploy-backend** — zip + upload bundle, create EB app version, update env, wait until Ready.

After the workflow goes green, open:

- **Frontend:** `https://<cloudfront-domain>`
- **Backend health:** `http://<eb-cname>/api/health`

## Day-to-day workflow

Once setup is done, the loop is:

```
edit code → git commit → git push origin main
```

Within ~3–5 minutes:
- frontend changes are live at the CloudFront URL
- backend changes are live on the Beanstalk environment

`gh run watch` (or the **Actions** tab on GitHub) shows live logs while it deploys.

## Manually trigger a deploy

```bash
gh workflow run deploy.yml
```

## Roll back

Beanstalk keeps every version you've deployed. Pick a previous one:
```bash
aws elasticbeanstalk describe-application-versions \
  --application-name saffron-table \
  --query 'ApplicationVersions[*].{Label:VersionLabel,Date:DateCreated}' \
  --output table

aws elasticbeanstalk update-environment \
  --environment-name saffron-table-prod \
  --version-label <older-sha>
```
For the frontend, `git revert` and push — the pipeline redeploys the previous state.

## Tear it all down (when you're done)

```bash
# Terminate EB environment (5 min)
aws elasticbeanstalk terminate-environment --environment-name saffron-table-prod

# Delete CloudFront distribution (disable first, then delete after ~15 min)
# Easier via the AWS console.

# Empty + delete S3 buckets
aws s3 rm s3://saffron-table-frontend-948834064449 --recursive
aws s3 rb s3://saffron-table-frontend-948834064449
aws s3 rm s3://saffron-table-eb-bundles-948834064449 --recursive
aws s3 rb s3://saffron-table-eb-bundles-948834064449

# Remove IAM user keys + user
aws iam list-access-keys --user-name saffron-table-deployer \
  --query 'AccessKeyMetadata[*].AccessKeyId' --output text \
  | xargs -n1 -I{} aws iam delete-access-key --user-name saffron-table-deployer --access-key-id {}
aws iam detach-user-policy --user-name saffron-table-deployer \
  --policy-arn "$(aws iam list-policies --scope Local --query 'Policies[?PolicyName==\`saffron-table-deployer-policy\`].Arn | [0]' --output text)"
aws iam delete-user --user-name saffron-table-deployer
```

## Set a $1 billing alarm (do this before provisioning)

CloudWatch billing alarms are free, and they email you the moment AWS charges hit any threshold. Set one for $1 so you'll know within hours if anything slips out of the free tier:

```bash
# 1. Enable billing alerts (one-time, requires root account login in console:
#    Account → Billing preferences → tick "Receive Billing Alerts")

# 2. Create an SNS topic + your email subscription
aws sns create-topic --name billing-alerts
aws sns subscribe \
  --topic-arn "$(aws sns list-topics --query 'Topics[?contains(TopicArn,`billing-alerts`)].TopicArn | [0]' --output text)" \
  --protocol email --notification-endpoint your@email.com
# Confirm the subscription via the email AWS sends.

# 3. Create the alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "Billing > $1" \
  --alarm-description "Email if total AWS bill exceeds $1" \
  --metric-name EstimatedCharges --namespace AWS/Billing \
  --statistic Maximum --period 21600 --threshold 1 \
  --comparison-operator GreaterThanThreshold --evaluation-periods 1 \
  --dimensions Name=Currency,Value=USD --region us-east-1 \
  --alarm-actions "$(aws sns list-topics --query 'Topics[?contains(TopicArn,`billing-alerts`)].TopicArn | [0]' --output text)"
```

You'll get an email if charges ever cross $1. Free alarms, no cost.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Workflow fails at "Configure AWS credentials" | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets missing or wrong |
| EB deploy says "Health: Red, Severe" | SSH into instance or use `eb logs`; usually a missing env var (MONGODB_URI) |
| CloudFront still shows old build | Wait ~1 min for invalidation, or check the workflow's invalidate step succeeded |
| Frontend 403 on every path | Bucket policy wasn't applied; re-run `./scripts/provision-aws.sh` |
| `gh secret set` errors | `gh auth login` first |
