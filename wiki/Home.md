# Welcome to ARK Server Manager 2.0 Wiki! 🎮

![ARK Server Manager Banner](https://img.shields.io/badge/ARK-Server_Manager_2.0-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**ARK Server Manager 2.0** is a modern, feature-rich server management application for **ARK: Survival Evolved (ASE)** and **ARK: Survival Ascended (ASA)**. Built with cutting-edge technologies (Tauri v2 + React), it provides a beautiful, intuitive interface for managing your ARK servers with zero manual configuration required.

---

## 🚀 Quick Links

| Documentation | Description |
|---------------|-------------|
| **[Installation Guide](Installation-Guide)** | Step-by-step installation instructions |
| **[Getting Started](Getting-Started)** | Your first server in 5 minutes |
| **[Server Management](Server-Management)** | Managing servers, start/stop, monitoring |
| **[Mod Management](Mod-Management)** | Installing mods from Steam Workshop & CurseForge |
| **[Configuration Guide](Configuration-Guide)** | INI editing, presets, and advanced settings |
| **[Backup & Restore](Backup-and-Restore)** | Automated backups and disaster recovery |
| **[Automation](Automation)** | Scheduled tasks, restarts, updates |
| **[RCON Console](RCON-Console)** | Remote control and admin commands |
| **[Troubleshooting](Troubleshooting)** | Common issues and solutions |
| **[FAQ](FAQ)** | Frequently asked questions |

---

## ✨ Key Features

### 🎯 **Zero-Configuration Setup**
No manual installation of dependencies! The app automatically handles:
- ✅ Visual C++ Redistributables (auto-installed with app)
- ✅ SteamCMD (auto-downloaded on first launch)
- ✅ Windows Firewall (auto-configured)

### 🎮 **Multi-Server Management**
- Host unlimited ASE and ASA servers
- Real-time CPU, RAM, and player monitoring
- One-click start/stop/restart controls
- Multiple servers on different ports

### ⚙️ **Advanced Configuration**
- Visual INI editor with validation
- Pre-configured presets (Vanilla, 5x, 10x, Custom)
- Raw text mode for advanced users
- Auto-save and backup before changes

### 🎨 **Mod Management**
- **ASE**: Browse Steam Workshop with 100,000+ mods
- **ASA**: CurseForge integration for latest mods
- Drag-and-drop load order management
- One-click installation and updates

### 🛡️ **Administration Tools**
- RCON console for remote commands
- Player management (view, kick, ban)
- Tribe file management
- Security controls (BattlEye, whitelisting)

### 🔄 **Automation**
- Cron-based task scheduler
- Automated backups with retention policies
- Scheduled server restarts
- Automatic server updates

---

## 🎯 What Makes This Different?

| Feature | ARK Server Manager 2.0 | Other Tools |
|---------|------------------------|-------------|
| **Zero Manual Setup** | ✅ Everything automatic | ❌ Manual VC++, SteamCMD |
| **Modern UI** | ✅ Glassmorphism design | ❌ Outdated interfaces |
| **ASE + ASA Support** | ✅ Both games | ⚠️ Usually only one |
| **Visual Config Editor** | ✅ User-friendly UI | ⚠️ Text-only |
| **Mod Manager** | ✅ Built-in browser | ❌ Manual downloads |
| **Real-Time Monitoring** | ✅ Live graphs | ⚠️ Basic stats |
| **Automated Backups** | ✅ Scheduled + retention | ⚠️ Manual only |
| **Privacy** | ✅ 100% local, no tracking | ⚠️ Cloud sync/telemetry |

---

## 📊 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: 8 GB
- **Storage**: 100 GB free space
- **Network**: Broadband internet connection

### Recommended Requirements
- **RAM**: 16 GB or more
- **Storage**: 200 GB+ SSD
- **CPU**: Intel i5/AMD Ryzen 5 or better
- **Network**: Dedicated/Static IP for hosting

---

## 🚀 Getting Started in 3 Steps

### 1️⃣ Install
Download the latest installer from [Releases](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/releases/latest) and run it. Dependencies install automatically!

### 2️⃣ Launch
Open ARK Server Manager 2.0. On first launch, SteamCMD will download automatically (takes ~1 minute).

### 3️⃣ Create Server
Click **"Deploy Server"** → Choose ASE or ASA → Select installation path → Click **"Install"**

🎉 **That's it!** Your server will be ready in 30-60 minutes (depending on download speed).

---

## 🔒 Privacy & Data Isolation

Your data is **100% private and local**:

- ✅ **No Cloud Sync**: All data stored on your PC only
- ✅ **No Telemetry**: Zero tracking or analytics
- ✅ **No Account Required**: No registration or login
- ✅ **Per-User Isolation**: Each Windows user gets separate data
- ✅ **Offline Capable**: Works completely offline after setup

### External Connections (Public APIs Only)
1. **Valve SteamCMD** - Download ARK server files
2. **Steam Workshop API** - Browse ASE mods (public)
3. **CurseForge API** - Browse ASA mods (public)

**No personal data is ever transmitted.**

---

## 📖 Documentation Structure

### For New Users
1. [Installation Guide](Installation-Guide) - Install the application
2. [Getting Started](Getting-Started) - Create your first server
3. [Server Management](Server-Management) - Basic server operations

### For Advanced Users
4. [Configuration Guide](Configuration-Guide) - INI editing and optimization
5. [Mod Management](Mod-Management) - Install and manage mods
6. [Automation](Automation) - Set up scheduled tasks
7. [RCON Console](RCON-Console) - Advanced admin commands

### For Troubleshooting
8. [Troubleshooting](Troubleshooting) - Fix common issues
9. [FAQ](FAQ) - Quick answers

---

## 🛠️ Tech Stack

**Frontend**:
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for performance graphs

**Backend**:
- Rust (Tauri v2 framework)
- SQLite for local database
- SteamCMD integration
- RCON protocol implementation

**APIs**:
- Steam Workshop API (ASE mods)
- CurseForge API (ASA mods)
- Public IP detection (ipify.org)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- 🐛 **Report Bugs**: [Create an issue](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/issues)
- 💡 **Suggest Features**: [Start a discussion](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/discussions)
- 📖 **Improve Docs**: Submit wiki edits
- 💻 **Code Contributions**: Submit pull requests

---

## 📞 Support & Community

- **📧 GitHub Issues**: [Bug Reports & Feature Requests](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/issues)
- **💬 Discussions**: [Community Forum](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/discussions)
- **📚 Documentation**: [User Guide](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/USER_GUIDE.md)
- **🏗️ Architecture**: [Technical Docs](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/ARCHITECTURE.md)

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/LICENSE) file for details.

---

## 🙏 Acknowledgments

Special thanks to:
- **Tauri Team** for the amazing framework
- **ARK Community** for feedback and testing
- **Steam Workshop** and **CurseForge** for mod APIs
- **All Contributors** who helped make this possible

---

**Ready to get started?** → [Installation Guide](Installation-Guide)

**Already installed?** → [Getting Started](Getting-Started)

**Need help?** → [Troubleshooting](Troubleshooting) or [FAQ](FAQ)
