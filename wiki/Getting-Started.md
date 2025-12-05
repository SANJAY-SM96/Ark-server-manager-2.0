# Getting Started

Get your first ARK server up and running in just 5 minutes!

---

## 🎯 Quick Start (5 Minutes)

### Prerequisites
✅ ARK Server Manager 2.0 installed  
✅ SteamCMD setup complete (automatic on first launch)  
✅ 70-100 GB free disk space

---

## 📋 Step-by-Step Guide

### Step 1: Open Server Manager

1. Launch **ARK Server Manager 2.0**
2. Click **"Server Manager"** in the left sidebar
3. You'll see an empty server list

### Step 2: Install Your First Server

Click the **"Install New Server"** button. A dialog will appear:

#### Server Configuration

**Basic Settings:**
- **Server Name**: `My First ARK Server`
  - This is just a label for your reference
  - Use something descriptive like "PvP Island" or "Community Server"

- **Server Type**: Choose one:
  - 🦖 **ASE** (ARK: Survival Evolved) - Legacy game, ~25 GB
  - 🦕 **ASA** (ARK: Survival Ascended) - New remaster, ~70 GB

- **Installation Path**: Click **"Browse"**
  - Recommended: `C:\ARKServers\MyFirstServer\`
  - Ensure you have enough space on the selected drive

**Network Settings:**
- **Game Port**: `7777` (default)
  - Change only if running multiple servers
  - Each server needs unique ports (7777, 7778, 7779, etc.)

- **Max Players**: `70` (default)
  - ASE: Up to 100 players
  - ASA: Up to 127 players

**Advanced (Optional):**
- **Map**: `TheIsland` (default)
  - Other options: Ragnarok, Extinction, Aberration, etc.
- **Password**: Leave empty for public server
- **Admin Password**: Set a strong password for admin commands

### Step 3: Start Installation

1. Click **"Install Server"**
2. **SteamCMD will now download** the server files:
   - ASE: ~25 GB (15-30 minutes)
   - ASA: ~70 GB (30-60 minutes)

**Installation Progress:**
- You'll see real-time download progress
- Log output from SteamCMD
- Status updates

**☕ Take a break!** This is a good time to:
- Read the [Server Management](Server-Management) guide
- Plan your server settings
- Browse available mods

### Step 4: Configure Your Server

Once installation completes:

1. **Select your server** from the Server Manager list
2. Click **"Settings"** button
3. **Basic Configuration**:
   - **Server Name**: Public name (visible to players)
   - **Message of the Day**: Welcome message
   - **PvP/PvE**: Choose game mode
   - **Difficulty**: 1.0 (official) to 10.0 (extreme)

4. **Gameplay Rates** (Recommended starter values):
   - **XP Multiplier**: `3.0` (faster leveling)
   - **Taming Speed**: `5.0` (faster tames)
   - **Harvest Amount**: `3.0` (more resources)
   - **Player Damage**: `1.0` (default)

5. Click **"Save Configuration"**

### Step 5: Start Your Server!

1. Select your server
2. Click the **▶️ Start** button
3. Wait for status to turn **Green (Running)**
4. **Your server is now live!** 🎉

---

## 🌐 Connecting to Your Server

### Local Connection (Same PC)

1. Launch ARK (ASE or ASA)
2. Go to **"Join Server"** → **"Session Filter"**
3. Set to **"LAN"**
4. Your server should appear in the list
5. Click **"Join"**

### Remote Connection (Friends/Public)

**You'll need to share:**
- **Your Public IP**: Check Dashboard → Top right corner
- **Port**: Default is `7777`

**Friends can connect by:**
1. Launch ARK
2. Open console (Press **Tab**)
3. Type: `open [YourIP]:7777`
4. Press **Enter**

**Example**: `open 192.168.1.100:7777`

---

## 🎮 Your First Admin Commands

Once you're in-game on your server:

### Enable Admin Mode
1. Press **Tab** to open console
2. Type: `enablecheats YourAdminPassword`
3. Press **Enter**

### Useful Commands
```
// Give yourself experience
cheat AddExperience 1000000 0 1

