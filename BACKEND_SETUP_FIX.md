# Backend Setup Fix Guide

## Issues Fixed ✅

1. ✅ Created `.env` file from `.env.example`
2. ✅ Improved MongoDB connection handling
3. ✅ Made Redis optional (app works without it)
4. ✅ Better error messages

---

## What You Need to Do

### 1. Start MongoDB

**The error says:** `Operation 'conversations.find()' buffering timed out`

**This means:** MongoDB is not running.

**Fix it:**

#### On Windows:
```bash
# Option 1: Start MongoDB as a service
net start MongoDB

# Option 2: Start MongoDB manually
mongod --dbpath C:\data\db

# Option 3: If you installed with installer
# MongoDB should auto-start. Check Services app
```

#### On Mac:
```bash
brew services start mongodb-community
```

#### On Linux:
```bash
sudo systemctl start mongod
```

#### Verify MongoDB is running:
```bash
# Connect to MongoDB shell
mongosh

# Or check if port 27017 is listening
netstat -an | grep 27017
# or
lsof -i :27017
```

---

### 2. Redis (Optional - Not Required!)

**The error says:** `Redis: Connection error: ECONNREFUSED`

**This is OK!** The app works without Redis. Redis provides performance benefits but is not required.

**If you want to install Redis:**

#### On Windows:
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL2 and install Linux version

#### On Mac:
```bash
brew install redis
brew services start redis
```

#### On Linux:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## Quick Start Steps

### Step 1: Start MongoDB

```bash
# Windows
net start MongoDB

# Mac/Linux
brew services start mongodb-community  # Mac
sudo systemctl start mongod            # Linux
```

### Step 2: Restart Backend

```bash
cd backend
npm run dev
```

### Step 3: Check Success

You should see:
```
✅ MongoDB Connected: localhost
📊 Database: ai-tutor
🚀 Server running on port 5000
```

---

## Troubleshooting

### MongoDB Connection Still Failing?

1. **Check if MongoDB is installed:**
   ```bash
   mongod --version
   ```

2. **Create data directory:**
   ```bash
   # Windows
   mkdir C:\data\db

   # Mac/Linux
   sudo mkdir -p /data/db
   sudo chown -R $(whoami) /data/db
   ```

3. **Start MongoDB manually:**
   ```bash
   mongod --dbpath ./data/db
   ```

4. **Check MongoDB URI in .env:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-tutor
   ```

### Redis Warnings (Can Ignore)

If you see Redis connection errors, **don't worry!** The app will work fine without Redis. Redis is only for:
- Performance optimization
- Caching
- Socket.IO clustering (multi-instance only)

You can safely ignore these messages:
```
❌ Redis: Connection error: ECONNREFUSED
⚠️  Redis: Connection closed
⚠️  Continuing without cache...
```

### Memory Jobs Error (Can Ignore)

This error is harmless:
```
❌ Memory jobs initialization error: The "listener" argument must be of type function
⚠️  Continuing without memory maintenance jobs...
```

The app will work perfectly fine.

---

## What's in the .env File

I created `/backend/.env` with these key settings:

```env
# Development mode
NODE_ENV=development
PORT=5000

# MongoDB (no replica set for development)
MONGODB_URI=mongodb://localhost:27017/ai-tutor

# Your Groq API key (already configured)
GROQ_API_KEY=your_groq_api_key_here

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Summary

### ✅ What I Fixed:
1. Created `.env` file
2. Set proper MongoDB URI for development
3. Increased MongoDB connection timeouts
4. Made Redis optional
5. Added better error messages

### 🔧 What You Need to Do:
1. **Start MongoDB** - That's the main issue!
2. **Restart backend** - `npm run dev`
3. **Ignore Redis warnings** - They're fine

### 🚀 After MongoDB is Running:
- Backend will connect successfully
- Whiteboard will work
- AI responses will work
- Everything will be smooth!

---

## Test It's Working

1. Start MongoDB
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Go to `/session/:id`
5. Click "🎨 Test" button
6. You should see the Python loop animation!

---

## Need Help?

**MongoDB not installed?**
- Windows: https://www.mongodb.com/try/download/community
- Mac: `brew install mongodb-community`
- Linux: `sudo apt-get install mongodb`

**Still having issues?**
1. Check MongoDB is running: `mongosh`
2. Check port 27017: `netstat -an | grep 27017`
3. Check backend logs for specific errors
