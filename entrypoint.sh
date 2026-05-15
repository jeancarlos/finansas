#!/bin/sh
set -e

# Setup directories and permissions
mkdir -p /data/config /data/uploads

# Auto-generate NEXTAUTH_SECRET on first boot and persist it
SECRET_FILE=/data/config/secret
if [ ! -f "$SECRET_FILE" ]; then
  openssl rand -base64 32 > "$SECRET_FILE"
fi
export NEXTAUTH_SECRET=$(cat "$SECRET_FILE")

npx prisma migrate deploy
exec node server.js
