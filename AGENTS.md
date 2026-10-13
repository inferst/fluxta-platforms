# AGENTS.md

This document provides instructions for agentic coding agents working in this repository.

## Project Overview

Platforms is a [Fluxta](https://fluxta.app) plugin that connects a streamer's broadcasting Platforms to Fluxta. What happens on a Platform (a Chat Message, a Command, a Redemption, a Poll, a follow, a raid, a ban …) becomes a Fluxta Event; its Actions act back on the Platform (send a message, resolve a Redemption, start a Poll or a Prediction, moderate, change the stream info). Twitch is the first Platform, through the `@twurple/*` libraries; YouTube and Kick are expected to follow. The vocabulary — Platform, Account, Broadcaster Account, Bot Account, Channel, Command, Reward, Redemption, Poll, Prediction — is in `CONTEXT.md`.

It is a pnpm workspace (turbo) of three TypeScript packages. The Plugin API it builds against — `@fluxta/sdk` and the `fluxta` CLI from `@fluxta/cli` — is owned by Fluxta, not by this repo (see [Working against Fluxta](#working-against-fluxta)).

## Commands

### Setup

```bash
pnpm install     # Node ≥ 22, the pnpm version pinned in package.json
```

### Development & Build

```bash
pnpm build       # wipe dist/ and build the editors and the sidecar into dist/platforms/
pnpm dev         # build the editors once, then watch both apps
pnpm typecheck   # tsc --noEmit in every package
pnpm test        # vitest in apps/plugin and packages/protocol
```

### Target a specific package

```bash
pnpm --filter platforms-plugin test
pnpm --filter platforms-protocol test
pnpm --filter platforms-editor build
```

### Run it in Fluxta

`dist/platforms/` is the build folder Fluxta loads (see Fluxta's [Development](https://fluxta.app/docs/plugins/getting-started/development) guide). With Fluxta running:

```bash
pnpm exec fluxta link dist/platforms   # once: a development link to this build
pnpm dev                               # every successful sidecar build runs `fluxta restart`
pnpm exec fluxta link --status         # what is linked
pnpm exec fluxta unlink                # back to the installed package
```

Editor-only rebuilds restart nothing — reopen the editor in Fluxta to see them. The sidecar logs to `dist/platforms/logs/platforms.log`; `pnpm build` wipes `dist/` and the log with it. A crashed sidecar is not restarted until the next build or `fluxta restart`. Signing in an Account talks to the real Twitch.

## Architecture

### Packages

- `apps/plugin` (`platforms-plugin`) — the Plugin sidecar: the Node.js process Fluxta starts. tsdown bundles it into `dist/platforms/index.mjs` and copies `manifest.json` and `icons/` beside it.
- `apps/editor` (`platforms-editor`) — the editors, React + Vite + Tailwind, built into `dist/platforms/editor/`: the Plugin Editor (`plugin.html` — Accounts, Commands and Rewards, with its own entry in Fluxta's navigation) and an Action Editor for every Action that has something to configure.
- `packages/protocol` (`platforms-protocol`) — what the sidecar and the editors share: the editor ↔ sidecar messages and the state the Plugin Editor renders (`index.ts`, each message an object with an `event` discriminant), the Command shape and its validation (`command.ts`), the Reward draft and its validation (`reward.ts`), every Action's settings type and limits (`action.ts`). Consumed as TypeScript source; it has no build.

### Plugin sidecar (`apps/plugin/src`)

```
index.ts          composition root: Accounts, services, every registration, editor messages, connect()
plugin.ts         the single `Plugin` instance from @fluxta/sdk/api
accounts/         the Broadcaster and Bot Account slots
  store.ts          the whole Plugin Settings blob — everything persisted lives in it
  service.ts        sign-in, token refresh, the editor's Account state, the connections reported to Fluxta
twitch/           Twitch plumbing
  config.ts         the public client id and every scope each Account role requests
  oauth.ts          the Device Code Flow and token refresh twurple cannot do for a public client
  auth-provider.ts  twurple's AuthProvider, fed from the Accounts
  eventsub.ts       one EventSub WebSocket for every subscription; turns notifications into Events
  errors.ts         a failed Twitch call → one line worth showing a streamer
chat/             sending chat: a queue per Account under Twitch's rate limits; own messages never come back as Events
commands/         Command recognition, Cooldowns, Chat Message → `command-triggered`
rewards/ polls/ predictions/ moderation/ channel/ stream/
                  one Twitch feature each: api.ts (the narrowed slice of twurple it uses), service.ts, its model
actions/          one StandaloneAction per manifest Action
events/           one file per manifest Event: its `type`, its payload type, a to…Payload mapping
open-browser.ts   opens the sign-in page from the sidecar — editor iframes are sandboxed
```

### Editors (`apps/editor`)

- One HTML entry per Action Editor at the package root, named after the Action without its `twitch-` prefix (`ban-user.html` edits `twitch-ban-user`), each mounting `src/<editor>/main.tsx`. Fluxta only serves the path the manifest names, so every Action Editor is its own page; `vite.config.ts` picks up every `*.html` on its own. An Action with nothing to configure (`twitch-end-poll`, `twitch-clear-chat` …) has no editor.
- `src/plugin/` is the Plugin Editor: `accounts/`, `commands/`, `rewards/` cards. `src/shared/` holds what several editors use.
- Editors are built from Fluxta's [UI Kit](https://fluxta.app/docs/plugins/reference/ui-kit) (`@fluxta/sdk/ui`) and talk to the sidecar through `platforms-protocol` messages.

## Key Conventions

- **Manifest and code change together.** `manifest.json` declares every Action, Event (with its Event Fields), Value Source and Options Source, and the code registers exactly those, by the same `type` / `key`. Adding an Action means: its manifest entry, `apps/plugin/src/actions/<name>.ts`, its registration in `index.ts`, its settings type in `platforms-protocol`, and — if it has settings — `apps/editor/<name>.html` and `apps/editor/src/<name>/`. Adding an Event means: its manifest entry, `events/<name>.ts` (whose payload type lists every Event Field the manifest declares) with its test, and the subscription that emits it.
- **Naming in the manifest** ([manifest reference](https://fluxta.app/docs/plugins/reference/manifest)): every kind — an Action or Event `type` — is kebab-case; every key — a Value Source `key`, a param, an Event Field, a produced value, an Options Source reference, a settings field — is camelCase.
- **Platform-specific vs. portable.** What only one Platform has carries its prefix: `twitch-chat-message`, `twitch-ban-user`, `twitchIsLive`. What every Platform will share has none and says which Platform fired it in a `platform` field: `command-triggered`, `send-message`. Keep raw platform data platform-specific and put the portable layer on top of it, so a scenario built on a portable kind keeps working when YouTube or Kick start firing it.
- **Scopes are requested up front.** `twitch/config.ts` lists every scope each Account role needs, and sign-in asks for all of them on one consent screen: Fluxta matches Events itself and never tells the plugin which are in use. A new scope therefore puts every existing Account into `reauthorization-required` until it signs in again — add one only with the feature that needs it, and say so in the change.
- **Accounts own the tokens.** Everything that talks to Twitch goes through the Accounts' auth provider, so tokens are refreshed in one place. The client is public and has no secret; never add one.
- **Chat sends never block an Action.** `send-message` queues and returns at once; failures go to the log. The queue is unbounded on purpose — dropping a message is worse than sending it late.
- **Twitch failures speak to the streamer.** Turn a failed call into one line with `twitch/errors.ts`, not a stack trace.
- **Wrap twurple behind a narrowed type.** A feature area depends on its own `api.ts` interface (or an event `…Source` type), which twurple's real objects satisfy without an adapter — so it can be tested without a live connection.
- **Run Variables** ([guide](https://fluxta.app/docs/plugins/guides/run-variables)): settings edited through a `TemplateField` arrive with their Run Variable references substituted; an Action that creates something (a Poll, a Prediction) produces its id as a Run Variable.
- **The sidecar bundle is self-contained.** Fluxta runs it with a bundled Node and no `node_modules`, so tsdown inlines every non-builtin dependency (`noExternal`). Do not externalize one.
- **File naming**: the sidecar and `platforms-protocol` use kebab-case (`rate-limiter.ts`, `chat-message.ts`). In the editors, React components are PascalCase (`AccountsCard.tsx`), hooks are `useThing.ts`.
- **Tests**: vitest, colocated `*.test.ts`. Test a service against a fake class implementing its `api.ts` interface and recording what it was asked (`rewards/service.test.ts`); test an Event's mapping from a hand-built `…Source` object (`events/follow.test.ts`).
- **Comments say why** — the Twitch or Fluxta behaviour that forces the code — and use the capitalized terms of `CONTEXT.md` and Fluxta's [Terminology](https://fluxta.app/docs/plugins/getting-started/terminology).

## Working against Fluxta

- **Fluxta owns the Plugin API contract**: `@fluxta/sdk`, the manifest schema and the `fluxta` CLI, documented at [fluxta.app/docs/plugins](https://fluxta.app/docs/plugins). When this plugin needs something they do not offer, do not work around the contract or patch `node_modules`: record the need in an issue here, label it `ready-for-human`, and stop — a person takes it to Fluxta (see `docs/agents/issue-tracker.md`). Once a release of the SDK or CLI provides it, it is adopted here.
- **The SDK and the CLI come from npm**, pinned once in the `catalog:` of `pnpm-workspace.yaml`; packages say `"catalog:"`. The installed typings — `apps/plugin/node_modules/@fluxta/sdk/dist/api.d.mts` (sidecar) and `ui.d.mts` (editors) — are the contract at the version in use; Fluxta's own working tree may be ahead of it.
- **Adopting a new SDK or CLI version**: bump its `catalog:` entry, add the exact version to `minimumReleaseAgeExclude` (pnpm refuses a release younger than its minimum age otherwise), `pnpm install`, and commit `pnpm-workspace.yaml` and `pnpm-lock.yaml` together.
- **Versions and releases**: the plugin's version is `version` in `manifest.json`. A push to `main` that changes `manifest.json` runs `.github/workflows/release.yml`: when the `v<version>` tag does not exist yet, it builds, packages with `fluxta package`, tags the commit and drafts a GitHub Release. Bump the version only when the user asks for a release.
- **Publication**: `pnpm exec fluxta publish` validates the package and opens a pull request to Fluxta's trusted catalog (`fluxta/plugins`). The catalog can hold a newer version than this repo — Fluxta may bump a published package there itself, for instance to update a shared dependency — and `fluxta publish` merges against it rather than overwriting it. See Fluxta's [Publishing](https://fluxta.app/docs/plugins/getting-started/publishing) guide. Run it only when the user asks for it in the conversation.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/) without a scope, lowercase and imperative: `feat: add Twitch moderation-log events and chat-management actions`, `fix: …`, `chore: bump version`.

## Agent skills

- Issues: GitHub Issues at `inferst/fluxta-platforms`. See `docs/agents/issue-tracker.md`.
- Triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.
- Domain: `CONTEXT.md`, plus Fluxta's plugin docs. See `docs/agents/domain.md`.
