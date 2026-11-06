# Website Downloader 💾

**Product owner and maintainer:** Faizan Ahmad
**GitHub:** https://github.com/FaizanAhamd/Website-Downloader

Mirror publicly accessible static website content (HTML, CSS, images and JavaScript files) and download the collected files as a single ZIP archive.

> This tool mirrors publicly accessible web pages only. It cannot retrieve a site's private backend source code, databases or server configuration. Download only content you are authorized to access and store.

## Features

- Responsive, professional UI for desktop, tablet and mobile.
- Real-time download status via Socket.IO.
- Live Wget log output and file counter.
- Indeterminate progress indicator (no fake percentages).
- ZIP archive generation.
- Temporary, private archive storage with delete-on-download.
- Configurable product branding and contact information via environment variables.
- SSRF guard, download quota and timeout watchdog.

## Requirements

- Node.js 18 or newer.
- GNU Wget installed and available to the application, or configure `WGET_PATH`. On Windows a bundled `wget.exe` is provided.

## Local setup

```bash
npm install
cp .env.example .env
npm start
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then open `http://localhost:3000`.

Development mode: `npm run dev`.

## Configuration

See `.env.example`. All settings are environment-driven via `config.js`.

## ZIP archive retention

Archives are written to a private folder (`private/archives/` by default) — never inside `public/`. They are deleted automatically after the configured retention period (`DOWNLOAD_ZIP_TTL_HOURS`, default 24 hours) and immediately after a successful download via the `/download/:file` route. Archive files are not served as public static assets.

## Vercel deployment

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md). This is a documented future architecture, not an active deployment. The current application runs as a classic Node.js/Express server and is not yet Vercel-ready as-is.

## Legal and attribution

- Preserve the original project's MIT license and required copyright/permission notice (see `LICENSE.md`).
- Review `THIRD_PARTY_NOTICES.md` and verify all dependency and bundled-binary licenses.
- `views/privacy.hbs` and `views/terms.hbs` are drafts and require legal review before production.
