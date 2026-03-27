# DEVI JEWELLERS - Local Machine Setup Guide

## Prerequisites

Before setting up the application, ensure you have the following installed on your Mac:

### 1. Install Node.js (Required)
```bash
# Option 1: Download from official website
# Visit: https://nodejs.org/en/download/
# Download the macOS installer and run it

# Option 2: Using Homebrew (if you have it)
brew install node

# Verify installation
node --version  # Should show v18 or higher
npm --version   # Should show npm version
```

### 2. Install Git (Required)
```bash
# Check if Git is already installed
git --version

# If not installed, download from: https://git-scm.com/download/mac
# Or use Homebrew:
brew install git
```

## Step-by-Step Setup Instructions

### Step 1: Download the Application
```bash
# Create a folder for the project
mkdir ~/Desktop/devi-jewellers
cd ~/Desktop/devi-jewellers

# If you have the project files, copy them to this folder
# Or if using Git:
# git clone <your-repository-url> .
```

### Step 2: Install Dependencies
```bash
# Navigate to the project folder
cd ~/Desktop/devi-jewellers

# Install all required packages
npm install

# This will install:
# - Express.js (backend server)
# - React + Vite (frontend)
# - SQLite database
# - File upload handling
# - All UI components and styling
```

### Step 3: Start the Application
```bash
# Start the development server
npm run dev

# You should see output like:
# > rest-express@1.0.0 dev
# > NODE_ENV=development tsx server/index.ts
# [express] serving on port 5000
```

### Step 4: Access the Application

Once the server starts, open your web browser and navigate to:

- **Main Application**: `http://localhost:5000`
- **TV Display**: `http://localhost:5000/tv`
- **Mobile Control**: `http://localhost:5000/mobile`
- **Admin Dashboard**: `http://localhost:5000/admin`
- **Media Manager**: `http://localhost:5000/media`
- **Promo Manager**: `http://localhost:5000/promo`

## Application Features Overview

### 🖥️ TV Display (`/tv`)
- Full-screen gold and silver rates display
- Promotional image slideshow below silver rates
- Real-time clock and automatic updates
- Professional jewelry store branding

### 📱 Mobile Control Panel (`/mobile`)
- Touch-optimized interface for updating rates
- Quick rate entry forms for gold (24K, 22K, 18K) and silver
- Instant synchronization with TV display

### ⚙️ Admin Dashboard (`/admin`)
- Display orientation settings (landscape/portrait)
- Color customization (background, text, accent colors)
- Font size controls for rate numbers
- Timing and refresh interval settings

### 🎬 Media Manager (`/media`)
- Upload promotional videos and images
- Set display duration and order
- Activate/deactivate content
- File management with preview

### 🖼️ Promo Manager (`/promo`)
- Manage promotional images for slideshow
- Choose transition effects (fade, slide, zoom, etc.)
- Set individual image duration
- Real-time preview

## Network Access Setup

### For Local Network Access (Other Devices)

1. **Find Your Mac's IP Address**:
```bash
# Get your local IP address
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
# Example output: 192.168.1.100
```

2. **Access from Other Devices**:
   - Use `http://YOUR_IP_ADDRESS:5000` instead of localhost
   - Example: `http://192.168.1.100:5000`

3. **For Mobile/Tablet Access**:
   - Connect devices to same WiFi network
   - Use mobile browser to access `http://YOUR_IP_ADDRESS:5000/mobile`

## File Storage

- **Media Files**: Stored in `uploads/media/` folder
- **Promotional Images**: Stored in `uploads/promo/` folder  
- **Database**: SQLite database file `database.sqlite`
- **Settings**: All configurations saved to database

## Troubleshooting

### Port Already in Use
```bash
# If port 5000 is busy, kill the process:
lsof -ti:5000 | xargs kill -9

# Then restart:
npm run dev
```

### Permission Issues
```bash
# Fix permissions if needed:
sudo chown -R $(whoami) ~/Desktop/devi-jewellers
```

### Clear Cache/Reset
```bash
# Stop the server (Ctrl+C)
# Delete database to reset all data:
rm database.sqlite

# Restart:
npm run dev
```

### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Should be v18 or higher
# If lower, update Node.js from nodejs.org
```

## Default Data

The application starts with sample gold rates:
- **Gold 24K**: ₹74,850 (Sale) / ₹74,950 (Purchase)
- **Gold 22K**: ₹68,600 (Sale) / ₹68,700 (Purchase) 
- **Gold 18K**: ₹56,150 (Sale) / ₹56,250 (Purchase)
- **Silver**: ₹91,500 (Sale) / ₹91,600 (Purchase)

## Production Deployment

For running on Synology NAS or production server:

1. **Build for Production**:
```bash
npm run build
```

2. **Use PM2 for Process Management**:
```bash
npm install -g pm2
pm2 start server/index.ts --name "devi-jewellers"
pm2 startup
pm2 save
```

3. **Set Static IP**: Configure your router to assign static IP `192.168.31.177` to the server machine.

## Support

- Check browser console for any JavaScript errors
- Verify all files are uploaded correctly
- Ensure WiFi network connectivity for remote access
- Database will auto-create on first run

The application is designed to run completely offline once set up - no internet connection required for operation.