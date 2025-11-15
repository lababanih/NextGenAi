# NextGenAI - Advanced AI Assistant 🧠

AI yang belajar dari AI lain dengan **6 Tools Powerful** seperti Claude!

## 🚀 Features

### Core Capabilities:
- ✅ **Multi-AI Engine** - Groq, OpenRouter, Anthropic support
- ✅ **Smart Mode** - Query multiple AIs dan synthesize jawaban terbaik
- ✅ **Failover System** - Auto-switch jika provider gagal
- ✅ **Beautiful UI** - Modern interface dengan Tailwind CSS

### 🛠️ Advanced Tools:

1. **🔍 Web Search** 
   - Real-time internet search (Brave Search API)
   - Get latest news, facts, and information
   - FREE: 2000 queries/month

2. **💻 Code Execution**
   - Run Python, JavaScript, Java, C++, Go, dan 40+ bahasa
   - Safe sandboxed environment (Piston API)
   - 100% FREE - Unlimited usage

3. **🎨 Image Generation**
   - Text-to-image AI (Pollinations.ai)
   - Multiple styles and resolutions
   - 100% FREE - No API key needed

4. **🖼️ Image Analysis**
   - AI Vision powered by Llama 3.2 90B Vision
   - Describe images, OCR, object detection
   - FREE via Groq

5. **📊 Data Analysis**
   - CSV processing with PapaParse
   - Interactive charts with Chart.js
   - Client-side processing (FREE)

6. **📄 Document Creation**
   - Generate PDFs, Markdown
   - Professional formatting
   - Client-side (FREE)

---

## 📁 Project Structure

```
NextGenAI/
├── public/
│   ├── index.html          # Main UI
│   └── app.js              # Frontend logic with all tools
├── api/
│   ├── chat.js             # Main chat endpoint
│   ├── tools/
│   │   └── index.js        # Tool router & handlers
│   └── admin/
│       ├── sources.js      # AI source management
│       └── test.js         # API testing
├── package.json
├── vercel.json
└── README.md
```

---

## 🔧 Quick Setup (5 Minutes)

### 1. Clone Repository
```bash
git clone https://github.com/lababanih/NextGenAi.git
cd NextGenAi
```

### 2. Get FREE API Keys

#### **Groq** (Required - Main AI Engine)
1. Visit: https://console.groq.com/
2. Sign up (FREE)
3. Create API key
4. Copy API key

#### **Brave Search** (Optional - Web Search)
1. Visit: https://brave.com/search/api/
2. Sign up (FREE tier: 2000 queries/month)
3. Get API key

#### **Piston & Pollinations** 
- No API key needed! 🎉
- 100% FREE unlimited usage

### 3. Deploy to Vercel

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lababanih/NextGenAi)

#### Option B: Manual Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 4. Add Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```env
# Required
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Optional (untuk Web Search)
BRAVE_SEARCH_API_KEY=BSAxxxxxxxxxxxxx

# Optional (untuk advanced features)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### 5. Configure AI Sources

1. Go to your deployed URL
2. Click **⚙️ Configuration** tab
3. Paste your Groq API key
4. Enable AI engine
5. Click **💾 Save All**

### 6. Enable Tools

1. Click **🛠️ Tools** tab
2. Toggle tools you want to use:
   - 🔍 Web Search (requires Brave API key)
   - 💻 Code Execution (no setup needed)
   - 🎨 Image Generation (no setup needed)
   - 🖼️ Image Analysis (uses Groq Vision)
   - 📊 Data Analysis (client-side)
   - 📄 Document Creation (client-side)

---

## 💡 Usage Examples

### 1. Web Search
```
User: "What's the latest news about AI today?"
AI: *searches web and synthesizes results*
```

### 2. Code Execution
```
User: "Run this code:
```python
for i in range(5):
    print(f"Hello {i}")
```
"
AI: *executes code and shows output*
```

### 3. Image Generation
```
User: "Generate image of a futuristic city at sunset"
AI: *creates image with Pollinations.ai*
```