// Spawn a dino
cheat SpawnDino "Blueprint'/Game/PrimalEarth/Dinos/Rex/Rex_Character_BP.Rex_Character_BP'" 500 0 0 120

// Teleport to coordinates
cheat SetPlayerPos 0 0 0

// Save the world
cheat SaveWorld

// List online players (in RCON)
ListPlayers
```

**💡 Tip**: Use the built-in **RCON Console** (in the app) instead of typing in-game!

---

## ⚙️ Next Steps

Now that your server is running, explore these features:

### 1. Install Mods
- Navigate to **[Mod Manager](Mod-Management)**
- Search for popular mods like:
  - **Structures Plus (S+)** - Building enhancements
  - **Awesome Spyglass** - Dino stats viewer
  - **Death Recovery Mod** - Retrieve your stuff

### 2. Set Up Automated Backups
- Go to **[Backup & Restore](Backup-and-Restore)**
- Enable **Automatic Backups** every 6 hours
- Set retention policy (keep last 10 backups)

### 3. Configure Advanced Settings
- Visit **[Configuration Guide](Configuration-Guide)**
- Edit `GameUserSettings.ini` and `Game.ini`
- Use presets or create custom settings

### 4. Schedule Automatic Restarts
- Open **[Automation](Automation)**
- Create a scheduled task:
  - **Action**: Restart Server
  - **Schedule**: Every 24 hours at 4:00 AM
  - **Broadcast**: 10 minutes before restart

### 5. Monitor Performance
- Check the **Dashboard** for:
  - CPU and RAM usage
  - Online player count
  - Server uptime

---

## 🎯 Common First-Time Tasks

### Make Yourself Admin

**In-Game Method:**
1. Join your server
2. Press **Tab** (console)
3. Type: `enablecheats YourAdminPassword`

**Via RCON Console (Easier):**
1. Open **RCON Console** in the app
2. Connect to your server
3. Type commands without needing to be in-game

### Add Friends as Admins

1. Get their **Steam ID** (64-bit)
2. Navigate to your server files:
   ```
   [ServerPath]\ShooterGame\Saved\AllowedCheaterSteamIDs.txt
   ```
3. Add their Steam ID (one per line)
4. Save and restart server

### Change Server Settings

**Quick Method (Basic Settings):**
- Use the **Settings** button in Server Manager
- Adjust sliders and dropdowns
- Click **Save**

**Advanced Method (Full Control):**
- Open **Config Editor** from sidebar
- Edit `GameUserSettings.ini` directly
- Use presets or manual edits

### Install Popular Mods

**For ASE:**
1. Go to **Mod Manager**
2. Search: "Structures Plus"
3. Click **"Install"**
4. Drag to set load order
5. Click **"Apply to Server"**
6. Restart server

**For ASA:**
- Same process, but mods come from CurseForge

---

## 🆘 Common Issues

### Server Won't Start

**Check:**
1. Is SteamCMD installed? (Dashboard → Dependencies)
2. Is port 7777 available? (Close other ARK instances)
3. Check logs: Server Manager → View Logs

### Can't Connect

**Solutions:**
1. **Firewall**: Ensure ports 7777, 7778, 27015 are open
2. **Router**: Forward ports to your PC's local IP
3. **Test Locally**: Try connecting via LAN first
4. **Check Status**: Server must be "Running" (green)

### Server Crashes

**Common Causes:**
1. **Mods**: Disable mods one by one to find the culprit
2. **Memory**: Ensure 16+ GB RAM for ASA, 8+ GB for ASE
3. **Corruption**: Restore from a backup

---

## 📚 Learn More

- **[Server Management](Server-Management)** - Advanced server operations
- **[Mod Management](Mod-Management)** - Add cool mods
- **[Configuration Guide](Configuration-Guide)** - Optimize settings
- **[Backup & Restore](Backup-and-Restore)** - Protect your world

---

**🎉 Congratulations!** You now have a fully functional ARK server!

**Need Help?** → [Troubleshooting](Troubleshooting) | [FAQ](FAQ)
