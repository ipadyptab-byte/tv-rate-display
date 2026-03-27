# Production Deployment

This guide covers running the app in production and fronting it with HTTPS using a reverse proxy.

The app serves both API and client on a single HTTP port (default 3000). In production you typically:
- Run the Node.js server on an internal port (e.g., 3000)
- Put a reverse proxy (Nginx or Caddy) in front
- Terminate TLS at the proxy

## 1) Build and run

### Build
- npm install
- npm run build

This produces:
- dist/public (client assets)
- dist/index.js (server entry)

### Run
- Set environment variables
  - cp .env.local.example .env
  - Edit DATABASE_URL and VITE_API_BASE_URL (for any further client builds)
- Start server
  - PORT=3000 DATABASE_URL="postgres://USER:PASS@HOST:5432/DB" npm start

The server binds to 0.0.0.0:3000 by default.

## 2) Systemd service (optional)

Create a service file (see deploy/systemd-node-example.service) and enable it:

- sudo cp deploy/systemd-node-example.service /etc/systemd/system/yourapp.service
- sudo systemctl daemon-reload
- sudo systemctl enable yourapp
- sudo systemctl start yourapp
- sudo systemctl status yourapp

## 3) Reverse proxy options

You can use Nginx or Caddy. Examples are provided in deploy/:

- Nginx: deploy/NGINX_EXAMPLE.conf
- Caddy: deploy/CADDYFILE.example

### WebSockets

The app may use WebSockets (e.g., for future features). The provided proxy configs include the required Upgrade/Connection headers.

## 4) HTTPS certificates

### Option A: Nginx + Certbot (Let's Encrypt)

1. Install Nginx and Certbot:
   - Ubuntu/Debian:
     - sudo apt update
     - sudo apt install nginx certbot python3-certbot-nginx
2. Create a server block for your domain:
   - sudo cp deploy/NGINX_EXAMPLE.conf /etc/nginx/sites-available/your-domain.conf
   - sudo ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/
   - sudo nginx -t
   - sudo systemctl reload nginx
3. Request/enable HTTPS:
   - sudo certbot --nginx -d your-domain.tld -d www.your-domain.tld
   - Follow prompts; auto-renewal is installed by Certbot timer.

### Option B: Caddy (automatic HTTPS)

1. Install Caddy:
   - https://caddyserver.com/docs/install
2. Put the Caddyfile at /etc/caddy/Caddyfile:
   - sudo cp deploy/CADDYFILE.example /etc/caddy/Caddyfile
   - sudo systemctl reload caddy

Caddy will automatically issue and renew certificates for the domain(s) in the Caddyfile.

## 5) Firewall and ports

Open only the necessary ports:
- 80/tcp (HTTP) and 443/tcp (HTTPS) to the world
- Keep 3000/tcp internal-only if using a proxy (bind on 127.0.0.1 via systemd or firewall off external access)
- If you must expose 3000 (e.g., static IP 103.159.153.24), ensure firewall allows it from required networks

## 6) Environment variables (summary)

- PORT=3000
- DATABASE_URL=postgres://USER:PASS@HOST:5432/DB
- For client builds (optional):
  - VITE_API_BASE_URL=https://your-domain.tld

## 7) Health check

- GET /api/health returns:
  - { status: "healthy", database: "connected" } when the DB is configured and reachable.