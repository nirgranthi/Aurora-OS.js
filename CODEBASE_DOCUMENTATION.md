# Aurora OS Codebase Documentation

This document outlines the custom logic, classes, and utility functions implemented in Aurora OS. It excludes standard React/library boilerplate.

## 1. System Utilities (`src/utils`)

### File System (`fileSystemUtils.ts`)
The core of the virtual file system logic.
- **`FileNode` Interface**: Recursive structure defining files and directories (name, id, content, children, permissions, owner).
- **`initialFileSystem`**: Defines the "Factory Reset" state of the OS, mimicking a Linux directory structure (`/bin`, `/etc`, `/home`, `/root`).
- **`checkPermissions(node, user, operation)`**: **[CRITICAL]** Implements Linux-style permission enforcement (rwx).
    - Checks Owner, Group (primary + supplementary), and Others bits.
    - **Sticky Bit (`t`)**: Enforced for deletion in directories like `/tmp`.
    - **Directory Traversal**: Implies `execute` permission on directories.
- **`createUserHome(username)`**: Generates a standard home directory structure (Desktop, Documents, .Config, etc.) with secure default permissions (750).
- **`deepCloneFileSystem(root)`**: Utility for immutable state updates in React.
- **`parsePasswd/formatPasswd`**: Logic to sync `User` objects with the textual content of `/etc/passwd`.
- **`parseGroup/formatGroup`**: Parsing logic for `/etc/group` and supplementary group support.

### Memory Management (`memory.ts`)
Manages `localStorage` persistence with a tiered approach.
- **`softReset()`**: Clears "Soft Memory" (Preferences, Desktop Icons, Sound Settings). Safe to run.
- **`hardReset()`**: Clears "Hard Memory" (Filesystem, User Database) + Soft Memory. Equivalent to a factory wipe.
- **`getStorageStats()`**: Calculates byte usage for soft/hard memory tiers.

### Grid System (`gridSystem.ts`)
Implements Windows 11-style desktop icon positioning.
- **`snapToGrid(x, y, config)`**: Aligns pixel coordinates to nearest grid cell.
- **`findNextFreeCell(occupied, config)`**: Column-major auto-arrangement logic (fills Top->Bottom, Right->Left).
- **`rearrangeGrid(...)`**: Complex logic to handle icon insertion/displacement (shifting icons to make room) during drag-and-drop.

### Colors (`colors.ts`)
Utilities for theme generation.
- **`lightenColor`/`darkenColor`**: Hex-based brightness manipulation.
- **`mixColors(color1, color2, weight)`**: Blends two colors, used for generating theme tints.
- **`getComplementaryColor(hex)`**: Used for the 'Contrast' theme mode.

## 2. Global State & Contexts (`src/components`)

### FileSystemContext (`FileSystemContext.tsx`)
The "Kernel" of the OS.
- **`users` State**: The user database, persisted to `aurora-users` and synced bi-directionally with `/etc/passwd`.
- **`moveNodeById(id, destPath)`**: **[SECURE]** Drag-and-drop handler with permission enforcement. Prevents moving system files or moving folders into themselves.
- **`createFile/createDirectory`**: Enforces Write permissions on parent folders.
- **`listDirectory/readFile`**: Enforces Read permissions on target nodes.
- **`resetFileSystem()`**: Trigger for the `hardReset` logic.

### AppContext (`AppContext.tsx`)
Global configuration state.
- **`useAppContext()`**: Accessor for `accentColor`, `themeMode` (neutral/shades/contrast), and performance flags (`blurEnabled`, `reduceMotion`).
- **CSS Variable Sync**: Automatically writes state updates to CSS variables (`--accent-user`, `--blur-enabled`) for global styling.

## 3. Custom Hooks (`src/hooks`)

### `useThemeColors()`
Dynamic color generation engine.
- Generates a semantic color palette (`windowBackground`, `titleBarBackground`, etc.) based on the user's `accentColor`.
- Handles `blurEnabled` logic (disabling transparency/backdrop-filter if blur is off).
- Implements theme modes:
    - **Neutral**: Pure dark gray (`#171717`).
    - **Shades**: Tinted dark gray (mixed with accent).
    - **Contrast**: Tinted with complementary color.

### `useAppStorage(appId, initial)`
Namespaced persistence hook.
- Wraps `localStorage` but prefixes keys with `aurora-os-app-${appId}`.
- Allows apps (Finder, Terminal) to save state without colliding or needing to manage raw storage keys.

## 4. Services (`src/services`)

### SoundManager (`sound.ts`)
Singleton audio controller.
- **Channel System**: Separates 'Master', 'System', 'UI', and 'Feedback' volume channels.
- **`play(type)`**: Plays preloaded sounds based on semantic names ('click', 'error') adjusting for channel volume.

### NotificationService (`notifications.tsx`)
- **`notify.system(type, source, message)`**: Standardized system toaster that handles both the UI (Sonner toast) and Audio feedback (Success/Error sounds) simultaneously.

## 5. Applications (`src/components/apps`)

### Terminal (`Terminal.tsx`)
A fully functional shell emulator using React state.
- **Command Parsing**: Custom parser supporting arguments, flags, and quoting.
- **Redirection**: Supports `>` (overwrite) and `>>` (append) standard shell operators.
- **Globbing**: Basic `*` wildcard expansion.
- **Built-in Commands**: `cd` (with permission checks), `ls` (long format support), `cat`, `rm`, `echo`, etc.
- **Scripting**: Basic hashbang (`#!app`) support to launch other OS apps.

