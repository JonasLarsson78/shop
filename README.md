# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## MySQL + Vercel Functions backend

This project is prepared to run backend API routes in `api/` using Vercel Functions and MySQL.

### 1) Environment variables

Copy `.env.example` to `.env.local` and fill in values:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

For Vercel deployment, set the same keys in **Project Settings → Environment Variables**.

### 2) Database bootstrap

The endpoint `POST /api/bootstrap` creates required tables if they do not exist and seeds default data when tables are empty:

- `groups`
- `products`
- `settings`

The frontend calls this endpoint automatically on app startup.

You can also create/verify tables directly from your local `.env`:

`npm run db:init`

### 3) Available API routes

- `GET/POST /api/products`
- `PUT/DELETE /api/products/:id`
- `GET/POST /api/groups`
- `PUT/DELETE /api/groups/:id`
- `GET/PUT /api/settings`

### 4) Local development

Frontend-only dev still works with:

`npm run dev`

To run frontend + Vercel Functions locally (recommended for DB testing):

`npm run dev:vercel`

This uses a pinned Vercel CLI version to avoid npm peer-dependency conflicts on some setups.

If you previously tried installing `vercel` in this project and got `ERESOLVE`, remove it and retry:

`npm uninstall vercel @vercel/backends`

then run:

`npm run dev:vercel`

When `vercel dev` is running, API routes in `api/` are active and MySQL is used.

If API routes are not available locally, the app falls back to local in-memory/localStorage behavior.
