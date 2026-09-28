#!/usr/bin/env bash
# Removes everything aws-setup.sh created, to stop all charges after grading.
# Run in AWS CloudShell. Asks for confirmation first.
# Region defaults to ap-southeast-2 (Sydney); override with REGION=... if needed.
#
# Deletes: EC2 instance (and its encrypted root volume), Elastic IP,
# security group, deploy role, admin key pair, budget.
# Keeps: the GitHub OIDC provider (free, may be shared by other repos);
# set DELETE_OIDC=1 to remove it too.

set -euo pipefail
# CloudShell pre-sets AWS_REGION to the console's region, and AWS_REGION wins
# over AWS_DEFAULT_REGION. Pin both so resources always land in REGION.
REGION="${REGION:-ap-southeast-2}"
export AWS_REGION="${REGION}"
export AWS_DEFAULT_REGION="${REGION}"
export AWS_PAGER=""

readonly SG_NAME="portfolio-web-sg"
readonly INSTANCE_NAME="portfolio-web"
readonly EIP_NAME="portfolio-eip"
readonly ROLE_NAME="github-actions-portfolio-deploy"
readonly KEY_NAME="portfolio-admin"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
read -r -p "Delete all portfolio resources in account ${ACCOUNT_ID}, region ${AWS_REGION}? Type 'yes': " answer
[[ "${answer}" == "yes" ]] || { echo "Aborted."; exit 1; }

echo "==> Elastic IP"
ALLOC_ID="$(aws ec2 describe-addresses --filters Name=tag:Name,Values="${EIP_NAME}" \
  --query 'Addresses[0].AllocationId' --output text)"
if [[ "${ALLOC_ID}" != "None" ]]; then
  ASSOC_ID="$(aws ec2 describe-addresses --allocation-ids "${ALLOC_ID}" \
    --query 'Addresses[0].AssociationId' --output text)"
  [[ "${ASSOC_ID}" != "None" ]] && aws ec2 disassociate-address --association-id "${ASSOC_ID}"
  aws ec2 release-address --allocation-id "${ALLOC_ID}"
  echo "released"
fi

echo "==> EC2 instance"
INSTANCE_ID="$(aws ec2 describe-instances --filters Name=tag:Name,Values="${INSTANCE_NAME}" \
  Name=instance-state-name,Values=pending,running,stopping,stopped \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)"
if [[ "${INSTANCE_ID}" != "None" ]]; then
  aws ec2 terminate-instances --instance-ids "${INSTANCE_ID}" >/dev/null
  echo "terminating ${INSTANCE_ID}..."
  aws ec2 wait instance-terminated --instance-ids "${INSTANCE_ID}"
  echo "terminated (root volume deleted with it)"
fi

echo "==> Security group"
SG_ID="$(aws ec2 describe-security-groups --filters Name=group-name,Values="${SG_NAME}" \
  --query 'SecurityGroups[0].GroupId' --output text)"
[[ "${SG_ID}" != "None" ]] && aws ec2 delete-security-group --group-id "${SG_ID}" && echo "deleted"

echo "==> IAM role"
if aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
  aws iam delete-role-policy --role-name "${ROLE_NAME}" --policy-name toggle-runner-ssh
  aws iam delete-role --role-name "${ROLE_NAME}"
  echo "deleted"
fi

echo "==> Key pair"
aws ec2 delete-key-pair --key-name "${KEY_NAME}" && echo "deleted"

echo "==> Budget"
if aws budgets describe-budget --region us-east-1 --account-id "${ACCOUNT_ID}" \
     --budget-name portfolio-monthly >/dev/null 2>&1; then
  aws budgets delete-budget --region us-east-1 --account-id "${ACCOUNT_ID}" --budget-name portfolio-monthly
  echo "deleted"
fi

if [[ "${DELETE_OIDC:-0}" == "1" ]]; then
  echo "==> GitHub OIDC provider"
  aws iam delete-open-id-connect-provider --open-id-connect-provider-arn \
    "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com" && echo "deleted"
fi

echo
echo "Done. Double-check in the console: EC2 > Instances, Elastic IPs, Volumes, Snapshots."
echo "Also delete the GHCR package if you no longer need the images."
