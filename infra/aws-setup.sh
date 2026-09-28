#!/usr/bin/env bash
# One-time AWS setup for the portfolio, meant to run in AWS CloudShell
# (ap-southeast-2, Sydney). Safe to re-run: existing resources are reused.
#
# Required environment variables:
#   MY_IP          your laptop's public IPv4 (SSH admin access), e.g. 203.0.113.10
#   ADMIN_PUBKEY   contents of ~/.ssh/portfolio-admin.pub
#   DEPLOY_PUBKEY  contents of ~/.ssh/portfolio-deploy.pub
# Optional:
#   ALERT_EMAIL    email for a USD 10/month AWS Budget alert
#   REGION         defaults to ap-southeast-2 (Sydney)
#
# Creates: EC2 key pair, security group, t3.small Ubuntu 24.04 instance,
# Elastic IP, GitHub OIDC provider, least-privilege deploy role, budget.

set -euo pipefail

: "${MY_IP:?set MY_IP}"
: "${ADMIN_PUBKEY:?set ADMIN_PUBKEY}"
: "${DEPLOY_PUBKEY:?set DEPLOY_PUBKEY}"

# CloudShell pre-sets AWS_REGION to the console's region, and AWS_REGION wins
# over AWS_DEFAULT_REGION. Pin both so resources always land in REGION.
REGION="${REGION:-ap-southeast-2}"
export AWS_REGION="${REGION}"
export AWS_DEFAULT_REGION="${REGION}"
export AWS_PAGER=""

readonly PROJECT="wisnu-portofolio"
readonly GITHUB_REPO="ngurahgdewisnugk/wisnu-portofolio"
readonly INSTANCE_TYPE="t3.small"
readonly KEY_NAME="portfolio-admin"
readonly SG_NAME="portfolio-web-sg"
readonly INSTANCE_NAME="portfolio-web"
readonly EIP_NAME="portfolio-eip"
readonly ROLE_NAME="github-actions-portfolio-deploy"
readonly OIDC_HOST="token.actions.githubusercontent.com"
readonly UBUNTU_AMI_PARAM="/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

log() { printf '\n==> %s\n' "$*"; }
tags() { printf 'ResourceType=%s,Tags=[{Key=Project,Value=%s},{Key=Name,Value=%s}]' "$1" "${PROJECT}" "$2"; }

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
log "Account ${ACCOUNT_ID}, region ${AWS_REGION}"

# --- 1. Admin key pair --------------------------------------------------------
log "Key pair ${KEY_NAME}"
if ! aws ec2 describe-key-pairs --key-names "${KEY_NAME}" >/dev/null 2>&1; then
  printf '%s\n' "${ADMIN_PUBKEY}" > /tmp/admin.pub
  aws ec2 import-key-pair --key-name "${KEY_NAME}" \
    --public-key-material fileb:///tmp/admin.pub \
    --tag-specifications "$(tags key-pair "${KEY_NAME}")" >/dev/null
  echo "imported"
else
  echo "already exists"
fi

# --- 2. Security group --------------------------------------------------------
log "Security group ${SG_NAME}"
VPC_ID="$(aws ec2 describe-vpcs --filters Name=is-default,Values=true \
  --query 'Vpcs[0].VpcId' --output text)"
[[ "${VPC_ID}" == "None" ]] && { echo "No default VPC in this region" >&2; exit 1; }

SG_ID="$(aws ec2 describe-security-groups \
  --filters Name=group-name,Values="${SG_NAME}" Name=vpc-id,Values="${VPC_ID}" \
  --query 'SecurityGroups[0].GroupId' --output text)"
if [[ "${SG_ID}" == "None" ]]; then
  SG_ID="$(aws ec2 create-security-group --group-name "${SG_NAME}" \
    --description "Portfolio web server: HTTP public, SSH admin only" \
    --vpc-id "${VPC_ID}" --tag-specifications "$(tags security-group "${SG_NAME}")" \
    --query GroupId --output text)"
  aws ec2 authorize-security-group-ingress --group-id "${SG_ID}" --ip-permissions \
    "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0,Description=HTTP public}]" \
    "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=${MY_IP}/32,Description=SSH admin}]" >/dev/null
  echo "created ${SG_ID} (80 public, 22 from ${MY_IP}/32 only)"
else
  echo "already exists: ${SG_ID}"
fi

# --- 3. EC2 instance ----------------------------------------------------------
log "EC2 instance ${INSTANCE_NAME}"
INSTANCE_ID="$(aws ec2 describe-instances \
  --filters Name=tag:Name,Values="${INSTANCE_NAME}" \
            Name=instance-state-name,Values=pending,running,stopping,stopped \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)"
if [[ "${INSTANCE_ID}" == "None" ]]; then
  AMI_ID="$(aws ssm get-parameter --name "${UBUNTU_AMI_PARAM}" \
    --query Parameter.Value --output text)"
  echo "Ubuntu 24.04 AMI: ${AMI_ID}"

  sed "s|__DEPLOY_PUBKEY__|${DEPLOY_PUBKEY}|" "${SCRIPT_DIR}/user-data.sh" > /tmp/user-data.sh

  INSTANCE_ID="$(aws ec2 run-instances \
    --image-id "${AMI_ID}" \
    --instance-type "${INSTANCE_TYPE}" \
    --key-name "${KEY_NAME}" \
    --security-group-ids "${SG_ID}" \
    --user-data file:///tmp/user-data.sh \
    --metadata-options HttpTokens=required,HttpEndpoint=enabled,HttpPutResponseHopLimit=1 \
    --credit-specification CpuCredits=standard \
    --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3,Encrypted=true,DeleteOnTermination=true}' \
    --tag-specifications "$(tags instance "${INSTANCE_NAME}")" "$(tags volume "${INSTANCE_NAME}-root")" \
    --query 'Instances[0].InstanceId' --output text)"
  echo "launched ${INSTANCE_ID}, waiting until running..."
  aws ec2 wait instance-running --instance-ids "${INSTANCE_ID}"
