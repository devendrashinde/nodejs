# Project Guidelines

## Scope

These instructions apply to all work in this repository.

- Use the `photos-maintenance` skill for bug fixes, maintenance, refactors, focused feature work, and larger phased feature delivery that touches gallery behavior, APIs, thumbnails, uploads, playlists, favorites, image editing, caching, or deployment docs.
- Prefer minimal, root-cause fixes over broad rewrites.
- Preserve existing route shapes, env variable names, file layout, and documented behavior unless the task explicitly changes them.

## Architecture

- Main server entrypoint: `server-photos.js`
- Keep backend feature logic in `app/controllers/`, `app/routes/`, `app/services/`, and `app/models/` when possible instead of expanding `server-photos.js` unnecessarily.
- Frontend behavior lives across Pug templates and assets in `public/`; preserve existing interaction patterns unless the task calls for a UI change.
- Treat `data/` as source media, and `cache/` plus `temp-pic/` as generated or operational storage.

## Validation

- Start with diagnostics on changed files.
- When backend behavior changes, validate the affected page or endpoint at `http://localhost:8082` using focused checks.
- When database behavior changes, keep `.env`, SQL files in `sql/`, and `docker-compose-mysql.yaml` aligned.
- When thumbnail or file lifecycle behavior changes, verify the related paths under `cache/` and `temp-pic/`, and prefer `npm run cleanup-thumbnails:dry` before destructive cleanup flows.
- Do not claim automated test coverage where it does not exist; `package.json` currently has no real test suite.

## Documentation

- Check existing feature docs before changing established behavior.
- Update the relevant docs when setup, API behavior, or operational steps change.
- Prefer linking or aligning with existing docs such as `README.md`, `QUICKSTART.md`, and feature-specific markdown files instead of duplicating guidance.

## Change Discipline

- Avoid fixing unrelated issues unless they block the requested work.
- Keep security-sensitive behavior intact around uploads, path handling, and database inputs.
- Summarize what changed, how it was validated, and any remaining risks.