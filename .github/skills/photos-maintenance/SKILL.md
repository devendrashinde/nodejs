---
name: photos-maintenance
description: 'Improve, maintain, refactor, or extend the Photo Gallery project. Use when fixing bugs, delivering focused or larger features, updating Node or Express code, changing gallery UI behavior, touching MySQL-backed APIs, thumbnails, uploads, playlists, favorites, image editing, caching, or deployment docs. Favors root-cause fixes, phased feature work, repo-specific validation, and documentation updates.'
argument-hint: 'Describe the improvement, bug, feature, or maintenance task to perform'
user-invocable: true
---

# Photo Gallery Maintenance

Use this skill for ongoing work in this repository when the goal is to improve behavior, maintain existing features, or deliver anything from a focused enhancement to a larger feature without losing alignment with the current architecture.

## When to Use

- Fix a bug in the gallery, upload flow, thumbnails, album browsing, search, favorites, playlists, or image editing.
- Refactor server or frontend code while preserving current behavior.
- Add a focused feature or a larger feature that still fits the existing Express plus Pug plus AngularJS structure.
- Update environment handling, MySQL integration, cache behavior, or deployment steps.
- Clean up technical debt and leave the repository in a better-documented state.

## Feature Size Guidance

- Treat work as focused when it mainly changes one route, one view flow, or one subsystem with limited docs impact.
- Treat work as larger-feature delivery when it spans multiple layers such as routes, controllers, frontend behavior, database state, cache behavior, or user-facing docs.
- For larger features, still avoid broad rewrites. Break the work into safe phases with clear integration points and validate each phase before moving on.
- If a requested feature conflicts with existing routes, env names, or documented behavior, preserve backward compatibility unless the task explicitly authorizes a breaking change.

## Project Constraints

- Main server entrypoint: `server-photos.js`
- Runtime: Node.js with Express, Pug templates, static assets in `public/`, and feature code under `app/`
- Data and media live in `data/`; generated thumbnails and cache artifacts live under `temp-pic/` and `cache/`
- Database-backed features depend on MySQL or MariaDB and `.env` configuration
- Automated tests are minimal to nonexistent, so validation is usually a combination of diagnostics, focused endpoint checks, and manual browser verification
- The repository contains many implementation notes and feature docs; check them before changing established behavior

## Workflow

### 1. Frame the Change

Clarify the target outcome before editing anything.

- Identify whether the task is a bug fix, maintenance cleanup, refactor, focused feature, or larger feature.
- Determine whether the change is frontend, backend, database, filesystem, or documentation-heavy.
- Check for affected subsystems: uploads, thumbnails, albums, tags, playlists, favorites, image editing, search, advanced features, or deployment.
- Prefer the smallest change that fixes the root cause.
- For larger features, define the user-visible outcome, the affected layers, the likely integration points, and what can be delivered incrementally.

### 2. Gather Existing Context

Inspect the current implementation and existing docs before proposing a solution.

- Read the primary code path first instead of guessing.
- Search for existing routes, controllers, models, or client code that already implement related behavior.
- Review relevant docs such as `README.md`, `QUICKSTART.md`, feature-specific markdown files, and SQL migration docs when the task touches documented features.
- If a behavior already has a documented API contract or UI flow, preserve it unless the task explicitly changes it.
- For larger features, look for previous implementation summaries or adjacent features that establish patterns worth reusing.

### 3. Plan the Smallest Safe Edit or Delivery Phases

- Keep public routes, query parameters, and file layout stable unless the task requires a change.
- Match the existing code style and dependency choices.
- Avoid broad rewrites in `server-photos.js` when the change can stay in a controller, route, service, or frontend module.
- If database schema changes are required, update the relevant SQL migration documentation instead of hiding schema drift inside application code.
- Do not fix unrelated issues unless they block the requested change.
- For larger features, break the work into phases such as data model, backend API, frontend wiring, and documentation.
- Sequence the phases so partial progress does not leave the app in an obviously broken state.
- When possible, preserve existing behavior behind additive endpoints, optional fields, or feature-specific UI entry points instead of replacing stable flows outright.

### 4. Implement

- Make focused edits in the narrowest set of files possible.
- Preserve existing env variable names and defaults unless there is a strong reason to change them.
- Keep filesystem operations safe around `data/`, `cache/`, and `temp-pic/`.
- For API changes, keep validation and security behavior intact, especially for path handling, uploads, and database inputs.
- For UI work, preserve the project’s current interaction model unless the task explicitly calls for a visual redesign.
- For larger features, land backend and frontend changes in a way that keeps contracts explicit and traceable.
- Reuse existing folders and feature boundaries before creating new top-level patterns.

### 5. Validate Using Repo-Realistic Checks

Use the lightest validation that proves the change works.

#### Always do

- Check editor diagnostics for changed files.
- Review for obvious route, import, path, and async flow breakage.
- Confirm docs are still accurate if behavior or setup changed.
- For larger features, verify each delivered phase before assuming the overall feature is done.

#### Do when backend behavior changed

- Start the app with `npm run dev` or `npm start`.
- Verify the affected endpoint or page at `http://localhost:8082`.
- Use targeted `curl` or browser checks for changed routes instead of broad manual wandering.
- If the feature adds new endpoints or parameters, validate both the new path and any existing path that could regress.

#### Do when database behavior changed

- Confirm `.env` expectations are still correct.
- Check whether a SQL migration or deployment note also needs an update.
- Validate against the documented MySQL or MariaDB flow, including `docker-compose-mysql.yaml` when relevant.
- Confirm older records or empty-state behavior still make sense after schema-affecting changes.

#### Do when thumbnail, cache, or file lifecycle logic changed

- Verify the relevant file paths under `cache/` and `temp-pic/`.
- Use `npm run cleanup-thumbnails:dry` before destructive cleanup behavior.
- Confirm existing media in `data/` still resolves correctly.

#### Do when frontend behavior changed

- Check the affected view or interaction in the browser.
- Verify that any API contract consumed by frontend code still matches the server response.
- Confirm no obvious regressions in album navigation, modal usage, or feature toggles around the changed area.
- For larger UI features, verify initial load, empty states, success flow, and at least one failure or invalid-input path.

### 6. Finish Cleanly

- Update docs when setup steps, API behavior, feature scope, or operational commands changed.
- For larger features, update the most relevant implementation or feature docs instead of only the top-level README.
- Summarize what changed, what was validated, and any remaining risks.
- Call out missing automated coverage when manual verification was the only realistic check.

## Completion Criteria

The task is complete when all of the following are true:

- The requested improvement or maintenance task is implemented at the root cause.
- Larger feature work is integrated across the required layers without leaving partial, undocumented behavior behind.
- Changed files are free of new diagnostics that are relevant to the work.
- The affected runtime path was validated with a repo-appropriate check.
- Any required docs or SQL notes were updated.
- Residual risks or unverified areas are stated explicitly.

## Useful Starting Points

- `server-photos.js` for the main server flow and route wiring
- `app/controllers/`, `app/routes/`, `app/services/`, and `app/models/` for feature logic
- `public/` and Pug templates for client behavior and styling
- `README.md`, `QUICKSTART.md`, and feature-specific markdown files for established workflows
- `sql/` for schema and migration history

## Example Prompts

- `/photos-maintenance fix broken thumbnail regeneration after image edits`
- `/photos-maintenance add a larger feature for managing playlist ordering across backend and UI`
- `/photos-maintenance review the favorites API flow and make it easier to maintain`
- `/photos-maintenance update the upload validation logic and keep docs in sync`