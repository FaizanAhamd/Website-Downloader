# Vercel Deployment — Architecture Guide

This document explains how the project *could* be deployed to Vercel in the future.
**This is a plan, not an active deployment.** The current app runs as a classic
Node.js/Express server on a normal host and is **not** Vercel-ready as-is.

## Why the whole app cannot run unchanged on Vercel

- The download engine spawns **GNU Wget**, which is not available in Vercel's
  serverless runtime.
- The engine reads/writes a **local filesystem** (`downloads/`, `private/archives/`),
  which is not durable in serverless functions.
- Long-running jobs exceed serverless function time limits.
- The ZIP download route relies on local file delivery and delete-on-download.

## What a production deployment requires

Published (not yet implemented, not falsely claimed as done):

- **Vercel-compatible frontend/API** — the static UI and a thin API layer that the
  Vercel frontend can call.
- **Durable job state** — jobs must survive across requests (e.g. a queue + a
  persisted status store), since a process may be recycled at any time.
- **External Docker-based Wget worker** — the actual mirroring runs in a long-lived
  container that has Wget installed, not in a serverless function.
- **Private object storage** — generated ZIP archives must go to object storage
  (e.g. S3-compatible) instead of the local filesystem.
- **HTTP job-status polling (or another deployment-compatible progress mechanism)**
  — Socket.IO can be replaced/ supplemented with a polling endpoint since long-lived
  sockets are not guaranteed on the edge.

These are the accepted constraints of the future deployment. Nothing in this repo
currently implements them.

## What is already prepared in this codebase

- `config.js` centralizes every env-driven setting.
- `public/js/downloader.js` is independent of the server renderer and can be hosted statically.
- No hardcoded API URLs exist; the socket connects to the same origin by default.
- The download engine (`wget/index.js`, `archiver/index.js`) is a separate module,
  independent of the frontend, and can be lifted into the worker container as-is.

## Environment variables

See `.env.example` for all variables currently supported. None are secrets;
they are branding and engine tunables.

## Limitations to document before deploying

- Long-running jobs require the external worker; never attempt them in a serverless function.
- Local filesystem ZIP storage must be replaced with object storage.
- Socket.IO long-polling works behind Vercel's edge but websocket transport may need configuration.
- Wget is not available in Vercel's runtime — the worker container must install it.
