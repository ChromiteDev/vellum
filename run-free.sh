#!/bin/bash
set -euo pipefail

echo "Vellum free deploy (Cloudflare Tunnel)"

if [ ! -f website/.env ]; then
    echo "Missing website/.env — copy website/.env.example to website/.env and fill it in first."
    exit 1
fi

if ! grep -q "YOUR_TUNNEL_UUID" cloudflared/config.yml 2>/dev/null || [ -z "$(ls cloudflared/*.json 2>/dev/null)" ]; then
    echo "Cloudflare Tunnel is not set up yet."
    echo "Run these once (see README 'Cloudflare Tunnel' section):"
    echo "  1. cloudflared tunnel login"
    echo "  2. cloudflared tunnel create vellum"
    echo "  3. cp ~/.cloudflared/<UUID>.json cloudflared/"
    echo "  4. Replace YOUR_TUNNEL_UUID in cloudflared/config.yml with your tunnel UUID"
    echo "  5. cloudflared tunnel route dns vellum vellum.chromitedev.xyz"
    echo ""
    echo "Then re-run this script."
    exit 1
fi

export PUBLIC_BETTER_AUTH_URL="${PUBLIC_BETTER_AUTH_URL:-https://vellum.chromitedev.xyz}"
export PUBLIC_WEBSOCKET_URL="${PUBLIC_WEBSOCKET_URL:-wss://vellum.chromitedev.xyz/ws}"

docker compose -f docker-compose.free.yml build --pull
docker compose -f docker-compose.free.yml up -d

echo ""
echo "One-time database setup (first deploy only):"
echo "  docker compose -f docker-compose.free.yml exec app sh -c 'cd /app && npm run db:push' 2>/dev/null || echo 'see README for db:push'"
echo ""
echo "Vellum will be live at https://vellum.chromitedev.xyz once the tunnel is connected."
