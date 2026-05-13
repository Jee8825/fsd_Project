#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Provision all AWS resources for the Saffron Table CI/CD pipeline.
#
# Idempotent: re-running won't break anything, it skips resources that exist.
# Requires: aws CLI authenticated, jq.
# ---------------------------------------------------------------------------
set -euo pipefail

# ---- CONFIG (edit if you want different names) ----
AWS_REGION="${AWS_REGION:-us-east-1}"
APP_SLUG="${APP_SLUG:-saffron-table}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

S3_FRONTEND_BUCKET="${APP_SLUG}-frontend-${ACCOUNT_ID}"
S3_BUNDLE_BUCKET="${APP_SLUG}-eb-bundles-${ACCOUNT_ID}"
EB_APP_NAME="${APP_SLUG}"
EB_ENV_NAME="${APP_SLUG}-prod"
EB_SOLUTION_STACK="$(aws elasticbeanstalk list-available-solution-stacks \
  --region "$AWS_REGION" \
  --query 'SolutionStacks[?contains(@, `Amazon Linux 2023`) && contains(@, `Node.js 20`)] | [0]' \
  --output text)"
IAM_USER_NAME="${APP_SLUG}-deployer"

log() { printf "\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }

# -------------------------------------------------------------------
# 1. Frontend S3 bucket (private, served via CloudFront OAC)
# -------------------------------------------------------------------
log "Creating frontend S3 bucket: $S3_FRONTEND_BUCKET"
if aws s3api head-bucket --bucket "$S3_FRONTEND_BUCKET" 2>/dev/null; then
  ok "S3 bucket already exists"
else
  if [ "$AWS_REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$S3_FRONTEND_BUCKET" --region "$AWS_REGION"
  else
    aws s3api create-bucket --bucket "$S3_FRONTEND_BUCKET" --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
  fi
  aws s3api put-public-access-block --bucket "$S3_FRONTEND_BUCKET" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  ok "S3 bucket created (private)"
fi

# -------------------------------------------------------------------
# 2. EB bundle bucket (for backend zip uploads)
# -------------------------------------------------------------------
log "Creating EB bundle bucket: $S3_BUNDLE_BUCKET"
if aws s3api head-bucket --bucket "$S3_BUNDLE_BUCKET" 2>/dev/null; then
  ok "Bundle bucket already exists"
else
  if [ "$AWS_REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$S3_BUNDLE_BUCKET" --region "$AWS_REGION"
  else
    aws s3api create-bucket --bucket "$S3_BUNDLE_BUCKET" --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
  fi
  ok "Bundle bucket created"
fi

# -------------------------------------------------------------------
# 3. CloudFront origin access control + distribution
# -------------------------------------------------------------------
log "Setting up CloudFront for $S3_FRONTEND_BUCKET"
OAC_ID="$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='${APP_SLUG}-oac'].Id | [0]" --output text)"
if [ "$OAC_ID" = "None" ] || [ -z "$OAC_ID" ]; then
  OAC_ID="$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "Name=${APP_SLUG}-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
    --query "OriginAccessControl.Id" --output text)"
  ok "Created OAC: $OAC_ID"
else
  ok "OAC already exists: $OAC_ID"
fi

DIST_ID="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='${APP_SLUG}-frontend'].Id | [0]" --output text 2>/dev/null || echo "")"
if [ -z "$DIST_ID" ] || [ "$DIST_ID" = "None" ]; then
  log "Creating CloudFront distribution (this takes 5–10 min to deploy)..."
  CALLER_REF="$(date +%s)"
  cat > /tmp/cf-config.json <<JSON
{
  "CallerReference": "${CALLER_REF}",
  "Comment": "${APP_SLUG}-frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "s3-${S3_FRONTEND_BUCKET}",
      "DomainName": "${S3_FRONTEND_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
      "OriginAccessControlId": "${OAC_ID}",
      "S3OriginConfig": { "OriginAccessIdentity": "" }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-${S3_FRONTEND_BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"], "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] } },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0 },
      { "ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0 }
    ]
  },
  "PriceClass": "PriceClass_100"
}
JSON
  DIST_ID="$(aws cloudfront create-distribution --distribution-config file:///tmp/cf-config.json --query "Distribution.Id" --output text)"
  ok "Created distribution: $DIST_ID"
else
  ok "Distribution already exists: $DIST_ID"
fi

DIST_DOMAIN="$(aws cloudfront get-distribution --id "$DIST_ID" --query "Distribution.DomainName" --output text)"
ok "CloudFront domain: https://$DIST_DOMAIN"

# Attach bucket policy granting CloudFront read access via OAC
log "Setting S3 bucket policy for CloudFront OAC"
cat > /tmp/bucket-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${S3_FRONTEND_BUCKET}/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}"
      }
    }
  }]
}
JSON
aws s3api put-bucket-policy --bucket "$S3_FRONTEND_BUCKET" --policy file:///tmp/bucket-policy.json
ok "Bucket policy applied"

# -------------------------------------------------------------------
# 4. Elastic Beanstalk app + environment
# -------------------------------------------------------------------
log "Creating EB application: $EB_APP_NAME"
if aws elasticbeanstalk describe-applications --application-names "$EB_APP_NAME" \
  --query "Applications[0].ApplicationName" --output text 2>/dev/null | grep -q "$EB_APP_NAME"; then
  ok "EB application exists"
