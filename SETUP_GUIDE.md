# Mini AI Tutor - Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Free Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up (completely free)
3. Go to [API Keys](https://console.groq.com/keys)
4. Create a new API key
5. Copy the key

### Step 2: Set Up MongoDB

**Option A: MongoDB Atlas (Recommended - Free Cloud)**

1. Visit [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a FREE M0 cluster (no credit card needed)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password

**Option B: Local MongoDB**

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb

# Your connection string will be:
# mongodb://localhost:27017/mini-ai-tutor
```

### Step 3: Configure Environment Variables

Edit `/home/user/mini--AI-tutor/backend/.env`:

```bash
# Required: Add your Groq API key
GROQ_API_KEY=gsk_your_actual_api_key_here

# Required: Add your MongoDB URI
# Local:
MONGODB_URI=mongodb://localhost:27017/mini-ai-tutor

# OR Atlas (replace with your connection string):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mini-ai-tutor

# Optional: Redis (if you have it, otherwise leave as-is)
# The app works fine without Redis
```

### Step 4: Start the Servers

**Terminal 1 - Backend:**
```bash
cd /home/user/mini--AI-tutor/backend
npm install  # Only needed once
npm start
```

Wait for:
```
✅ Connected to MongoDB
✅ AI Service is ready
✅ AI routes mounted at /api/ai
🚀 Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd /home/user/mini--AI-tutor/frontend
npm install  # Only needed once
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

## 🎯 Testing the AI Features

1. Go to [http://localhost:5173/chat](http://localhost:5173/chat)
2. You'll see a RAG/Simple toggle in the header
3. Type any question
4. In **RAG mode**: You'll get answers with sources
5. In **Simple mode**: Direct AI responses

## 🔧 Troubleshooting

### "Route not found" (404 errors)
- Make sure backend is running on port 5000
- Check that GROQ_API_KEY is set correctly
- Verify MongoDB connection

### Backend won't start
- Check MongoDB is running
- Verify GROQ_API_KEY in .env file
- Look at error messages in terminal

### Frontend connection errors
- Make sure backend is running first
- Check port 5000 is not blocked
- Verify CORS settings

### ChromaDB warnings (OK to ignore)
- ChromaDB is optional
- The app works fine without it
- RAG features will use in-memory fallback

## 📚 Features Available

- ✅ AI Chat with RAG support
- ✅ Semantic search with sources
- ✅ Confidence scores
- ✅ Model information display
- ✅ Conversation history
- ✅ Flashcard generation
- ✅ Learning roadmaps

## 💡 Tips

- **Groq is 100% free** for most use cases
- **MongoDB Atlas M0** is free forever
- **Redis is optional** - app works without it
- **ChromaDB is optional** - app works without it

## 🆘 Need Help?

Check the console output for error messages. The backend is designed to work with graceful degradation, so even if some services are unavailable, the core features will still work.
