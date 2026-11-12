# SalonX

Salon management app — billing, customer history, staff attendance & salary, expenses, purchases & stock.

**Stack:** Next.js 15 (App Router, server actions) · PostgreSQL · Clerk login · Tailwind · deployed on Railway.

## Modules

| Module | What it does |
|---|---|
| Dashboard | Today's sale, expense, month profit, bills, staff present, birthday wishes, customers due for a visit, low stock |
| New Bill | Tap services, assign the barber per service, seat, discount, Cash/UPI/Card/Credit; creates new customer inline |
| Bills | Date / barber filter, printable bill, send bill on WhatsApp |
| Customers | Full profile, visit history with service + barber, "last time" card, usual barber, total spent, WhatsApp |
| Attendance | One-screen daily marking (Present / Half / Absent / Week off) + monthly calendar per staff |
| Staff | Profile, salary, commission %, login access, upad, bonus, salary paid ledger |
| Salary Sheet | Auto calculation: base × paid days + commission + bonus − upad − paid |
| Services | Categories and services add / edit / hide / remove |
| Seats | Add / remove / switch off seats, today's sale per seat |
| Expenses | Salary, tea, fuel, rent… with custom categories; upad & salary auto-posted |
| Purchases & Stock | Item master, purchases, stock usage, live stock, low-stock alert |
| Reports (owner) | Monthly P&L, daily chart, staff performance, top services, 6-month trend |
| Barber panel | Barbers see only their own services, attendance and salary |

## Roles
- **Owner** — emails listed in `OWNER_EMAILS`. Everything.
- **Manager** — staff with access level *Manager* and *Can login*. No salary sheet / reports.
- **Barber** — staff with *Can login*. Only "My Panel".

Everyone signs in with Clerk; access is decided by the email on the Staff record.

## Environment variables
See `.env.example`. On Railway: `DATABASE_URL` (reference from Postgres service), Clerk keys, `OWNER_EMAILS`, `TZ=Asia/Kolkata`.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill values
npm run migrate
npm run dev
```

The database schema (`db/schema.sql`) runs automatically on every start and seeds default services, expense categories and seats on first run.
