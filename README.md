# Yodi & Oya

Our household book: an admin dashboard for tracking and analysing home spending.

- **Overview**: the month at a glance, filterable by category, with budget progress.
- **Expenses**: paginated, searchable across all months, CSV export and an optional receipt photo per entry. Bank transfers record which account paid (BCA, Line Bank or Mandiri; the list lives in `backend/app/Enums/Bank.php` and `frontend/src/lib/labels.ts`).
- **Reimbursements**: claims moving through *Pending → Approved → Paid/Rejected*, with optional receipts.
- **Wishlist**: things we would like to buy. *Mark purchased* records the expense in the same step.
- **Budgets**: a standing monthly limit per category (on track / nearly spent / over).
- **Reports**: the year by month and category, the average month, and the biggest movers.
- **Users**: the sign-in accounts, which are also the "Paid by" / "Claimed by" options.
- **Activity**: who added, edited or removed what, and when — with old → new values for edits. Recorded automatically by the backend (passwords never stored).

```
Home_App/
├── backend/    Laravel 12 REST API (MySQL via XAMPP)
└── frontend/   React 19 + Vite + Tailwind v4, "Serif" editorial theme
```

## Running

Start **MySQL** in the XAMPP Control Panel first. The data lives in the `yodi_oya` database, which you can browse in phpMyAdmin at http://localhost/phpmyadmin.

Then, from the project root, start both servers in one terminal:

```bash
npm run dev      # backend (api, yellow) + frontend (web, cyan); Ctrl+C stops both
```

Or run them separately in two terminals:

```bash
# Terminal 1 — Backend: http://127.0.0.1:8010
cd backend
php artisan serve

# Terminal 2 — Frontend: http://localhost:5180
cd frontend
npm run dev
```

Then open **http://localhost:5180**.

The ports are set in config, so no `--port` flag is needed:
- Backend: `SERVER_PORT=8010` in `backend/.env`
- Frontend: `port: 5180` in `frontend/vite.config.ts`, with `/api` proxied to `:8010`

These ports were chosen so they don't clash with other local projects on 8000–8002 and 5173–5177.

## Sign-in accounts

| Name | Email |
|---|---|
| Yodi | yodifm@gmail.com |
| Oya | nuron.soraya@gmail.com |

Passwords live in `backend/.env` (`YODI_PASSWORD`, `OYA_PASSWORD`), never in the code. To change a password, edit the value in `.env` and run:

```bash
cd backend
php artisan db:seed --class=HouseholdMemberSeeder
```

The member list (names and emails) is in `backend/config/household.php`. Those names are also the options in the "Paid by" and "Claimed by" dropdowns. A sign-in session lasts 30 days.

### First-time setup (fresh clone only)

These steps have already been run on this machine, so you don't need to repeat them.

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# create the database (or use phpMyAdmin → New → yodi_oya, utf8mb4_unicode_ci)
mysql -u root -e "CREATE DATABASE yodi_oya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
# set YODI_PASSWORD & OYA_PASSWORD in .env first
php artisan migrate:fresh --seed   # --seed creates the accounts + sample data

cd ../frontend
npm install
```

To start with an empty book (no sample data, accounts kept):

```bash
php artisan migrate:fresh
php artisan db:seed --class=HouseholdMemberSeeder
```

## Email notifications

The household gets emails for: a new expense, a new reimbursement claim, a claim's status changing, and a category going over its monthly budget (sent once, when it crosses). New entries and claim changes go to the *other* members; budget alerts go to everyone. Each person can switch emails off on the Users page.

Mail is sent through Gmail SMTP. In `backend/.env`:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sender@gmail.com
MAIL_PASSWORD="16-letter app password"   # Google Account → Security → App passwords
MAIL_FROM_ADDRESS="sender@gmail.com"
MAIL_FROM_NAME="${APP_NAME}"
```

Always keep the password in quotes, and never add a second line for it under another name: an unquoted value with spaces makes the whole `.env` unreadable.

Check it with `php artisan notifications:test` (or `php artisan notifications:test someone@example.com`). A failed send never blocks saving; it is written to `storage/logs/laravel.log`.

## Deploying (VPS)

Live at https://oyayodihome.smartietls.online — an aaPanel site on OpenLiteSpeed with PHP 8.2. Under `/www/wwwroot/oyayodihome.smartietls.online/`:

- `app/`: this repository. The production `backend/.env` lives only here.
- `web/`: the built frontend plus `deploy/web/` (`.htaccess` routes `/api` through `laravel.php` to Laravel). It is the site's *Running directory*.

To publish new code, push to GitHub, then on the VPS run:

```bash
bash /www/wwwroot/oyayodihome.smartietls.online/app/deploy/deploy.sh
```

After editing `.env` on the VPS, run `php artisan optimize` (or the deploy script again) so the change is picked up.

## API

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/login` | `{email, password}` → token. Max 5 attempts per minute |
| POST | `/api/logout` · GET `/api/me` · GET `/api/members` | Token required |
| GET | `/api/dashboard?month=YYYY-MM&category=…` | Month summary, 6-month trend, by category. `category` is optional |
| CRUD | `/api/expenses` | Paginated (20/page). Filters: `month`, `year`, `category`, `q`. `summary` totals every match |
| CRUD | `/api/reimbursements` | Paginated. Filter: `status`. `summary` has count/total per status. `settled_at` follows the status |
| CRUD | `/api/wishlist` | Filter: `status`. Sorted by priority, purchased items last |
| GET | `/api/expenses/export?month=…&category=…&q=…` | CSV (UTF-8 with BOM, opens in Excel) |
| GET/POST/DELETE | `/api/expenses/{id}/receipt`, `/api/reimbursements/{id}/receipt` | Optional receipt: JPG, PNG, WEBP or PDF, up to 8 MB |
| POST | `/api/wishlist/{id}/purchase` | Marks the item purchased and records the expense |
| GET · PUT | `/api/budgets` · `/api/budgets/{category}` | Monthly limits; `{amount: null}` removes one |
| GET | `/api/reports?year=YYYY` | Year summary |
| GET | `/api/activity?user_id=…&subject_type=…` | Change history, newest first (30 per page) |
| GET/POST/PUT/DELETE | `/api/users` | Manage sign-in accounts. A rename carries through to existing records; users who still have records, or yourself, cannot be deleted |

Amounts are stored as whole rupiah (integers). Receipts are stored privately in `backend/storage/app/private/receipts` and only served to signed-in users. Friendly field names for validation messages are in `backend/lang/en`.

## Frontend structure

```
src/
├── index.css              Design tokens (colours, fonts, shadows); the single source of the theme
├── components/ui/         Primitives: Button, Card, Field, Badge, Modal, Table, Tabs, StatCard…
├── components/layout/     AdminLayout (sidebar + mobile menu), PageHeader
├── hooks/                 useAsync (loader), useCrudPage (modal/form/delete state)
├── lib/                   API client, rupiah/date formatting, display labels
└── features/<feature>/    api.ts, Form, Page per feature (+ auth)
```

## Tests

```bash
cd backend && php artisan test
cd frontend && npm run build && npm run lint
```

Backend tests run against an in-memory SQLite database (see `phpunit.xml`), so they never touch the real `yodi_oya` data in MySQL.
