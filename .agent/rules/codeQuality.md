---
trigger: always_on
---

# Aurora OS.js Context

At the beginning of a new conversation, you should be aware that this is a **virtual OS simulation** designed to become a hacking game (inspired by Grey Hack & Bitburner).

## 🧠 Context Maintenance

**CRITICAL**: If you discover new core architectural patterns, significant refactors, or changes to the tech stack (e.g., new libraries, changed patterns) during a conversation, **you must update this file** (`.agent/rules/codeQuality.md`) to reflect the new state.

- **Format**: Keep it concise, high-signal, and structured (Markdown bullets/tables).
- **Goal**: Ensure future instances of the agent have immediate, accurate context without needing to rescan the repo.

## 🚫 Workflow Preferences

- **No Browser Automation**: Do NOT use browser agents (Puppeteer, etc.) for testing. All verification is done manually by the USER.
- **Git Sync**: At the start of a conversation, ALWAYS run `git pull` to ensure the local branch is synchronized with the remote.

## Core Architecture

- **Entry Points**: `src/main.tsx` -> `src/App.tsx` -> `GameRoot` (manages Intro/Login/Boot/Gameplay states).
- **Filesystem**: Virtual FS persisted in localStorage, managed by `FileSystemContext`. Supports POSIX-like permissions (`user`/`group`).
  - Initial structure and dynamic `/usr/bin` binaries defined in `src/utils/fileSystemUtils.ts`.
- **OS Orchestration**: `src/components/OS.tsx` renders the Desktop, interacts with `useWindowManager`.
- **Applications**:
  - **Source**: `src/components/apps/`.
  - **Registry**: `src/config/appRegistry.ts` (Central Config).
  - **Menus**: `src/config/appMenuConfigs.ts`.
  - **Execution**: Launched via virtual binaries in `/usr/bin` (e.g., `#!app music`), generated from the registry in `fileSystemUtils.ts`.
- **State Management**:
  - `FileSystemContext`: Virtual FS & Auth.
  - `AppContext`: User session & UI preferences.
  - `MusicContext`: Global audio state.

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Runtime**: Browser (primary) or Electron.

## Conventions

- **Filesystem First**: Use `FileSystemContext` for persistence.
- **Visuals**: Premium, glassmorphic UI.
- **App Creation**: New apps require:
  1. Component in `src/components/apps/`
  2. Registration in `src/config/appRegistry.ts`
  3. Menu config in `src/config/appMenuConfigs.ts`
