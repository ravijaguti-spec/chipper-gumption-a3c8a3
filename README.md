# ELITORR — Shared Jewellery Order Management

This package keeps the existing ELITORR interface and moves order data to a shared Node.js + SQLite API. Every phone, tablet and computer using the same deployed URL reads and writes the same database.

## Run locally

1. Install Node.js 18+.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Deploy on Render

Create a Web Service from this folder/repository.

- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node

**Important:** SQLite needs persistent storage. On Render, attach a persistent disk and set `DB_PATH` to a path on that disk, for example `/var/data/elitorr.db`. Without a persistent disk, a redeploy/restart can lose SQLite data.

## Deploy on Railway

Deploy the repository as a Node service and attach a persistent volume. Set `DB_PATH` to the mounted volume path, for example `/data/elitorr.db`.

## Shared use

Open the deployed URL on all devices. The frontend refreshes from the server every 30 seconds, and create/edit/delete/import/export operations use the shared API.

## Backup

`Export Backup` downloads the current server database as JSON. `Import Backup` replaces the shared database with the selected JSON backup.

## Notes

- Images are stored as base64 strings in SQLite, matching the existing ELITORR data model.
- The existing JPG generation remains in the frontend and includes the product image and notes.
- The PWA manifest/service worker allows supported mobile browsers to install ELITORR to the home screen without an app store.
- This package does not add login/role permissions; anyone with the deployed URL can access the order data.
