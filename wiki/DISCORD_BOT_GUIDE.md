# Discord Bot Setup Guide

This guide will walk you through setting up and using the Discord bot to control your ARK servers directly from Discord.

---

## Table of Contents

1. [Creating a Discord Bot](#1-creating-a-discord-bot)
2. [Inviting the Bot to Your Server](#2-inviting-the-bot-to-your-server)
3. [Configuring the Bot in ARK Server Manager](#3-configuring-the-bot-in-ark-server-manager)
4. [Available Commands](#4-available-commands)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Creating a Discord Bot

### Step 1: Open Discord Developer Portal

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Log in with your Discord account

### Step 2: Create a New Application

1. Click the **"New Application"** button (top right)
2. Enter a name for your bot (e.g., "ARK Server Manager")
3. Accept the Terms of Service
4. Click **"Create"**

![Create Application](https://i.imgur.com/placeholder.png)

### Step 3: Create the Bot

1. In the left sidebar, click **"Bot"**
2. Click **"Add Bot"** button
3. Confirm by clicking **"Yes, do it!"**

### Step 4: Get Your Bot Token

1. Under the **"TOKEN"** section, click **"Copy"** or **"Reset Token"**
2. **IMPORTANT**: Save this token somewhere safe! You'll need it later.
3. ⚠️ **Never share your token publicly** - anyone with it can control your bot!

### Step 5: Configure Bot Settings

Under **"Privileged Gateway Intents"**, enable:
- ✅ **Message Content Intent** (if you want the bot to read messages)

Click **"Save Changes"** at the bottom.

---

## 2. Inviting the Bot to Your Server

### Step 1: Generate Invite Link

1. In the left sidebar, click **"OAuth2"** → **"URL Generator"**
2. Under **SCOPES**, select:
   - ✅ `bot`
   - ✅ `applications.commands`

3. Under **BOT PERMISSIONS**, select:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Use Slash Commands

### Step 2: Copy and Use the Link

1. Scroll down to find the **"GENERATED URL"**
2. Click **"Copy"**
3. Open the URL in your browser
4. Select your Discord server from the dropdown
5. Click **"Authorize"**
6. Complete the CAPTCHA if prompted

Your bot should now appear in your Discord server (offline until you start it).

---

## 3. Configuring the Bot in ARK Server Manager

### Step 1: Open Settings

1. Launch **ARK Server Manager**
2. Click **"Settings"** in the sidebar

### Step 2: Find Discord Bot Section

Scroll down to find the **"Discord Bot"** panel with the bot icon.

### Step 3: Enter Bot Token

1. Paste your bot token in the **"Bot Token"** field
2. (Optional) Enter your **Guild ID** for faster command registration:
   - Right-click your Discord server name
   - Click "Copy Server ID" (requires Developer Mode in Discord settings)

### Step 4: Start the Bot

1. Click the green **"Start Bot"** button
2. Wait for the bot to connect
3. The status should change to **"Online"** with a green indicator

### Step 5: Verify in Discord

1. Go to your Discord server
2. Check the member list - your bot should show as "Online"
3. Type `/` in any channel to see available commands

---

## 4. Available Commands

Once the bot is running, you can use these slash commands in Discord:

### 🎮 Server Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/servers list` | Show all configured servers with their status | `/servers list` |
| `/servers start <id>` | Start a specific server | `/servers start 1` |
| `/servers stop <id>` | Stop a running server | `/servers stop 1` |
| `/servers restart <id>` | Restart a server | `/servers restart 1` |
| `/servers status <id>` | Get detailed server information | `/servers status 1` |

### 📦 Mod Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/mods list <server_id>` | List installed mods on a server | `/mods list 1` |
| `/mods search <query>` | Search for mods (placeholder) | `/mods search Structures` |

### 💾 Backup Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/backups list <server_id>` | List recent backups for a server | `/backups list 1` |
| `/backups create <server_id>` | Create a new backup | `/backups create 1` |

### 🤖 Bot Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/bot status` | Check if the bot is connected | `/bot status` |
| `/bot info` | Show system CPU/memory usage | `/bot info` |

---

## 5. Troubleshooting

### Bot won't start

**Problem**: Clicking "Start Bot" shows an error

**Solutions**:
1. Verify your bot token is correct (no extra spaces)
2. Make sure you copied the full token
3. Try regenerating the token in Discord Developer Portal

### Commands don't appear

**Problem**: Typing `/` doesn't show bot commands

**Solutions**:
1. **Wait up to 1 hour** - Global commands take time to register
2. **Use Guild ID** - Enter your server's Guild ID for instant registration
3. **Reinvite the bot** with `applications.commands` scope

### Bot shows offline in Discord

**Problem**: Bot appears offline in your server

**Solutions**:
1. Check if "Start Bot" was clicked in Settings
2. Look for any error messages in the app
3. Verify your internet connection

### "Unknown Command" error

**Problem**: Commands don't work or show errors

**Solutions**:
1. Make sure the ARK Server Manager app is running
2. Check that servers are properly configured in the app
3. Use the correct server ID (shown in `/servers list`)

### How to find your Guild ID

1. Open Discord settings (gear icon)
2. Go to **"Advanced"**
3. Enable **"Developer Mode"**
4. Right-click your server name in the sidebar
5. Click **"Copy Server ID"**

---

## Security Best Practices

1. **Never share your bot token** - Treat it like a password
2. **Use Guild ID** - Limits bot to your specific server
3. **Keep the app running** - Bot only works when ARK Server Manager is open
4. **Regenerate token if compromised** - Go to Discord Developer Portal → Bot → Reset Token

---

## FAQ

### Q: Does the bot work when the app is closed?
**A**: No, the bot requires ARK Server Manager to be running.

### Q: Can I use the bot on multiple Discord servers?
**A**: Yes, invite it to multiple servers. Without a Guild ID, commands work everywhere.

### Q: Is my bot token stored securely?
**A**: Yes, it's stored locally in the app's SQLite database on your computer.

### Q: Can other people control my servers?
**A**: Anyone with access to the Discord channel can use bot commands. Consider using Discord's role permissions.

---

## Need Help?

If you encounter issues not covered here:
1. Check the app console for error messages
2. Restart the Discord bot from Settings
3. Try regenerating your bot token
4. Reinstall the bot to your Discord server
