# Troubleshooting

Common issues and solutions for ARK Server Manager 2.0.

---

## 🔍 Quick Diagnosis

Before diving into specific issues, try these quick checks:

✅ **Is the app up to date?** Check [Releases](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/releases/latest)  
✅ **Are dependencies installed?** Dashboard → "System Dependencies" card  
✅ **Is your server running?** Server Manager → Check status (Green = Running)  
✅ **Have you restarted?** Many issues resolve with a simple restart

---

## 🚨 Installation Issues

### ⚠️ Windows Defender SmartScreen Warning

**This is the MOST COMMON installation issue!**

![Windows SmartScreen Warning](../uploaded_image_1764970042154.png)

**Symptoms:**
- Red popup saying "Windows protected your PC"
- "Microsoft Defender SmartScreen prevented an unrecognized app from starting"
- App: `ARKServerManager2.0_2.0.0_x64-setup.exe`
- Publisher: `Unknown publisher`

**Why This Happens:**
The application is not digitally signed with a code signing certificate, so Windows flags it as potentially unsafe. This is normal for open-source applications.

**Solution:**

1. **Click "More info"** on the Windows Defender popup
2. Click **"Run anyway"** button that appears
3. The installation will proceed normally

> [!NOTE]
> This warning appears because the app isn't signed with an expensive code signing certificate ($300+/year). The app is completely safe - it's open source and you can review the code on GitHub.

---

### App Won't Install

**Symptoms:**
- Installer crashes
- "Access Denied" error
- Installation hangs

**Solutions:**

1. **Run as Administrator**
   ```
   Right-click installer → "Run as administrator"
   ```

2. **Disable Antivirus Temporarily**
   - Some antivirus software blocks unsigned executables
   - Disable during installation, re-enable after

3. **Check Disk Space**
   - Ensure 500 MB free on C: drive
   - Run: `cleanmgr` to free up space

### SteamCMD Installation Fails

> [!IMPORTANT]
> SteamCMD is **automatically installed** on first launch during the onboarding process. You don't need to install it manually!

**Symptoms:**
- "Failed to install SteamCMD" error during onboarding
- Onboarding dialog stuck at "Downloading..."
- Dashboard shows "SteamCMD: Not Installed"

**Solutions:**

1. **Let It Auto-Install**
   - After bypassing the SmartScreen warning and installing the app
   - Launch the app for the first time
   - The onboarding wizard will automatically download and install SteamCMD
   - This may take 2-5 minutes depending on your connection

2. **Check Internet Connection**
   - Test: `ping steamcdn-a.akamaihd.net`
   - Ensure firewall allows outbound connections
   - Disable VPN temporarily if having issues

3. **Retry Installation**
   - Click "Retry" button in error dialog
   - Or close app and relaunch
   - The onboarding wizard will try again

4. **Manual Installation** (Only if auto-install repeatedly fails)
   ```powershell
   # Download SteamCMD
   Invoke-WebRequest -Uri "https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip" -OutFile "$env:TEMP\steamcmd.zip"
   
   # Extract to app directory
   Expand-Archive -Path "$env:TEMP\steamcmd.zip" -DestinationPath "$env:APPDATA\ark-server-manager\steamcmd\" -Force
   ```

