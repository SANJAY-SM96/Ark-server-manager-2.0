# Architecture Documentation

## Overview
Ark Server Manager 2.0 follows a **Client-Server** architecture where the "Server" is a local Rust backend embedded via Tauri, and the "Client" is a React-based webview.

## 🏗️ Backend (Rust)
Located in `src-tauri/src/`. The backend is responsible for all system operations, file I/O, and process management.

### Core Modules
- **`lib.rs`**: Entry point. Initializes the database, services, and registers Tauri commands.
- **`AppState`**: Shared state managed by Tauri, holding Mutex guards for the Database and System Monitor.

### Services (`src/services/`)
Separated business logic layer to keep Commands clean.
1.  **`ProcessManager`**:
    - Manages `std::process::Command` aggregations for ARK server instances.
    - Handles PID tracking and start/stop signals.
    - Constructs complex launch arguments (Maps, Mods, MultiHome).
2.  **`SteamCmdService`**:
    - Handles the lifecycle of `steamcmd.exe`.
    - Automated downloading/installing of SteamCMD if missing.
    - Executes `app_update` for checking BuildIDs and installing servers.
3.  **`SchedulerService`**:
    - Background thread checking a SQLite `schedules` table every minute.
    - Executes tasks (Restart/Backup/Update) based on Cron expressions.
4.  **`ModScraper`**:
    - Scrapes Steam Workshop and CurseForge APIs to fetch mod details (Name, Image, Size).

### Database (`src/db/`)
- **SQLite** used for persistence.
- **Tables**: `servers`, `backups`, `schedules`.
- Migrations are handled on app startup.

## 🎨 Frontend (React)
Located in `src/`. Built with efficiency and modern UI patterns in mind.

### State Management
- **Zustand** stores (`serverStore`, `configStore`) used for global state.
- **React Query** (or standard Hooks) used for async data fetching.

### IPC Layer (`src/utils/tauri.ts`)
- TypeScript wrapper for all Tauri `invoke` calls.
- Provides strict typing for all backend commands.

### File Structure
```
src/
├── components/    # Reusable UI (Sidebar, Dialogs, Inputs)
├── pages/         # Route Views (Dashboard, ConfigEditor, Network)
├── stores/        # Zustand State
├── utils/         # Helpers & IPC
└── types.ts       # Shared TypeScript Interfaces
```

## 🔄 Data Flow
1.  **Frontend** triggers action (e.g., "Start Server").
2.  **React** calls `startServer()` in `tauri.ts`.
3.  **Tauri** bridges call to `commands::server::start_server`.
4.  **Rust Command** acquires `ProcessManager` lock from `AppState`.
5.  **ProcessManager** spawns the child process and returns success.
6.  **Tauri** returns Result to Frontend.
7.  **Frontend** shows Toast notification and updates UI state.

## 🔒 Security
- All sensitive operations (File I/O, Shell execution) are sandboxed within the Rust backend.
- Frontend cannot execute arbitrary code outside of defined Commands.
