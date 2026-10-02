#!/usr/bin/env bash
# Publish the latest code from GitHub on the VPS (aaPanel). Run as root:
#   bash /www/wwwroot/oyayodihome.smartietls.online/app/deploy/deploy.sh
#
# Two aaPanel sites (OpenLiteSpeed):
#   oyayodihome.smartietls.online/
#     app/   this repository (backend/.env lives here, never in git)
#     web/   the built frontend + deploy/web/ — the site's "Running directory"
#   api.oyayodihome.smartietls.online/
#     deploy/api/ (index.php + .htaccess), which hands requests to app/backend
set -euo pipefail

APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$(dirname "$APP")"
WEB="$SITE/web"
API="$(dirname "$SITE")/api.$(basename "$SITE")"
# aaPanel disables proc_open/putenv for PHP; lift that for these CLI commands
# only, so the shared PHP settings of the other sites stay untouched.
PHP="${PHP_BIN:-/www/server/php/82/bin/php} -d disable_functions="

cd "$APP"
git pull --ff-only

echo "== Backend"
cd "$APP/backend"
[ -f composer.phar ] || curl -sSL https://getcomposer.org/download/latest-stable/composer.phar -o composer.phar
$PHP composer.phar install --no-dev --optimize-autoloader --no-interaction
$PHP artisan migrate --force
$PHP artisan optimize
cp "$APP/deploy/api/.htaccess" "$APP/deploy/api/index.php" "$API/"

echo "== Frontend"
cd "$APP/frontend"
npm ci --no-audit --no-fund
npm run build
mkdir -p "$WEB"
# Keep aaPanel's own files (.user.ini, Let's Encrypt challenges) in place.
rsync -a --delete --exclude .user.ini --exclude .well-known "$APP/frontend/dist/" "$WEB/"
cp "$APP/deploy/web/.htaccess" "$WEB/"

# PHP runs as www: it writes logs, cache and receipt photos.
chown -R www:www "$APP/backend/storage" "$APP/backend/bootstrap/cache" "$WEB" "$API/index.php" "$API/.htaccess"
echo "Deployed: $(git -C "$APP" log -1 --format='%h %s')"
