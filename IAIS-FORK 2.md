# IAIS fork of Rallly

This branch (`iais`) is a modified copy of [Rallly](https://github.com/lukevella/rallly),
maintained by Inclusive AI Strategies for its own self-hosted instance at
https://poll.inclusiveaistrategies.com. Rallly is licensed under the GNU Affero General
Public License v3.0 or later (see `LICENSE`); this fork is distributed under the same license.

## Base

Upstream tag `v4.9.2` (commit 679376b5).

## Changes (2026-08-25)

| File | Change |
|---|---|
| `apps/web/src/features/licensing/data.ts` | `getWhiteLabelAddon()` returns `true` on a self-hosted instance, so custom branding (app name, colors, logos, attribution toggle) works without an Enterprise license key. |
| `apps/web/src/features/branding/queries.ts` | `getInstanceBrandingConfig()` reads that flag instead of the license record. |
| `apps/web/src/app/[locale]/control-panel/branding/page.tsx` | Branding page uses the same flag, so its fields are editable. |
| `apps/web/src/features/developer/data.ts` | `isApiAccessEnabled()` allows the space owner on a self-hosted instance (API keys can be created in Settings). |
| `apps/web/src/components/poll/poll-footer.tsx` | A "Source" link to this branch is always shown, satisfying the AGPL section 13 offer of Corresponding Source. |
| `.github/workflows/iais-image.yml` | Builds a `linux/amd64` image and publishes it to `ghcr.io/jonfila/rallly` on every push to `iais`. |

## Running it

Set `RALLLY_IMAGE=ghcr.io/jonfila/rallly:iais` in the self-hosted stack's `.env` and restart.
