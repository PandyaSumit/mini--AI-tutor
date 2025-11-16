# 🎤 Free Speech-to-Text Setup Guide

Your Voice AI Tutor now supports **multiple FREE STT providers** with automatic fallback!

## 🎯 How It Works

The system tries providers in this order:

1. **Hugging Face Inference API** (Free, Server-side) → Primary
2. **OpenAI Whisper** (Limited free tier, Server-side) → Fallback
3. **Browser Web Speech API** (100% Free, Client-side) → Always available

If one fails, it automatically tries the next one. **No paid service required!**

---

## Option 1: Hugging Face (Recommended - 100% FREE!)

### Why Hugging Face?
- ✅ **Completely FREE** - No credit card required
- ✅ **Generous limits** - Thousands of requests per month
- ✅ **Good quality** - Uses Whisper Large v3 model
- ✅ **No billing** - Never charges you

### Setup Steps:

#### 1. Create Account (Free)
Go to: https://huggingface.co/join

#### 2. Get API Token
1. Go to: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Name it: `mini-ai-tutor-stt`
4. Type: **Read**
5. Click **"Generate a token"**
6. Copy the token (starts with `hf_...`)

#### 3. Add to Backend .env
```env
HUGGINGFACE_API_KEY=hf_your_token_here
```

**OR use:**
```env
HF_TOKEN=hf_your_token_here
```

#### 4. Restart Backend
```bash
cd backend
npm run dev
```

### Expected Logs:
```
✅ STT Service initialized with providers: huggingface → browser
🔄 Trying Hugging Face STT (Free)...
✅ Hugging Face STT succeeded
✅ STT Provider used: huggingface
```

---

## Option 2: OpenAI Whisper (Limited Free Tier)

### Setup:

#### 1. Get API Key
Go to: https://platform.openai.com/api-keys

#### 2. Add to Backend .env
```env
OPENAI_API_KEY=sk-your_key_here
```

### Limitations:
- ⚠️ Requires credit card (but has free tier)
- ⚠️ Limited free credits ($5 for new accounts)
- ⚠️ May expire or exceed quota

---

## Option 3: Browser Web Speech API (Always FREE!)

### No Setup Required!
- ✅ **100% FREE** - No API key needed
- ✅ **Client-side** - Runs in browser
- ✅ **Instant** - No server delays
- ✅ **Privacy** - Audio never leaves your device

### How It Works:
The system automatically falls back to browser STT when:
- No API keys are configured
- Server-side STT fails or exceeds quota
- You prefer client-side processing

### Browser Support:
- ✅ Chrome, Edge, Safari
- ❌ Firefox (limited support)

### User Experience:
When browser STT is active, users will see:
- Message: "Using browser speech recognition (100% FREE)"
- Recording works exactly the same
- Speech is transcribed in real-time
- Results sent to AI for response

---

## 🚀 Quick Start (Zero Config)

### Don't want to set up any API keys?

**Just skip all configuration!** The system will automatically use:
- **Browser Web Speech API** (client-side, 100% free)

Users can start talking immediately with zero backend configuration.

---

## ⚙️ Configuration Examples

### Scenario 1: Maximum Free Usage
```env
# Use Hugging Face (best free option)
HUGGINGFACE_API_KEY=hf_xxxxx

# No need for OpenAI
```

**Result:** Hugging Face → Browser fallback

---

### Scenario 2: No API Keys (Simplest)
```env
# Nothing to configure!
```

**Result:** Browser STT only (still works great!)

---

### Scenario 3: Full Redundancy
```env
# All providers configured
HUGGINGFACE_API_KEY=hf_xxxxx
OPENAI_API_KEY=sk-xxxxx
```

**Result:** Hugging Face → OpenAI → Browser (triple fallback!)

---

## 🧪 Testing

### Test Hugging Face:

1. **Add API key** to backend `.env`
2. **Restart backend**
3. **Go to** `/voice-tutor`
4. **Click microphone** and speak
5. **Check logs** for:
   ```
   🔄 Trying Hugging Face STT (Free)...
   ✅ Hugging Face STT succeeded
   ```

### Test Browser STT:

