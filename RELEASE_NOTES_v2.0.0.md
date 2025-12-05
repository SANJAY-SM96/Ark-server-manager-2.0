# ARK Server Manager 2.0 - Release Notes

## 🎉 ARK Server Manager 2.0 - Initial Release

A modern, feature-rich server management tool for **ARK: Survival Evolved (ASE)** and **ARK: Survival Ascended (ASA)**.

---

## ✨ Key Features

### 🚀 Zero-Configuration Setup
- **Automatic Dependency Installation**: Visual C++ Redistributables install silently during app installation
- **SteamCMD Auto-Install**: Downloads and installs automatically on first launch with beautiful progress UI
- **Pre-Configured Firewall**: Windows Firewall rules for ARK ports (7777, 7778, 27015)
- **Ready in Minutes**: No manual configuration required!

### 🎮 Server Management
- **Multi-Game Support**: Manage both ASE and ASA servers from a single dashboard
- **Real-Time Monitoring**: Live CPU, RAM, and player count tracking
- **Process Control**: Start, Stop, Restart with status indicators
- **Multi-Server Hosting**: Run unlimited server instances on different ports

### ⚙️ Advanced Configuration
- **Visual INI Editor**: User-friendly interface for `GameUserSettings.ini` and `Game.ini`
- **Preset Templates**: Boosted (10x), 5x Rates, Vanilla, Custom presets
- **Raw Text Mode**: Direct file access for advanced administrators
- **Map Management**: Easy map switching with auto-configuration

### 🎨 Mod Management
- **ASE Support**: Integrated Steam Workshop search and installation
- **ASA Support**: CurseForge API integration for mod browsing
- **Load Order Management**: Drag-and-drop mod priorities
- **Auto-Installation**: One-click mod installation and configuration

### 🛡️ Administration
- **RCON Console**: Direct remote console access
- **Player Management**: View online players, kick/ban functionality
- **Tribe Management**: View and manage tribe save files
- **Security**: BattlEye toggle and IP management

### 🔄 Automation
- **Scheduled Tasks**: Cron-based scheduler for restarts, backups, updates
- **Automated Backups**: Scheduled world saves with restore functionality
- **Update Management**: SteamCMD integration for server updates

---

## 📥 Installation

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 8 GB minimum (16 GB recommended)
- **Storage**: 100 GB free space
- **Network**: Broadband internet connection

### Quick Install
1. **Download** `ARK-Server-Manager-2.0_2.0.0_x64-setup.exe` below
2. **Run the installer** (may require administrator privileges)
3. **Launch the application** - dependencies will install automatically!
4. **Create your first server** from the Dashboard

That's it! No manual setup required.

---

## 🔒 Privacy & Security

- ✅ **100% Local**: All data stored on your computer only
- ✅ **No Cloud Sync**: No remote servers or account required
- ✅ **No Telemetry**: Zero tracking, analytics, or data collection
- ✅ **Per-User Isolation**: Each Windows user gets their own independent installation
- ✅ **Offline Capable**: Works completely offline after initial setup

### External Connections
Only three types of external connections are made (all standard, public APIs):
1. **SteamCMD** → Valve's servers (for downloading ARK server files)
2. **Steam Workshop** → Public API (for browsing ASE mods)
3. **CurseForge** → Public API (for browsing ASA mods)

---

## 📖 Documentation

- **User Guide**: See [USER_GUIDE.md](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/USER_GUIDE.md)
- **Architecture**: See [ARCHITECTURE.md](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/ARCHITECTURE.md)
- **README**: See [README.md](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/README.md)

---

## 🐛 Known Issues

None at this time. Please report any issues on the [Issues page](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/issues).

---

## 🙏 Credits

Built with:
- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Rust (Tauri v2), SQLite
- **Technologies**: SteamCMD, RCON protocol, Steam Workshop API, CurseForge API

---

## 📝 License

MIT License - See [LICENSE](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/LICENSE) file for details.