else
  echo "already exists: ${INSTANCE_ID}"
fi

# --- 4. Elastic IP ------------------------------------------------------------
log "Elastic IP ${EIP_NAME}"
ALLOC_ID="$(aws ec2 describe-addresses --filters Name=tag:Name,Values="${EIP_NAME}" \
  --query 'Addresses[0].AllocationId' --output text)"
if [[ "${ALLOC_ID}" == "None" ]]; then
  ALLOC_ID="$(aws ec2 allocate-address --domain vpc \
    --tag-specifications "$(tags elastic-ip "${EIP_NAME}")" \
    --query AllocationId --output text)"
fi
aws ec2 associate-address --instance-id "${INSTANCE_ID}" --allocation-id "${ALLOC_ID}" >/dev/null
PUBLIC_IP="$(aws ec2 describe-addresses --allocation-ids "${ALLOC_ID}" \
  --query 'Addresses[0].PublicIp' --output text)"
echo "${PUBLIC_IP} -> ${INSTANCE_ID}"

# --- 5. GitHub OIDC provider ----------------------------------------------------
log "GitHub OIDC provider"
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_HOST}"
if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${OIDC_ARN}" >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider \
    --url "https://${OIDC_HOST}" \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 1c58a3a8518e8759bf075b76b750d4f2df264fcd \
    --tags Key=Project,Value="${PROJECT}" >/dev/null
  echo "created"
else
  echo "already exists"
fi

# --- 6. Least-privilege deploy role ---------------------------------------------
log "IAM role ${ROLE_NAME}"
# Only jobs running in the "production" environment of this repo can assume it.
cat > /tmp/trust.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "${OIDC_ARN}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "${OIDC_HOST}:aud": "sts.amazonaws.com",
        "${OIDC_HOST}:sub": "repo:${GITHUB_REPO}:environment:production"
      }
    }
  }]
}
JSON
# The role can only open/close SSH on this one security group.
cat > /tmp/permissions.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "ToggleRunnerSshOnPortfolioSg",
    "Effect": "Allow",
    "Action": [
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:RevokeSecurityGroupIngress"
    ],
    "Resource": "arn:aws:ec2:${AWS_REGION}:${ACCOUNT_ID}:security-group/${SG_ID}"
  }]
}
JSON
if aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "${ROLE_NAME}" --policy-document file:///tmp/trust.json
  echo "trust policy updated"
else
  aws iam create-role --role-name "${ROLE_NAME}" \
    --assume-role-policy-document file:///tmp/trust.json \
    --description "GitHub Actions deploy for ${GITHUB_REPO}" \
    --max-session-duration 3600 \
    --tags Key=Project,Value="${PROJECT}" >/dev/null
  echo "created"
fi
aws iam put-role-policy --role-name "${ROLE_NAME}" \
  --policy-name toggle-runner-ssh --policy-document file:///tmp/permissions.json
ROLE_ARN="$(aws iam get-role --role-name "${ROLE_NAME}" --query Role.Arn --output text)"

# --- 7. Budget alert (optional) -------------------------------------------------
if [[ -n "${ALERT_EMAIL:-}" ]]; then
  log "Budget alert (USD 10/month, email at 80%)"
  if ! aws budgets describe-budget --region us-east-1 --account-id "${ACCOUNT_ID}" \
       --budget-name portfolio-monthly >/dev/null 2>&1; then
    aws budgets create-budget --region us-east-1 --account-id "${ACCOUNT_ID}" \
      --budget '{"BudgetName":"portfolio-monthly","BudgetLimit":{"Amount":"10","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}' \
      --notifications-with-subscribers "[{\"Notification\":{\"NotificationType\":\"ACTUAL\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":80,\"ThresholdType\":\"PERCENTAGE\"},\"Subscribers\":[{\"SubscriptionType\":\"EMAIL\",\"Address\":\"${ALERT_EMAIL}\"}]}]"
    echo "created"
  else
    echo "already exists"
  fi
fi

rm -f /tmp/admin.pub /tmp/user-data.sh /tmp/trust.json /tmp/permissions.json

cat <<SUMMARY

============================================================
 Done in region ${AWS_REGION}. Save these values for GitHub (environment: production)
------------------------------------------------------------
 Variable EC2_HOST             = ${PUBLIC_IP}
 Variable EC2_SG_ID            = ${SG_ID}
 Secret   AWS_DEPLOY_ROLE_ARN  = ${ROLE_ARN}
 Instance                      = ${INSTANCE_ID}
============================================================
 Next: wait ~3 minutes for bootstrap, then from your laptop:
   ssh -i ~/.ssh/portfolio-admin ubuntu@${PUBLIC_IP} 'cloud-init status --wait'
SUMMARY
