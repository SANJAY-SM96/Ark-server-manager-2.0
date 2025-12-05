# Installation Guide

Complete guide to installing ARK Server Manager 2.0 on your Windows PC.

---

## 📋 Prerequisites

### System Requirements

**Minimum**:
- Windows 10/11 (64-bit)
- 8 GB RAM
- 100 GB free disk space
- Broadband internet

**Recommended**:
- Windows 11 (64-bit)
- 16+ GB RAM
- 200+ GB SSD
- Dedicated/Static IP

### Required Permissions
- **Administrator Access**: Required for initial installation
- **Firewall Access**: App will configure Windows Firewall automatically
- **Disk Space**: Ensure adequate space for:
  - App: ~500 MB
  - SteamCMD: ~300 MB
  - ARK Server (ASE): ~25 GB per server
  - ARK Server (ASA): ~70 GB per server

---

## 🚀 Installation Steps

### Step 1: Download the Installer

1. Visit the [Releases Page](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/releases/latest)
2. Download **`ARK-Server-Manager-2.0_x.x.x_x64-setup.exe`**
3. Save to your Downloads folder

### Step 2: Run the Installer

1. **Locate the downloaded file** in your Downloads folder
2. **Right-click** → **"Run as administrator"**
3. If Windows SmartScreen appears:
   - Click **"More info"**
   - Click **"Run anyway"**

### Step 3: Complete Installation Wizard

1. **Welcome Screen**: Click **"Next"**
2. **License Agreement**: Accept the MIT License
3. **Installation Location**: 
   - Default: `C:\Program Files\ARK Server Manager 2.0\`
   - Click **"Browse"** to change (optional)
4. **Select Components**:
   - ✅ Application Files (required)
   - ✅ Desktop Shortcut (recommended)
   - ✅ Start Menu Shortcut (recommended)
5. **Install**: Click **"Install"**

### Step 4: Automatic Dependency Installation

The installer will now automatically:
- ✅ Install Visual C++ Redistributables (if needed)
- ✅ Configure Windows Firewall rules
- ✅ Create application shortcuts

This process takes 1-3 minutes.

### Step 5: Launch the Application

1. Click **"Finish"** in the installer
2. Double-click the **desktop shortcut** or use Start Menu
3. **First Launch Setup** will begin automatically

---

## 🎯 First Launch Setup

When you launch ARK Server Manager 2.0 for the first time, you'll see a beautiful onboarding dialog:

### Automated SteamCMD Installation

1. **Status**: "Downloading SteamCMD..."
   - Progress: 25%
   - Wait time: ~30 seconds

2. **Status**: "Extracting files..."
   - Progress: 75%
   - Wait time: ~15 seconds

3. **Status**: "Setup complete!"
   - Progress: 100%
   - Click **"Get Started"**

**Total Time**: ~1 minute

---

## ✅ Verification

After installation, verify everything is working:

### Check 1: Dashboard Loads
- You should see the main dashboard
- System stats should display (CPU, RAM)
- "System Dependencies" card should show:
  - ✅ SteamCMD: **Installed**
  - ✅ Visual C++ Redistributables: **Installed**

### Check 2: Create Test Server (Optional)
1. Navigate to **"Server Manager"** (sidebar)
2. Click **"Install New Server"**
3. If the dialog opens, installation was successful!

---

## 🗂️ Installation Directories

### Application Files
```
C:\Program Files\ARK Server Manager 2.0\
├── ark-server-manager.exe
├── resources\
└── _up_\
```

### User Data
```
C:\Users\[YourName]\AppData\Roaming\ark-server-manager\
├── ark_manager_v2.db          (SQLite database)
├── steamcmd\                   (SteamCMD installation)
│   ├── steamcmd.exe
│   └── ...
└── logs\                       (Application logs)
```

### Server Installations
By default, servers are installed to:
```
C:\ARKServers\                  (User-chosen during server install)
├── ASE-Server-1\
├── ASE-Server-2\
├── ASA-Server-1\
└── ...
```

---

## 🔧 Advanced Installation Options

### Silent Installation

For automated deployments:

```powershell
ARK-Server-Manager-2.0_x.x.x_x64-setup.exe /S /D=C:\Custom\Path
```

Parameters:
- `/S` - Silent mode (no UI)
- `/D=path` - Custom installation directory

### Portable Installation

Currently not supported. Use standard installation.

---

## 🔄 Updating the Application

When a new version is released:

### Automatic Update (Planned)
Future versions will include auto-update functionality.

### Manual Update
1. Download the latest installer
2. Run the installer
3. It will automatically upgrade the existing installation
4. Your servers and settings are preserved

**Note**: Always backup your database before major updates:
```
C:\Users\[YourName]\AppData\Roaming\ark-server-manager\ark_manager_v2.db
```

---

## 🗑️ Uninstallation

### Via Control Panel
1. Open **Settings** → **Apps** → **Installed Apps**
2. Find **"ARK Server Manager 2.0"**
3. Click **"Uninstall"**
4. Follow the wizard

### What Gets Removed
- ✅ Application files from `Program Files`
- ✅ Desktop and Start Menu shortcuts
- ✅ Windows Firewall rules

### What Remains (Manual Cleanup Required)
- ❌ User data: `%APPDATA%\ark-server-manager\`
- ❌ Server files: Your server installation directories
- ❌ Backups: Wherever you stored them

To completely remove everything, manually delete these directories.

---

## 🆘 Installation Troubleshooting

### Issue: "App won't install"

**Error**: "Installation failed" or "Access denied"

**Solution**:
1. Right-click installer → **"Run as administrator"**
2. Disable antivirus temporarily
3. Ensure 500 MB free space on C: drive

### Issue: "SteamCMD download fails"

**Error**: "Failed to install SteamCMD"

**Solution**:
1. Check internet connection
2. Disable firewall/antivirus temporarily
3. Click **"Retry Installation"** in the error dialog
4. If persistent, manually download SteamCMD:
   - Download: https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip
   - Extract to: `%APPDATA%\ark-server-manager\steamcmd\`

### Issue: "Application won't start"

**Error**: "Missing DLL" or immediate crash

**Solution**:
1. Reinstall Visual C++ Redistributables:
   - Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Install manually
2. Restart your computer
3. Try launching again

### Issue: "Firewall blocking app"

**Error**: Windows Defender SmartScreen warning

**Solution**:
1. Click **"More info"**
2. Click **"Run anyway"**
3. This is normal for new applications without a code-signing certificate

---

## 🎯 Next Steps

✅ **Installation Complete!**

Now that you're installed, proceed to:
- **[Getting Started](Getting-Started)** - Create your first server
- **[Server Management](Server-Management)** - Learn server operations
- **[Dashboard](Home#-quick-links)** - Explore the interface

---

**Need Help?** → [Troubleshooting](Troubleshooting) | [FAQ](FAQ)
