# Market POS — React + Express + Prisma + SQLite

A full-stack Point of Sale system for a small market, with USB HID barcode/QR
scanner support and ESC/POS thermal receipt printing. **JavaScript only** — no
TypeScript, no Supabase, no Firebase, no backend-as-a-service.

> This codebase runs locally with Node.js. It is not the app rendered in the
> Lovable preview — download/clone the `pos/` folder and run it on the market PC.

## Architecture

```
React (Vite, Tailwind, React Router)
        ↓  REST + JWT
Express.js  →  Prisma ORM  →  SQLite (dev.db)
        ↓
Printer service (services/printerService.js)
        ↓
USB / Network ESC/POS thermal printer
```

- `server/` — Express API, Prisma schema/seed, printer service, uploads
- `client/` — React POS and admin UI

## Requirements

- Node.js 18+ (20 LTS recommended)
- npm

## Installation

```bash
# Backend
cd server
cp .env.example .env         # then edit JWT_SECRET
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev                  # http://localhost:4000

# Frontend (new terminal)
cd client
npm install
npm run dev                  # http://localhost:5173
```

### Environment variables (`server/.env`)

```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="CHANGE_THIS_SECRET"
JWT_EXPIRES_IN="12h"
CORS_ORIGIN="*"
```

`.env` is gitignored — never commit it.

### Seed accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@market.local | ChangeMe123! |
| Cashier | cashier@market.local | ChangeMe123! |

Both accounts are forced to change the password on first login.

## Production build

```bash
cd client && npm run build      # outputs client/dist
cd ../server && npm start       # Express serves the API + built UI on :4000
```

## Running on the local network

The server listens on `0.0.0.0`, so other POS computers reach it at
`http://<server-ip>:4000`. The database stays on the server only — cashier
machines never hold their own SQLite file.

For a cashier PC running the dev UI, set `client/.env`:

```env
VITE_API_TARGET=http://192.168.1.10:4000
VITE_API_URL=http://192.168.1.10:4000/api
```

Offline synchronisation is **not** implemented: each POS terminal requires a
live connection to the local server.

## USB barcode / QR scanner

Use a scanner in **USB HID keyboard (keyboard wedge)** mode — it types the code
and sends Enter. Supported symbologies depend on the scanner; EAN-13, EAN-8,
UPC, Code 128 and QR are typical.

The POS screen keeps the scanner field focused automatically (and re-focuses
after every sale), so the cashier never clicks it. Flow: scan → lookup via
`GET /api/products/barcode/:barcode` → add to cart / increase quantity → beep.
Unknown codes open a "Product not found" dialog with Add / Search / Scan again.

**Troubleshooting**

- Nothing appears: test the scanner in a text editor; it must type the digits.
- Missing Enter: enable the "suffix CR/LF" setting in the scanner manual.
- Wrong characters: set the scanner keyboard layout to US English.
- Field loses focus: press **F1** or use Settings → Hardware test input.

## ESC/POS thermal printer

Configure under **Settings → Hardware**:

- Connection: `NETWORK` (raw TCP, default port 9100), `USB`, or `NONE`
- IP address / port, printer name, paper width `58mm` or `80mm`
- **Print test receipt** verifies the physical printer

Network printers work with no extra dependencies. For USB printers install the
optional native packages on the machine attached to the printer:

```bash
cd server
npm install escpos escpos-usb    # Linux also needs libusb-1.0-0-dev
```

If USB printing is unavailable, the receipt preview offers **Print via browser**
through the OS print dialog as a fallback.

**Troubleshooting**

- `Printer at x.x.x.x:9100 did not respond` — check IP, cable, and that the
  printer's raw/JetDirect port is enabled.
- USB not detected on Linux — add a udev rule or run the service with access to
  the device; verify with `lsusb`.
- Garbled output — wrong paper width; switch between 58mm and 80mm.

## Keyboard shortcuts (POS screen)

`F1` focus scanner · `F2` search · `F4` payment · `F5` clear cart ·
`F6` hold sale · `F7` held sales · `F8` reprint last receipt · `Esc` close modal

## Security

bcrypt password hashing, JWT auth, role-based authorization (ADMIN / CASHIER),
Helmet, CORS, Zod request validation, unique-barcode checks, image type/size
limits (JPG/PNG/WEBP, 2MB), and no password hashes in any API response. There is
no public registration — administrators create users.

## Data integrity

Every sale runs inside a Prisma transaction: validate products → validate stock
→ compute totals server-side → create Sale + SaleItems → decrement stock →
write InventoryMovement rows. Any failure rolls the whole thing back. The
backend is the sole authority for prices, discounts, tax and totals. Refunds
create a `Refund` record and restore stock; the original sale is never deleted.
Reprints never touch inventory. Receipt numbers come from a dedicated counter
(`00000001`, `00000002`, …), not the database id.
