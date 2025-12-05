# Frequently Asked Questions (FAQ)

Quick answers to common questions about ARK Server Manager 2.0.

---

## 📥 Installation & Setup

### Q: Do I need to manually install SteamCMD?
**A:** No! SteamCMD installs automatically on first launch. Just sit back and watch the progress bar.

### Q: Do I need Visual C++ Redistributables?
**A:** No manual installation needed. The installer handles this automatically.

### Q: How much disk space do I need?
**A:**
- **App**: ~500 MB
- **SteamCMD**: ~300 MB
- **ASE Server**: ~25 GB per server
- **ASA Server**: ~70 GB per server
- **Recommended Total**: 100 GB minimum

### Q: Can I install on a different drive?
**A:** Yes! When creating a server, you choose the installation path. Install servers anywhere you have space.

### Q: Does this work on Linux/Mac?
**A:** No, currently Windows 10/11 only. Linux/Mac support is being considered for future versions.

---

## 🎮 Server Management

### Q: How many servers can I run?
**A:** Unlimited! However, each server requires:
- Dedicated ports (7777, 7778, etc.)
- RAM (8 GB per ASE server, 16 GB per ASA server)
- Adequate CPU/bandwidth

### Q: Can I run ASE and ASA servers simultaneously?
**A:** Yes! They're completely independent. Just ensure you have enough RAM and use different ports.

### Q: How do I update my server?
**A:** Server Manager → Select server → Click "Update Server". SteamCMD will download the latest version automatically.

### Q: What does "Verify Server Files" do?
**A:** It checks for corrupted/missing files and re-downloads them. Useful if your server is crashing.

### Q: Can I run multiple maps on one server?
**A:** No, each server runs one map at a time. To switch maps, change the map setting and restart the server.

---

## 🌐 Networking & Connections

### Q: Do I need a dedicated IP?
**A:** No, but it helps. Your IP is shown on the Dashboard. If it changes (dynamic IP), you'll need to share the new IP with players.

### Q: How do I make my server public?
**A:**
1. Forward ports on your router (7777, 7778, 27015)
2. Don't set a password
3. Players can find you in the server list or connect directly

### Q: Why can't my friends connect?
**A:** Most common causes:
1. **Ports not forwarded** on your router
2. **Firewall blocking** connections
3. **Wrong IP/Port** shared
4. **Server not running** (check status)

### Q: What's the difference between LAN and WAN?
**A:**
- **LAN (Local)**: Connections from same network (192.168.x.x)
- **WAN (Internet)**: Connections from outside your network (public IP)

### Q: Can I use a domain name instead of IP?
**A:** Yes! Use a free DDNS service like No-IP or DuckDNS. Configure it to point to your public IP.

---

## 🎨 Mods

### Q: Where do mods come from?
**A:**
- **ASE**: Steam Workshop
- **ASA**: CurseForge

### Q: How do I install mods?
**A:** Mod Manager → Search for mod → Click "Install" → Apply to server → Restart server

### Q: Do players need the same mods?
**A:** Yes! Clients must have the same mods installed to join your server.

### Q: Why aren't my mods working?
**A:** Common issues:
1. Server not restarted after installing mods
2. Mod load order incorrect
3. Mod conflicts
4. Outdated mods

### Q: Can I remove mods?
**A:** Yes. Mod Manager → Select mod → "Uninstall" → Restart server

**⚠️ Warning**: Removing mods can break saves if players have modded items/dinos!

### Q: How many mods can I run?
**A:** Technically unlimited, but:
- More mods = longer load times
- Some mods conflict with each other
- Recommended: 10-20 mods max for stability

---

## ⚙️ Configuration

### Q: What's the difference between GameUserSettings.ini and Game.ini?
**A:**
- **GameUserSettings.ini**: Server settings (rates, PvP/PvE, passwords)
- **Game.ini**: Advanced settings (engrams, spawns, harvesting)

### Q: Can I edit INI files manually?
**A:** Yes! Config Editor → "Raw Text Mode". But be careful - syntax errors can crash your server.

### Q: What are presets?
**A:** Pre-configured settings bundles:
- **Vanilla**: Official server rates
- **5x Rates**: Moderate boost
- **10x Boosted**: High rates for casual play
- **Custom**: Create your own

### Q: How do I increase XP/taming/gathering rates?
**A:** Config Editor → GameUserSettings.ini → Scroll to "Rates" section → Adjust sliders

### Q: Can I customize dino spawns?
**A:** Yes, but it requires editing Game.ini manually. See [Configuration Guide](Configuration-Guide) for details.

---

## 💾 Backups

### Q: Are backups automatic?
**A:** Only if you enable them. Backups → Toggle "Automatic Backups" → Set schedule

