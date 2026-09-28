#!/bin/bash
# EC2 bootstrap (cloud-init user data) for Ubuntu 24.04 LTS.
# aws-setup.sh replaces __DEPLOY_PUBKEY__ before launching the instance.
# Progress: sudo tail -f /var/log/cloud-init-output.log
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

# 2 GB swap: headroom for Next.js replicas plus Prometheus/Grafana on 2 GB RAM.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
  sysctl --system
fi

# Docker Engine + Compose plugin from Docker's official apt repository.
apt-get update
apt-get install -y ca-certificates curl jq
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
CODENAME="$(grep -oP '^VERSION_CODENAME=\K.*' /etc/os-release)"
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Log rotation for every container; keep containers up during daemon restarts.
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true
}
JSON
systemctl enable docker
systemctl restart docker

# Dedicated user for the CI/CD pipeline, separate from the admin (ubuntu) user.
# Its key cannot forward ports, agents, or X11.
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash --groups docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo 'no-port-forwarding,no-agent-forwarding,no-X11-forwarding __DEPLOY_PUBKEY__' \
  > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

install -d -m 750 -o deploy -g deploy /opt/portfolio

touch /var/lib/cloud/instance/portfolio-bootstrap-done