1. **Remove all API keys** from `.env` (or leave blank)
2. **Restart backend**
3. **Go to** `/voice-tutor`
4. **Click microphone** and speak
5. **You'll see**: "Using browser speech recognition (100% FREE)"
6. **Speech still works!** (processed in browser)

---

## 📊 Provider Comparison

| Feature | Hugging Face | OpenAI Whisper | Browser API |
|---------|-------------|----------------|-------------|
| **Cost** | FREE | Limited free | FREE |
| **Credit Card** | No | Yes | No |
| **Quality** | Excellent | Excellent | Good |
| **Speed** | 2-5s | 1-3s | Instant |
| **Quota** | Very high | Limited | Unlimited |
| **Privacy** | Server | Server | Client |
| **Setup** | API token | API key | None |

---

## 🐛 Troubleshooting

### Issue: "Hugging Face STT failed: Model is loading"

**Solution:** First request may be slow (model loading). Wait 10-30s and try again.

**What happens:** System automatically tries next provider (OpenAI or Browser)

---

### Issue: "OpenAI quota exceeded"

**Solution:** Use Hugging Face instead (free, no quota issues) or rely on browser STT.

**What happens:** System falls back to next available provider

---

### Issue: "Browser speech recognition not supported"

**Solution:** Use Chrome, Edge, or Safari instead of Firefox.

**Alternative:** Configure Hugging Face API key for server-side STT

---

### Issue: No STT working at all

**Check:**
1. Is backend running? `npm run dev`
2. Any API keys in `.env`?
3. Browser supports Web Speech API?

**Fallback:** Even with zero configuration, browser STT should work in Chrome/Safari

---

## 💰 Cost Comparison

### Monthly Usage: 1000 voice messages

| Provider | Cost | Notes |
|----------|------|-------|
| **Hugging Face** | $0 | FREE forever |
| **Browser API** | $0 | FREE forever |
| **OpenAI Whisper** | ~$6 | After free tier |

**Recommendation:** Use Hugging Face for best balance of quality, cost, and reliability!

---

## 🔐 Security & Privacy

### Hugging Face:
- Audio sent to HF servers
- Not stored permanently
- Processed and deleted
- GDPR compliant

### OpenAI:
- Audio sent to OpenAI servers
- Subject to OpenAI policies
- May be used for improvements (opt-out available)

### Browser API:
- **Most private** - audio never leaves device
- Processed entirely in browser
- Zero network transmission
- GDPR/CCPA compliant

---

## 📝 Backend Logs Explained

```bash
# Good - Hugging Face working
✅ STT Service initialized with providers: huggingface → browser
🔄 Trying Hugging Face STT (Free)...
✅ Hugging Face STT succeeded
✅ STT Provider used: huggingface

# Fallback - Hugging Face failed, trying next
⚠️ Hugging Face STT failed: Model is loading
🔄 Trying OpenAI Whisper STT...
✅ OpenAI Whisper STT succeeded
✅ STT Provider used: openai

# All server-side failed, using browser
⚠️ All server-side STT options failed, suggesting browser STT
✅ Client will use browser Web Speech API
```

---

## ✅ Recommended Setup

For **development**:
```env
# Use Hugging Face (free, reliable)
HUGGINGFACE_API_KEY=hf_your_token_here
```

For **production**:
```env
# Use Hugging Face as primary
HUGGINGFACE_API_KEY=hf_your_token_here

# Optional: Add OpenAI as backup
OPENAI_API_KEY=sk_your_key_here
```

For **testing/demo** (zero config):
```env
# Leave empty - browser STT only
# Still works perfectly!
```

---

## 🎉 Success!

Once configured, you'll have:
- ✅ Free, unlimited speech-to-text
- ✅ Automatic fallback if one service fails
- ✅ Works even with zero configuration
- ✅ No ongoing costs

**Total cost: $0** 🎊

---

## 📚 Additional Resources

- **Hugging Face Tokens:** https://huggingface.co/settings/tokens
- **OpenAI API Keys:** https://platform.openai.com/api-keys
- **Web Speech API Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

## Need Help?

1. Check backend logs for specific errors
2. Verify API key format (starts with `hf_` for Hugging Face)
3. Try browser STT (always works, no config needed)
4. Review `TESTING_VOICE_TUTOR.md` for testing guide

Happy transcribing! 🎤✨
