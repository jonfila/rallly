# IAIS fork of Rallly

This branch (`iais`) is a modified copy of [Rallly](https://github.com/lukevella/rallly),
maintained by Inclusive AI Strategies for its own self-hosted instance at
https://poll.inclusiveaistrategies.com. Rallly is licensed under the GNU Affero General
Public License v3.0 or later (see `LICENSE`); this fork is distributed under the same license.

## Base

Upstream tag `v4.15.5`.
Rebased from `v4.15.4` on 2026-10-19 with `git rebase --onto v4.15.5 v4.15.4 iais`.
All fork commits replayed without conflicts, and the fork's diff against its base is
unchanged. v4.15.5 upgrades Next.js from 16.3.8 to 16.4.2 for GHSA-p3m5-59mp-jv5r (high,
unauthenticated denial of service through Server Actions); nothing else changes.

## Changes (2026-08-25)

| File | Change |
|---|---|
| `apps/web/src/features/licensing/data.ts` | `getWhiteLabelAddon()` returns `true` on a self-hosted instance, so custom branding works without an Enterprise license key. |
| `apps/web/src/features/branding/data.ts` | `getInstanceBrandingConfig()` treats a self-hosted instance as having the white-label add-on. |
| `apps/web/src/features/branding/loaders.ts` | The control-panel Branding page does the same, so its fields are editable. |
| `apps/web/src/features/api-keys/data.ts` | `isApiAccessEnabled()` allows the space owner on a self-hosted instance (API keys can be created in Settings). |
| `apps/web/public/favicon*`, `apple-touch-icon-*`, `android-chrome-*`, `logo.png`; `apps/web/src/app/manifest.json` | Favicons, touch icons, and web-app manifest replaced with the IAIS mark, name "IAIS Polls", theme colour #2e4e42. |
| `.github/workflows/iais-image.yml` | Builds a `linux/amd64` image and publishes it to `ghcr.io/jonfila/rallly` on every push to `iais`. |

The link to this Corresponding Source (AGPL section 13) is shown on every poll page through
the instance footer links (Control Panel, Settings), which upstream renders regardless of the
attribution setting.

CI also runs on pushes to `iais`, including unit, integration, type, and Docker
smoke checks. Deploy only after the image build and applicable checks pass.

## Running it

Set `RALLLY_IMAGE=ghcr.io/jonfila/rallly:iais` in the self-hosted stack's `.env` and restart.
