# ARK Server Manager 2.0 - User Guide

## 📖 Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [First Time Setup](#first-time-setup)
4. [Managing Your Server](#managing-your-server)
5. [Installing Mods](#installing-mods)
6. [Configuration](#configuration)
7. [Backups](#backups)
8. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11 (64-bit)
- **RAM**: 8 GB (16 GB recommended for hosting servers)
- **Storage**: 100 GB free space (ARK servers require significant disk space)
- **Internet**: Broadband connection for downloading server files
- **Ports**: Ability to forward ports 7777, 7778, 27015 (for multiplayer)

### Required Software
- **Microsoft Visual C++ Redistributable** (automatically installed with the app)
- **SteamCMD** (the app will guide you through installation)

---

## 📥 Installation

### Option 1: Download Pre-Built Installer (Recommended)

1. **Download the Installer**
   - Download `ARK-Server-Manager-Setup.exe` from the [Releases page](https://github.com/yourusername/ark-server-manager/releases)
   - Choose the latest stable version

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - If Windows SmartScreen appears, click "More info" → "Run anyway"
   - Follow the installation wizard prompts
   - Choose installation directory (default: `C:\Program Files\ARK Server Manager`)

3. **Launch the Application**
   - The installer will create a desktop shortcut
   - Double-click "ARK Server Manager 2.0" to launch

### Option 2: Build from Source (Advanced Users)

If you're a developer or want to customize the application:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ark-server-manager.git
cd ark-server-manager

# 2. Install dependencies
npm install

# 3. Build the production version
npm run tauri build

# 4. The installer will be in src-tauri/target/release/bundle/nsis/
```

---

## 🎯 First Time Setup

### Step 1: Install SteamCMD

When you first launch the app, you'll be prompted to install **SteamCMD** (required for downloading ARK servers):

1. Click **"Install SteamCMD"** in the dashboard
2. Choose an installation directory (default: `C:\SteamCMD`)
3. Wait for the download and installation to complete
4. The app will verify the installation automatically

> **Note**: SteamCMD is Valve's command-line tool for downloading dedicated servers. It's required for ARK server installation.

### Step 2: Create Your First Server

1. Navigate to **"Server Manager"** from the sidebar
2. Click **"Install New Server"** button
3. Fill in the server details:
   - **Server Name**: Give your server a descriptive name (e.g., "My PvP Server")
   - **Server Type**: Choose between:
     - **ASE** (ARK: Survival Evolved) - Legacy game
     - **ASA** (ARK: Survival Ascended) - New remaster
   - **Installation Path**: Where server files will be stored (requires ~70-100 GB)
   - **Port**: Default is 7777 (change if running multiple servers)
   - **Max Players**: Maximum concurrent players (default: 70)

4. Click **"Install Server"**
5. Wait for SteamCMD to download all server files (this can take 30-60 minutes depending on your connection)

### Step 3: Configure Server Settings

1. Once installation completes, select your server from the list
2. Click **"Settings"** button
3. Configure basic settings:
   - **Map**: TheIsland, Ragnarok, Extinction, etc.
   - **PVP/PVE**: Choose game mode
   - **Password**: Optional server password
   - **Admin Password**: Required for admin commands

4. Click **"Save Configuration"**

### Step 4: Start Your Server

1. Select your server from the Server Manager
2. Click **"Start Server"** button
3. Wait for the status indicator to turn **Green** (Running)
4. Your server is now live!

---

## 🎮 Managing Your Server

### Starting/Stopping Servers

- **Start**: Click the ▶️ button next to your server
- **Stop**: Click the ⏹️ button (allows graceful shutdown)
- **Restart**: Click the 🔄 button (saves progress before restarting)

### Server Status Indicators
- 🟢 **Green (Running)**: Server is online and accepting connections
- 🟡 **Yellow (Starting)**: Server is initializing
- 🔴 **Red (Stopped)**: Server is offline
- 🔵 **Blue (Updating)**: Server is downloading updates

### Viewing Server Logs

1. Select your server from the list
2. Click **"View Logs"** button
3. Monitor real-time server output
4. Logs are automatically saved to `[server_path]/ShooterGame/Saved/Logs/`

### RCON Console (Remote Commands)

1. Navigate to **"RCON Console"** from the sidebar
2. Connect to your running server
3. Execute admin commands:
   ```
   SaveWorld
   SetTimeOfDay 12:00
   DestroyWildDinos
   Cheat GiveItemNum 1 1 1 false
   ```

---

## 🎨 Installing Mods

### For ASE (Steam Workshop Mods)

1. Navigate to **"Mod Manager"** from the sidebar
2. Ensure **"Server Type"** is set to **ASE**
3. Browse popular mods or search by name:
   - Example: "Structures Plus (S+)"
   - Example: "Awesome Spyglass"
4. Click **"Install"** on desired mods
5. Drag and drop mods to reorder load priority
6. Click **"Apply Mods to Server"**
7. Restart your server for mods to take effect

### For ASA (CurseForge Mods)

1. Navigate to **"Mod Manager"** from the sidebar
2. Ensure **"Server Type"** is set to **ASA**
3. Browse or search for mods from CurseForge
4. Click **"Install"** on desired mods
5. The app will download and configure mods automatically
6. Restart your server

> **⚠️ Important**: Clients must have the same mods installed to join your server!

---

## ⚙️ Configuration

### Visual Config Editor

1. Navigate to **"Config Editor"** from the sidebar
2. Select your server
3. Choose between two files:
   - **GameUserSettings.ini**: Server settings (rates, difficulty, PvP/PvE)
   - **Game.ini**: Advanced settings (engrams, loot, breeding)

4. Use the visual editor to modify settings:
   - **XP Multiplier**: Adjust experience gain rate
   - **Taming Speed**: How fast creatures tame
   - **Harvest Amount**: Resource gathering rates
   - **Day/Night Speed**: How fast time passes

5. Click **"Save Changes"**

### Preset Configurations

For quick setup, use presets:
- **Boosted (10x)**: High rates for casual play
- **5x Rates**: Moderate boost
- **Vanilla**: Official server rates
- **Custom**: Create your own preset

### Raw Text Mode

For advanced users who want direct file access:
1. Click **"Switch to Raw Text Mode"**
2. Edit INI files directly
3. Click **"Save"** when done

> **⚠️ Warning**: Incorrect syntax in raw mode can crash your server!

---

## 💾 Backups

### Creating Manual Backups

1. Navigate to **"Backups"** from the sidebar
2. Select your server
3. Click **"Create Backup"**
4. Enter a description (e.g., "Before adding mods")
5. Wait for backup to complete

### Automated Backups

1. Navigate to **"Settings"** → **"Automation"**
2. Enable **"Automatic Backups"**
3. Set schedule:
   - Every 6 hours
   - Every 12 hours
   - Every 24 hours
   - Custom cron expression

4. Set **"Backup Retention"** (how many backups to keep)

### Restoring from Backup

1. Navigate to **"Backups"**
2. Select the backup you want to restore
3. Click **"Restore"**
4. Confirm the action
5. Your server will be stopped, restored, and restarted automatically

> **💡 Tip**: Always create a backup before updating your server or installing new mods!

---

## 🔧 Troubleshooting

### Server Won't Start

**Check #1**: Verify SteamCMD Installation
- Dashboard → System Status → SteamCMD should show "Installed"

**Check #2**: Verify Port Availability
- Make sure port 7777 (or your custom port) isn't being used by another application
- Run: `netstat -ano | findstr :7777` in Command Prompt

**Check #3**: Review Server Logs
- Server Manager → Your Server → View Logs
- Look for error messages (usually red text)

### Can't Connect to Server

**Check #1**: Firewall Rules
- Allow `ShooterGameServer.exe` through Windows Firewall
- Open ports: 7777, 7778, 27015

**Check #2**: Port Forwarding
- Forward ports on your router to your PC's local IP
- Use [portforward.com](https://portforward.com/) for router-specific guides

**Check #3**: Server Status
- Verify server status is Green (Running)
- Check if you can connect via LAN IP (192.168.x.x)

### Mods Not Loading

**Issue**: Server starts but mods aren't active

**Solution**:
1. Verify mods are listed in `GameUserSettings.ini` under `ActiveMods=`
2. Check mod installation path exists: `[server]/ShooterGame/Content/Mods/`
3. Ensure mod IDs are correct (no spaces, comma-separated)
4. Verify clients have the same mods installed

### Performance Issues

**Issue**: Server is laggy or slow

**Solutions**:
- **Reduce Dino Count**: Add to `Game.ini`:
  ```ini
  NPCReplacements=(FromClassName="",ToClassName="")
  ```
- **Increase Server Priority**: Run app as Administrator
- **Allocate More RAM**: Modify launch arguments in Server Settings
- **Disable Unused Mods**: Fewer mods = better performance

### Database/Save Corruption

**Issue**: Server crashes on startup or world data lost

**Solutions**:
1. Restore from a recent backup (Backups → Select → Restore)
2. Verify server files via SteamCMD:
   - Server Manager → Your Server → Verify Files
3. If all else fails, reinstall the server (your backups will remain safe)

### Application Crashes

**Issue**: ARK Server Manager 2.0 itself crashes

**Solutions**:
1. Check if you have the latest version installed
2. Run as Administrator (right-click → Run as administrator)
3. Check logs in `%APPDATA%/ark-server-manager/logs/`
4. Report bugs at: [GitHub Issues](https://github.com/yourusername/ark-server-manager/issues)

---

## 📞 Support & Community

### Getting Help

- **Documentation**: Check this guide and `ARCHITECTURE.md` for technical details
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/ark-server-manager/issues)
- **Community Discord**: [Join our server](https://discord.gg/your-invite) (coming soon)

### Useful Resources

- **Official ARK Wiki**: [ark.wiki.gg](https://ark.wiki.gg/)
- **INI Settings Reference**: [ARK Settings Calculator](https://web.archive.org/web/20210801000000*/https://www.ark-survival.net/en/ark-server-config/)
- **SteamCMD Documentation**: [Valve Developer Community](https://developer.valvesoftware.com/wiki/SteamCMD)

---

## 🎉 Quick Start Summary

For users who want the fastest path to a running server:

1. **Install** ARK Server Manager 2.0
2. **Install SteamCMD** (when prompted)
3. **Create a new server** (Server Manager → Install New Server)
4. **Wait for download** (30-60 minutes)
5. **Start your server** (Click ▶️ button)
6. **Share your IP** with friends (Find it in Dashboard → System Info)

That's it! Your ARK server is now live. 🎮

---

**Version**: 2.0.0  
**Last Updated**: 2025-12-06  
**License**: MIT
