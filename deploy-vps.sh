#!/bin/bash
set -euo pipefail

echo "Vellum VPS deploy"

if [ ! -f website/.env ]; then
    echo "Missing website/.env — copy website/.env.example to website/.env and fill it in first."
    exit 1
fi

export PUBLIC_BETTER_AUTH_URL="${PUBLIC_BETTER_AUTH_URL:-https://vellum.chromitedev.xyz}"
export PUBLIC_WEBSOCKET_URL="${PUBLIC_WEBSOCKET_URL:-wss://vellum.chromitedev.xyz/ws}"

docker compose -f docker-compose.vps.yml build --pull
docker compose -f docker-compose.vps.yml up -d

echo ""
echo "One-time database setup (first deploy only):"
echo "  cd website && npx drizzle-kit push"
echo ""
echo "Point the DNS record 'vellum' (A record) at this server's public IP."
echo "Caddy will fetch the HTTPS certificate automatically."
