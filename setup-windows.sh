#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOMAIN="vellum.chromitedev.xyz"
TUNNEL_NAME="vellum"

echo ""
echo "=============================================="
echo "  Vellum — one-command Windows setup"
echo "=============================================="
echo ""
echo "This will install what you need (Docker Desktop"
echo "and cloudflared), create the Cloudflare tunnel,"
echo "wire up $DOMAIN, and start the app."
echo ""

fail() {
    echo ""
    echo "ERROR: $1"
    echo ""
    exit 1
}

warn() {
    echo ">> $1"
}

step() {
    echo ""
    echo "=== $1 ==="
}

# ---------- 1. Locate winget ----------
WINGET=""
if command -v winget >/dev/null 2>&1; then
    WINGET="winget"
elif command -v winget.exe >/dev/null 2>&1; then
    WINGET="winget.exe"
fi
if [ -z "$WINGET" ]; then
    fail "winget was not found. Open the Microsoft Store, install 'App Installer', then run this again."
fi

# ---------- 2. Install cloudflared ----------
step "Checking cloudflared"
if ! command -v cloudflared >/dev/null 2>&1; then
    warn "Installing cloudflared via winget..."
    "$WINGET" install -e --id Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements
    export PATH="$PATH:/c/Program Files (x86)/cloudflared:/c/Program Files/cloudflared:$LOCALAPPDATA/cloudflared"
    hash -r 2>/dev/null || true
fi
if ! command -v cloudflared >/dev/null 2>&1; then
    fail "cloudflared was installed but is not on PATH yet. Close this window, open a NEW Git Bash, and run this script again."
fi
warn "cloudflared OK: $(cloudflared --version 2>/dev/null | head -n1 || echo 'installed')"

# ---------- 3. Install Docker Desktop ----------
step "Checking Docker"
if ! command -v docker >/dev/null 2>&1; then
    warn "Installing Docker Desktop (click Yes on the UAC prompt)..."
    "$WINGET" install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
    echo ""
    warn "Docker Desktop is installed. You must start it once and accept its license."
    warn "After that you may need to sign out / back in to Windows once for Docker to work."
    fail "Please restart Docker Desktop from the Start Menu, then run this script again."
fi

if ! docker info >/dev/null 2>&1; then
    echo ""
    warn "Docker is installed but not running yet."
    warn "  1. Open 'Docker Desktop' from the Start Menu"
    warn "  2. Accept the license and wait until the whale stops animating"
    read -r -p "Press Enter once Docker Desktop says it is running... " </dev/tty
    if ! docker info >/dev/null 2>&1; then
        fail "Docker still is not ready. Start Docker Desktop, wait for it to finish loading, and run this script again."
    fi
fi
warn "Docker OK: $(docker --version)"

# ---------- 4. Create website/.env ----------
step "Preparing website/.env"
if [ ! -f website/.env ]; then
    cp website/.env.example website/.env
    warn "Created website/.env from the template."
fi

# Generate a secure auth secret if the placeholder is still there
if grep -q 'PRIVATE_BETTER_AUTH_SECRET=your_super_secret_auth_key_here' website/.env; then
    SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')
    sed -i "s|^PRIVATE_BETTER_AUTH_SECRET=.*|PRIVATE_BETTER_AUTH_SECRET=$SECRET|" website/.env
    warn "Generated a secure auth secret."
fi

# Point the app at the public domain
sed -i 's|^#\?PUBLIC_BETTER_AUTH_URL=.*|PUBLIC_BETTER_AUTH_URL=https://vellum.chromitedev.xyz|' website/.env
sed -i 's|^#\?PUBLIC_WEBSOCKET_URL=.*|PUBLIC_WEBSOCKET_URL=wss://vellum.chromitedev.xyz/ws|' website/.env
grep -q '^PUBLIC_GOOGLE_ENABLED=' website/.env || echo 'PUBLIC_GOOGLE_ENABLED=false' >> website/.env
sed -i 's|^PUBLIC_GOOGLE_ENABLED=.*|PUBLIC_GOOGLE_ENABLED=false|' website/.env
warn "Production URLs are set in website/.env."

# ---------- 5. Cloudflare Tunnel ----------
step "Setting up the Cloudflare Tunnel"
if grep -q "YOUR_TUNNEL_UUID" cloudflared/config.yml 2>/dev/null || [ -z "$(ls cloudflared/*.json 2>/dev/null)" ]; then
    echo ""
    warn "A browser window will open. Log in to Cloudflare, choose chromitedev.xyz, and click Authorize."
    cloudflared tunnel login

    warn "Creating the '$TUNNEL_NAME' tunnel..."
    CREATE_OUTPUT=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1) || true
    echo "$CREATE_OUTPUT"

    UUID=$(echo "$CREATE_OUTPUT" | grep -oiE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -n1)
    if [ -z "$UUID" ]; then
        read -r -p "I could not read the tunnel UUID automatically. Paste it here: " UUID </dev/tty
    fi
    if [ -z "$UUID" ]; then
        fail "No tunnel UUID provided."
    fi

    if [ -f "$HOME/.cloudflared/$UUID.json" ]; then
        cp "$HOME/.cloudflared/$UUID.json" cloudflared/
    elif [ ! -f "cloudflared/$UUID.json" ]; then
        fail "Could not find the tunnel credentials file. Copy ~/.cloudflared/$UUID.json into the cloudflared/ folder and run this again."
    fi

    sed -i "s|YOUR_TUNNEL_UUID|$UUID|g" cloudflared/config.yml
    warn "Wrote the tunnel UUID into cloudflared/config.yml."

    warn "Creating the DNS record $DOMAIN -> this tunnel..."
    cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN"
else
    warn "Tunnel already configured — skipping."
fi

# ---------- 6. Start ----------
step "Building and starting Vellum"
./run-free.sh

echo ""
echo "=============================================="
echo "  Almost done!"
echo "=============================================="
echo ""
echo "First deploy only — create the database tables:"
echo "  docker compose -f docker-compose.free.yml exec app sh -c 'npm run db:push'"
echo ""
echo "Then sign in once at https://$DOMAIN and make yourself Founder:"
echo "  docker compose -f docker-compose.free.yml exec postgres psql -U postgres -d vellum -c \"UPDATE \\\"user\\\" SET is_admin = true, is_founder = true WHERE email = 'your-email@example.com';\""
echo ""
echo "Note: your PC must stay on and Docker Desktop running for the site to be live."
echo ""
