# How to Upload Wiki to GitHub

Follow these steps to publish your wiki pages to GitHub:

---

## Method 1: Via GitHub Web Interface (Easiest)

### Step 1: Enable Wiki on Your Repository

1. Go to your repository: https://github.com/SANJAY-SM96/Ark-server-manager-2.0
2. Click **"Settings"** tab
3. Scroll to **"Features"** section
4. Check ☑️ **"Wikis"**
5. Click **"Save"**

### Step 2: Access Wiki

1. Click the **"Wiki"** tab at the top of your repository
2. Click **"Create the first page"**

### Step 3: Upload Pages

For each wiki page (`Home.md`, `Installation-Guide.md`, etc.):

1. Click **"New Page"** button (or edit existing)
2. **Page Title**: Use the filename without `.md`:
   - `Home.md` → Title: `Home`
   - `Installation-Guide.md` → Title: `Installation Guide` 
   - `Getting-Started.md` → Title: `Getting Started`
   - `Troubleshooting.md` → Title: `Troubleshooting`
   - `FAQ.md` → Title: `FAQ`

3. **Content**: Copy the entire content from the `.md` file
   - Open the file from `p:\ark\ark-server-manager\wiki\`
   - Copy all the markdown text
   - Paste into the GitHub wiki editor

4. **Edit Summary**: Enter something like "Added [Page Name]"

5. Click **"Save Page"**

6. Repeat for all 5 pages

---

## Method 2: Via Git Clone (Advanced)

### Step 1: Clone the Wiki Repository

```bash
# Clone your wiki (separate from main repo)
git clone https://github.com/SANJAY-SM96/Ark-server-manager-2.0.wiki.git

cd Ark-server-manager-2.0.wiki
```

### Step 2: Copy Wiki Files

```powershell
# Copy all wiki markdown files
Copy-Item "p:\ark\ark-server-manager\wiki\*.md" -Destination ".\"
```

### Step 3: Commit and Push

```bash
git add .
git commit -m "Added comprehensive wiki documentation"
git push origin master
```

---

## Page Structure

Your wiki will have these pages:

```
📖 Wiki Home
├── 📥 Installation Guide
├── 🚀 Getting Started
├── 🔧 Troubleshooting
└── ❓ FAQ
```

### Navigation Links

GitHub wikis automatically create a sidebar with all pages. No manual linking needed!

---

## Tips

1. **Start with Home**: Upload `Home.md` first - it's the wiki landing page
2. **Check Formatting**: GitHub renders markdown - preview before saving
3. **Links Work**: Internal wiki links like `[Installation](Installation-Guide)` work automatically
4. **Edit Anytime**: You can edit pages after uploading

---

## What to Upload

Upload these 5 files from `p:\ark\ark-server-manager\wiki\`:

- ✅ `Home.md` - Main landing page
- ✅ `Installation-Guide.md` - Installation instructions
- ✅ `Getting-Started.md` - Quick start guide
- ✅ `Troubleshooting.md` - Common issues
- ✅ `FAQ.md` - Frequently asked questions

---

## After Uploading

1. Visit your wiki: https://github.com/SANJAY-SM96/Ark-server-manager-2.0/wiki
2. Click through pages to verify formatting
3. Share the wiki link in your README:

```markdown
## 📖 Documentation

- **[📚 Wiki](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/wiki)** - Complete documentation
- **[🚀 Getting Started](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/wiki/Getting-Started)** - Quick start guide
- **[❓ FAQ](https://github.com/SANJAY-SM96/Ark-server-manager-2.0/wiki/FAQ)** - Common questions
```

---

## Future Wiki Pages (Optional)

You can add more pages later:
- Server Management
- Mod Management
- Configuration Guide
- Backup & Restore
- Automation
- RCON Console

Let me know if you need help creating these!