### 4. Image Analysis
```
User: *uploads image* "What's in this image?"
AI: *analyzes with Llama Vision*
```

### 5. Data Analysis
```
User: *uploads CSV* "Analyze this sales data"
AI: *creates charts and statistics*
```

---

## 🔑 API Keys - Complete Guide

### FREE APIs (Recommended for Start):

| Provider | Free Tier | Usage | Get Key |
|----------|-----------|-------|---------|
| **Groq** | Very generous | AI inference | [console.groq.com](https://console.groq.com/) |
| **Piston** | Unlimited | Code execution | No key needed! |
| **Pollinations** | Unlimited | Image generation | No key needed! |
| **Brave Search** | 2000/month | Web search | [brave.com/search/api](https://brave.com/search/api/) |

### Paid APIs (Optional for Scale):

| Provider | Pricing | Usage | Get Key |
|----------|---------|-------|---------|
| OpenRouter | $0.001/1K tokens | Access to GPT-4, Claude | [openrouter.ai](https://openrouter.ai/) |
| OpenAI | $0.002/1K tokens | GPT-4, DALL-E | [platform.openai.com](https://platform.openai.com/) |
| Anthropic | $0.008/1K tokens | Claude 3.5 | [console.anthropic.com](https://console.anthropic.com/) |

---

## 🎯 Cost Breakdown

### Completely FREE Setup:
- ✅ Groq (Main AI)
- ✅ Piston (Code execution)
- ✅ Pollinations (Image gen)
- ✅ Brave Search (2000 queries/month)

**Total Cost: $0/month** 🎉

### With Paid APIs (Optional):
- OpenRouter GPT-4: ~$1-5/month (light usage)
- OpenRouter Claude: ~$2-8/month (light usage)
- Brave Search Pro: $5/month (unlimited)

---

## 🐛 Troubleshooting

### Issue: "No AI providers configured"
**Solution:** Add Groq API key in Configuration tab

### Issue: Web Search not working
**Solution:** Add `BRAVE_SEARCH_API_KEY` to Vercel env vars

### Issue: Image Analysis not working
**Solution:** Ensure Groq API key is valid and model is `llama-3.2-90b-vision-preview`

### Issue: Code execution timeout
**Solution:** Piston API might be slow. Try again or simplify code.

---

## 🔄 Updates & Roadmap

### v1.0 (Current) ✅
- Multi-AI engine
- 6 Advanced tools
- Smart synthesis mode
- Admin panel

### v1.1 (Coming Soon) 🚧
- Streaming responses
- Memory/context management
- Voice input/output
- More AI providers

### v2.0 (Future) 🌟
- AI personality cloning
- Training data collection
- Plugin system
- Mobile app

---

## 📝 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "public/**",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### package.json
```json
{
  "name": "nextgenai",
  "version": "1.0.0",
  "description": "AI that learns from other AIs",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📄 License

MIT License - Free to use and modify!

---

## 🌟 Support

- ⭐ Star this repo if you find it useful!
- 🐛 Report bugs via GitHub Issues
- 💬 Questions? Open a Discussion

---

## 📞 Contact

- GitHub: [@lababanih](https://github.com/lababanih)
- Project: [NextGenAI](https://github.com/lababanih/NextGenAi)

---

**Built with ❤️ using:**
- Vercel (Hosting)
- Groq (AI Engine)
- Piston (Code Execution)
- Pollinations (Image Gen)
- Tailwind CSS (UI)
- Chart.js (Data Viz)

---

## 🎓 Learning Resources

### Understanding the Code:
- `public/index.html` - User interface
- `public/app.js` - Frontend logic & tool management
- `api/chat.js` - Main chat endpoint
- `api/tools/index.js` - Tool implementations
- `api/admin/` - Admin panel APIs

### Key Concepts:
1. **Multi-AI Synthesis** - Query multiple AIs and combine best answers
2. **Failover System** - Auto-switch if provider fails
3. **Tool Detection** - Smart detection when to use which tool
4. **Client-side Processing** - Some tools run in browser for speed

---

Made with 🧠 by [lababanih](https://github.com/lababanih)
