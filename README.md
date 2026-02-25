# Shop (Vue 3 + TypeScript + Vite)

A small shop template using Vue 3, TypeScript, Vite and a lightweight MySQL + serverless API backend (Vercel Functions). The project contains an admin UI for managing products, groups, shipping and theme settings.

Useful links:

- Vue 3 script setup: https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
- TypeScript + Vue guide: https://vuejs.org/guide/typescript/overview.html

## MySQL + Vercel Functions backend

This project runs backend API routes from the `api/` folder (designed for Vercel Functions) and uses MySQL for persistence.

### Environment

Copy `.env.example` to `.env.local` and fill in the database credentials:

- `DB_HOST`
- `DB_PORT` (optional)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

For Vercel deployment, set the same keys under Project Settings → Environment Variables.

### Database bootstrap / migration

A startup migration script and API endpoint ensure tables exist and seed defaults when necessary.

- To run the migration manually (uses your `.env.local`):

```bash
npm run db:init
```

- The API endpoint `POST /api/bootstrap` also ensures the schema and seeds data; the frontend calls this automatically on app startup.

### API routes (overview)

- `GET/POST /api/products`
- `PUT/DELETE /api/products/:id`
- `GET/POST /api/groups`
- `PUT/DELETE /api/groups/:id`
- `GET/PUT /api/settings`
- `POST /api/bootstrap` (creates tables / seeds)
- `GET /api/orders-count` (admin)

## Theme & DB persistence

Theme selection (presets and custom colors) is persisted in the database so the site shows the same theme across restarts and deployments.

- Theme fields live on the single `settings` row:
  - `theme_mode` — one of `default`, `teal`, `rose`, `custom`
  - `theme_custom_accent_hex`
  - `theme_custom_muted_hex`
  - `theme_custom_danger_hex`

- The Admin → Theme UI saves theme changes via `PUT /api/settings`.
- On startup the frontend reads settings via `POST /api/bootstrap` and applies the stored theme.

If you add or change the database, run the migration to ensure these columns exist:

```bash
npm run db:init
```

Then start the local dev server with API routes active:

```bash
npm run dev:vercel
```

To test theme persistence:

1. Open Admin → Theme and choose a preset or enter custom colors.
2. Click the button to apply/save the theme (this issues `PUT /api/settings`).
3. Reload the site — the theme should reflect the saved values from the DB.

If a save fails, check the dev server console for logs — the API prints incoming payloads and errors when debugging is enabled. Paste any server log output here and I can help diagnose further.

## Local development

- Frontend only:

```bash
npm run dev
```

- Frontend + Vercel Functions (recommended for DB testing):

```bash
npm run dev:vercel
```

If `vercel` install conflicts occur, run:

```bash
npm uninstall vercel @vercel/backends
npm run dev:vercel
```

When `vercel dev` is running the `api/` routes are active and use the configured MySQL instance. If API routes are unavailable the app falls back to local in-memory/localStorage behavior for some features.

---

If you'd like, I can add a short API test script that hits `PUT /api/settings` with example payloads to automate manual checks. Want me to add that?