### Q: Where are backups stored?
**A:** Default: `%APPDATA%\ark-server-manager\backups\`  
You can change this in Settings.

### Q: How much space do backups need?
**A:** Each backup is roughly the size of your server's save files:
- ASE: ~500 MB - 2 GB
- ASA: ~2 GB - 10 GB

### Q: How do I restore a backup?
**A:** Backups → Select backup → "Restore" → Confirm. Server will be stopped, restored, and restarted automatically.

### Q: Can I backup to external drive?
**A:** Yes! Settings → Backup Location → Browse → Select external drive

---

## 🔄 Automation

### Q: Can I schedule automatic restarts?
**A:** Yes! Automation → Create Schedule → Action: "Restart Server" → Set time

### Q: Will players be warned before restart?
**A:** Yes, if you enable "Broadcast Warning". Players get in-game messages before the restart.

### Q: Can I auto-update servers?
**A:** Yes! Automation → Create Schedule → Action: "Update Server"

### Q: What's a cron expression?
**A:** A time format for scheduling. Examples:
- `0 4 * * *` = Every day at 4:00 AM
- `0 */6 * * *` = Every 6 hours
- `30 3 * * 0` = Every Sunday at 3:30 AM

Don't worry, the app has a visual scheduler too!

---

## 🛡️ Administration

### Q: How do I become admin on my server?
**A:** In-game console: `enablecheats YourAdminPassword`  
Or use the built-in RCON Console (easier!)

### Q: What's RCON?
**A:** Remote Console - lets you run admin commands without being in-game. Very useful for server management!

### Q: How do I add other admins?
**A:** Get their Steam ID → Add to `AllowedCheaterSteamIDs.txt` in server files

### Q: Can I kick/ban players?
**A:** Yes! RCON Console → `KickPlayer SteamID` or `BanPlayer SteamID`

### Q: How do I view online players?
**A:** RCON Console → `ListPlayers`  
Or Dashboard shows player count

---

## 🔒 Privacy & Security

### Q: Is my data safe?
**A:** Yes! Everything is stored locally on your PC. No cloud sync, no telemetry, no data collection.

### Q: Do you track my usage?
**A:** No. Zero analytics or tracking. The app only connects to download ARK servers and mods.

### Q: Can other Windows users see my servers?
**A:** No. Each Windows user account gets a completely separate installation and database.

### Q: Is my server password encrypted?
**A:** Server passwords are stored in plain text in INI files (this is ARK's design, not ours). Keep your PC secure!

---

## 💰 Costs & Licensing

### Q: Is this free?
**A:** Yes! Completely free and open-source (MIT License).

### Q: Do I need to pay for hosting?
**A:** No, if you host on your own PC. If you want to rent a dedicated server, that's separate (not required).

###Q: Can I use this commercially?
**A:** Yes, the MIT License allows commercial use. You can even modify and redistribute it.

### Q: Can I donate to support development?
**A:** GitHub Sponsors link coming soon! For now, just star the repo ⭐

---

## 🚀 Performance

### Q: How much RAM do I need?
**A:**
- **ASE Server**: 8 GB system RAM minimum
- **ASA Server**: 16 GB system RAM minimum
- **Multiple Servers**: +8-16 GB per additional server

### Q: Can I run a server on my gaming PC?
**A:** Yes, but expect performance impact while playing. Recommended to have 16 GB+ RAM.

### Q: My server is laggy, how do I optimize it?
**A:**
1. Lower max players
2. Reduce wild dino count
3. Limit mods
4. Use "Performance Optimized" preset
5. Upgrade hardware (RAM/CPU)

---

## 🔄 Updates

### Q: How do I update the app?
**A:** Download the latest installer and run it. It will upgrade in place, preserving your settings.

### Q: Will updating delete my servers?
**A:** No! App updates are separate from server data. Your servers, configs, and settings are safe.

### Q: How often should I update my servers?
**A:** Check for updates weekly. ARK updates frequently, and outdated servers can have issues.

---

## 🆘 Troubleshooting

### Q: My server won't start, what do I do?
**A:** See [Troubleshooting](Troubleshooting#server-wont-start) for detailed solutions.

### Q: Where are the logs?
**A:**
- **App logs**: `%APPDATA%\ark-server-manager\logs\`
- **Server logs**: `[ServerPath]\ShooterGame\Saved\Logs\`

### Q: Can I reset the app to default?
**A:** Yes, but it will delete all your servers/settings:
1. Close app
2. Delete: `%APPDATA%\ark-server-manager\`
3. Relaunch app (creates new database)

---

## 📚 Additional Resources

### Q: Where can I learn more?
**A:**
- **[User Guide](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/USER_GUIDE.md)**
- **[Architecture Docs](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/blob/main/ARCHITECTURE.md)**
- **[All Wiki Pages](Home)**

### Q: How do I report bugs?
**A:** [Create an issue](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/issues/new) with:
- Operating System
- App version
- Steps to reproduce
- Error messages/logs

### Q: Can I contribute code?
**A:** Yes! The project is open-source. [Fork it](https://github.com/SANJAY-SM96/Ark-server-manager-2.0) and submit a pull request.

---

**Have a question not listed here?**  
→ [Ask in Discussions](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/discussions)  
→ [Create an Issue](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/issues)

**Need immediate help?** → [Troubleshooting](Troubleshooting) | [Getting Started](Getting-Started)
