#!/usr/bin/env bash
# Publish the latest code from GitHub on the VPS (aaPanel). Run as root:
#   bash /www/wwwroot/oyayodihome.smartietls.online/app/deploy/deploy.sh
#
# Layout under the aaPanel site folder:
#   app/   this repository (backend/.env lives here, never in git)
#   web/   the built frontend — the site's "Running directory" in aaPanel
set -euo pipefail

APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$(dirname "$APP")"
WEB="$SITE/web"
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

echo "== Frontend"
cd "$APP/frontend"
npm ci --no-audit --no-fund
npm run build
mkdir -p "$WEB"
rsync -a --delete --exclude .user.ini "$APP/frontend/dist/" "$WEB/"

# PHP-FPM runs as www: it writes logs, cache and receipt photos.
chown -R www:www "$APP/backend/storage" "$APP/backend/bootstrap/cache" "$WEB"
echo "Deployed: $(git -C "$APP" log -1 --format='%h %s')"