5. **Check Permissions**
   - Ensure app can write to `%APPDATA%\ark-server-manager\`
   - Run app as administrator if needed

### VC++ Redistributables Missing

**Symptoms:**
- "MSVCP140.dll missing" error
- App crashes on launch

**Solutions:**

1. **Install Manually**
   - Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Run installer
   - Restart computer

2. **Verify Installation**
   - Dashboard →  "System Dependencies" → Check VC++ status

---

## 🎮 Server Issues

### Server Won't Start

**Symptoms:**
- Status stays "Starting" indefinitely
- Status immediately changes to "Crashed"

**Solutions:**

1. **Check Port Availability**
   ```powershell
   # Check if port 7777 is in use
   netstat -ano | findstr :7777
   ```
   - If output shown, port is in use
   - Close the other application or use a different port

2. **Verify Server Files**
   - Server Manager → Right-click server → "Verify Files"
   - SteamCMD will re-download any corrupted files

3. **Check Logs**
   - Server Manager → "View Logs"
   - Look for error messages (usually in red)

4. **Increase Timeout**
   - Settings → Server Start Timeout → Increase to 120 seconds
   - ASA servers take longer to start

5. **Check Disk Space**
   - Ensure server drive has 10+ GB free space

### Server Crashes Frequently

**Symptoms:**
- Server runs for a while then crashes
- Status changes to "Crashed" randomly

**Solutions:**

1. **Memory Issues**
   - **ASE**: Ensure 8 GB system RAM minimum
   - **ASA**: Ensure 16 GB system RAM minimum
   - Close other applications

2. **Mod Conflicts**
   - Disable all mods
   - Start server → If stable, re-enable mods one by one
   - Identify problematic mod

3. **Corrupted Save**
   - Restore from backup (Backups → Select → Restore)
   - If persistent, start fresh world

4. **Update Server**
   - Server Manager → "Update Server"
   - Outdated servers can crash

### Server Lags/Performance Issues

**Symptoms:**
- High ping
- Rubber-banding
- Slow response

**Solutions:**

1. **Check CPU/RAM Usage**
   - Dashboard → Monitor performance graphs
   - If CPU >80% or RAM >90%, upgrade hardware

2. **Reduce Server Load**
   - Lower **Wild Dino Count**: `Game.ini` → `NPCReplacements`
   - Reduce **Max Players**: Server Settings
   - Limit active mods

3. **Optimize Settings**
   - Config Editor → Use "Performance Optimized" preset
   - Disable unnecessary features

4. **Clean Up World**
   - RCON → `DestroyWildDinos` (respawns all dinos)
   - Remove abandoned structures

---

## 🌐 Connection Issues

### Can't Connect to Server (Local)

**Symptoms:**
- Server not visible in LAN list
- "Connection timeout" error

**Solutions:**

1. **Verify Server is Running**
   - Status must be "Running" (green)

2. **Check Firewall**
   ```powershell
   # Allow ARK through firewall
   New-NetFirewallRule -DisplayName "ARK Server" -Direction Inbound -Program "C:\ARKServers\YourServer\ShooterGame\Binaries\Win64\ShooterGameServer.exe" -Action Allow
   ```

3. **Use Direct Connect**
   - In ARK, open console (Tab)
   - Type: `open 127.0.0.1:7777`

4. **Restart Router**
   - Sometimes fixes local network issues

### Can't Connect to Server (Remote)

**Symptoms:**
- Friends can't join
- Server not listed in public server list

**Solutions:**

1. **Port Forwarding**
   - Router admin panel (usually `192.168.1.1`)
   - Forward TCP/UDP ports:
     - `7777` → Your PC's local IP :7777
     - `7778` → Your PC's local IP :7778
     - `27015` → Your PC's local IP :27015

2. **Find Local IP**
   ```powershell
   ipconfig
   # Look for "IPv4 Address" (usually 192.168.x.x)
   ```

3. **Find Public IP**
   - Dashboard → Top right corner
   - Or visit: https://ipify.org

4. **Give Friends Correct Address**
   - Format: `PublicIP:Port`
   - Example: `123.456.789.0:7777`

5. **Check ISP Restrictions**
   - Some ISPs block port 7777
   - Try alternative ports (7779, 27016, etc.)

---

## 🎨 Mod Issues

### Mods Not Loading

**Symptoms:**
- Mods installed but not active in-game
- "Mod mismatch" error

**Solutions:**

1. **Verify Mod Installation**
   - Mod Manager → Check "Installed Mods" list
   - Ensure mods are in "Active Mods" section

2. **Check GameUserSettings.ini**
   ```ini
   [ServerSettings]
   ActiveMods=731604991,895711211,764755314
   ```
   - Mod IDs should be comma-separated (no spaces)

3. **Restart Server**
   - Mods only load on server start
   - Server Manager → Restart

4. **Update Mods**
   - Mod Manager → "Update All Mods"
   - Outdated mods can cause issues

### Mod Download Fails

**Symptoms:**
- "Failed to download mod" error
- Mod installation stuck

**Solutions:**

1. **Check Internet Connection**
2. **Verify Mod ID**
   - Ensure correct Steam Workshop ID (for ASE)
   - Ensure correct CurseForge ID (for ASA)

3. **Check Disk Space**
   - Mods can be several GB

4. **Manual Installation**
   - ASE: Download from Steam Workshop manually
   - Copy to: `[ServerPath]\ShooterGame\Content\Mods\`

---

## ⚙️ Configuration Issues

### Config Changes Not Saving

**Symptoms:**
- Edit settings but they revert
- Server ignores INI files

**Solutions:**

1. **Check File Permissions**
   - Ensure INI files are not read-only
   - Right-click file → Properties → Uncheck "Read-only"

2. **Stop Server First**
   - Config Editor → Stop server → Edit → Save → Start server

3. **Verify File Path**
   - Config Editor → Check file path at top

4. **Clear Cache**
   - Delete: `[ServerPath]\ShooterGame\Saved\Config\WindowsServer\*.bak`

### Presets Not Working

**Symptoms:**
- Apply preset but nothing changes

**Solutions:**

1. **Restart After Applying Preset**
   - Presets modify INI files
   - Restart required to take effect

2. **Manual Verification**
   - Config Editor → Switch to"Raw Text Mode"
   - Verify changes were written

---

## 💾 Backup Issues

### Backup Fails

**Symptoms:**
- "Backup creation failed" error

**Solutions:**

1. **Check Disk Space**
   - Backups can be 5-20 GB
   - Ensure enough free space on backup drive

2. **Stop Server**
   - Backups work better with server stopped

3. **Check Permissions**
   - Ensure app can write to backup directory

### Restore Fails

**Symptoms:**
- "Restore failed" error
- Server crashes after restore

**Solutions:**

1. **Stop Server First**
   - Server must be stopped before restore

2. **Verify Backup Integrity**
   - Backups → Check file size (should be several GB)
   - Corrupted backups can't be restored

3. **Check Disk Space**
   - Restore requires space equal to backup size

---

## 🔧 Database Issues

### "Database locked" Error

**Solutions:**

1. **Close All Instances**
   - Only one instance can access the database
   - Close all ARK Server Manager windows

2. **Delete Lock File**
   ```powershell
   Remove-Item "$env:APPDATA\ark-server-manager\ark_manager_v2.db-wal"
   Remove-Item "$env:APPDATA\ark-server-manager\ark_manager_v2.db-shm"
   ```

3. **Restore from Backup** (if corrupted)

### Database Corrupted

**Symptoms:**
- App crashes on launch
- "Unable to open database" error

**Solutions:**

1. **Restore from Backup**
   - Copy backup (if available) to:
     `%APPDATA%\ark-server-manager\ark_manager_v2.db`

2. **Reset Database** (LAST RESORT - Loses all data)
   ```powershell
   # Backup current database
   Copy-Item "$env:APPDATA\ark-server-manager\ark_manager_v2.db" "$env:USERPROFILE\Desktop\ark_manager_backup.db"
   
   # Delete corrupted database
   Remove-Item "$env:APPDATA\ark-server-manager\ark_manager_v2.db"
   
   # Relaunch app (creates new database)
   ```

---

## 📞 Getting More Help

If your issue isn't listed here:

1. **Check Logs**
   - App logs: `%APPDATA%\ark-server-manager\logs\`
   - Server logs: `[ServerPath]\ShooterGame\Saved\Logs\`

2. **Search GitHub Issues**
   - [Existing Issues](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/issues?q=is%3Aissue)
   - Someone may have solved your problem

3. **Create New Issue**
   - [Report Bug](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/issues/new)
   - Include:
     - Operating System
     - App version
     - Steps to reproduce
     - Error messages/logs

4. **Join Discussions**
   - [Community Forum](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/discussions)

---

**Still Stuck?** → [FAQ](FAQ) | [Getting Started](Getting-Started)
