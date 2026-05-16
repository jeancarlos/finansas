#!/bin/sh
set -e

# Setup directories and permissions
mkdir -p /data/config /data/uploads

# Auto-generate NEXTAUTH_SECRET on first boot and persist it
SECRET_FILE=/data/config/secret
if [ ! -f "$SECRET_FILE" ]; then
  openssl rand -base64 32 > "$SECRET_FILE"
  chmod 600 "$SECRET_FILE"
fi
export NEXTAUTH_SECRET=$(cat "$SECRET_FILE")

yarn prisma migrate deploy
exec node server.js