else
  aws elasticbeanstalk create-application --application-name "$EB_APP_NAME" --description "Saffron Table backend"
  ok "EB application created"
fi

log "Creating EB environment: $EB_ENV_NAME (this can take 5–8 min)"
EXISTING_ENV="$(aws elasticbeanstalk describe-environments \
  --application-name "$EB_APP_NAME" --environment-names "$EB_ENV_NAME" \
  --query "Environments[?Status!='Terminated'].EnvironmentName | [0]" --output text)"
if [ "$EXISTING_ENV" = "$EB_ENV_NAME" ]; then
  ok "EB environment already exists"
else
  cat > /tmp/eb-options.json <<JSON
[
  { "Namespace": "aws:autoscaling:launchconfiguration", "OptionName": "IamInstanceProfile", "Value": "aws-elasticbeanstalk-ec2-role" },
  { "Namespace": "aws:elasticbeanstalk:environment", "OptionName": "EnvironmentType", "Value": "SingleInstance" },
  { "Namespace": "aws:autoscaling:launchconfiguration", "OptionName": "InstanceType", "Value": "t2.micro" },
  { "Namespace": "aws:elasticbeanstalk:application:environment", "OptionName": "NODE_ENV", "Value": "production" }
]
JSON
  aws elasticbeanstalk create-environment \
    --application-name "$EB_APP_NAME" \
    --environment-name "$EB_ENV_NAME" \
    --solution-stack-name "$EB_SOLUTION_STACK" \
    --option-settings file:///tmp/eb-options.json
  ok "EB environment creation started. Check progress in the AWS console."
fi

# -------------------------------------------------------------------
# 5. IAM user for GitHub Actions
# -------------------------------------------------------------------
log "Creating IAM user: $IAM_USER_NAME"
if aws iam get-user --user-name "$IAM_USER_NAME" >/dev/null 2>&1; then
  ok "IAM user already exists"
else
  aws iam create-user --user-name "$IAM_USER_NAME"
  ok "IAM user created"
fi

log "Attaching deploy policy"
cat > /tmp/deploy-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3FrontendDeploy",
      "Effect": "Allow",
      "Action": ["s3:ListBucket","s3:GetObject","s3:PutObject","s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::${S3_FRONTEND_BUCKET}",
        "arn:aws:s3:::${S3_FRONTEND_BUCKET}/*",
        "arn:aws:s3:::${S3_BUNDLE_BUCKET}",
        "arn:aws:s3:::${S3_BUNDLE_BUCKET}/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation","cloudfront:GetDistribution"],
      "Resource": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}"
    },
    {
      "Sid": "ElasticBeanstalkDeploy",
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:CreateApplicationVersion",
        "elasticbeanstalk:UpdateEnvironment",
        "elasticbeanstalk:DescribeEnvironments",
        "elasticbeanstalk:DescribeEvents"
      ],
      "Resource": "*"
    }
  ]
}
JSON
POLICY_ARN="$(aws iam list-policies --scope Local \
  --query "Policies[?PolicyName=='${IAM_USER_NAME}-policy'].Arn | [0]" --output text 2>/dev/null || echo "")"
if [ -z "$POLICY_ARN" ] || [ "$POLICY_ARN" = "None" ]; then
  POLICY_ARN="$(aws iam create-policy \
    --policy-name "${IAM_USER_NAME}-policy" \
    --policy-document file:///tmp/deploy-policy.json \
    --query "Policy.Arn" --output text)"
  ok "Created policy: $POLICY_ARN"
fi
aws iam attach-user-policy --user-name "$IAM_USER_NAME" --policy-arn "$POLICY_ARN" || true
ok "Policy attached"

# Print summary
echo
echo "============================================================"
echo "  Provisioning complete. Add these as GitHub Secrets:"
echo "============================================================"
echo "  S3_BUCKET                  = $S3_FRONTEND_BUCKET"
echo "  EB_BUNDLE_BUCKET           = $S3_BUNDLE_BUCKET"
echo "  CLOUDFRONT_DISTRIBUTION_ID = $DIST_ID"
echo "  EB_APP_NAME                = $EB_APP_NAME"
echo "  EB_ENV_NAME                = $EB_ENV_NAME"
echo "  VITE_API_BASE_URL          = (set after EB env is ready — see below)"
echo
echo "  Public frontend URL: https://$DIST_DOMAIN"
echo
echo "  Once the EB env is 'Ready' (check AWS console), grab its CNAME:"
echo "    aws elasticbeanstalk describe-environments \\"
echo "      --application-name $EB_APP_NAME --environment-names $EB_ENV_NAME \\"
echo "      --query 'Environments[0].CNAME' --output text"
echo "  Then set VITE_API_BASE_URL = http://<that-cname>/api"
echo
echo "  To create access keys for GitHub Actions:"
echo "    aws iam create-access-key --user-name $IAM_USER_NAME"
echo "  Add the AccessKeyId + SecretAccessKey to GitHub Secrets as:"
echo "    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
echo "============================================================"
