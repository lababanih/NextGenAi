# NextGenAI - AI Assistant with Artifacts System 🎨

**Create interactive code, apps, and visualizations - just like Claude!**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lababanih/NextGenAi)

---

## ✨ What's New: Artifacts System!

NextGenAI can now **generate interactive code artifacts** dengan features seperti:

### 🎨 Artifacts Capabilities:
- **💻 HTML/CSS/JavaScript** - Complete web apps
- **⚛️ React Components** - Modern UI components  
- **📊 Data Visualizations** - Charts and graphs
- **🎮 Interactive Games** - Playable in-browser
- **🖼️ SVG Graphics** - Animated vector graphics
- **📱 Responsive Designs** - Mobile-friendly layouts

### 🔥 Live Features:
- ✅ **Live Preview** - See results instantly
- ✅ **Code Editor** - Syntax highlighted
- ✅ **Copy/Download** - Export your code
- ✅ **Tab Switching** - Preview ⟷ Code view
- ✅ **Iframe Sandbox** - Safe execution

---

## 🎯 Quick Examples

### Example 1: Simple Calculator
```
You: "Create a beautiful calculator app"
AI: *generates working calculator with Tailwind UI*
```

### Example 2: Interactive Chart
```
You: "Build a sales dashboard with charts"
AI: *creates dashboard with Chart.js*
```

### Example 3: Game
```
You: "Make a tic-tac-toe game"
AI: *generates playable game*
```

### Example 4: Animation
```
You: "Create an animated loading spinner SVG"
AI: *generates smooth animation*
```

---

## 🚀 Setup (5 Minutes)

### 1. **Clone & Deploy**
```bash
git clone https://github.com/lababanih/NextGenAi.git
cd NextGenAi

# Deploy to Vercel
vercel --prod
```

### 2. **Get FREE API Keys**

#### Groq (REQUIRED - Main AI)
1. Visit: https://console.groq.com/
2. Sign up (FREE)
3. Create API key: `gsk_...`

#### Brave Search (OPTIONAL - Web Search)
1. Visit: https://brave.com/search/api/
2. Free tier: 2000 queries/month
3. Get API key: `BSA...`

### 3. **Configure via Admin Panel**

⚠️ **IMPORTANT:** Configuration is done via secure **Admin Panel**, NOT in the main app!

1. Visit: `https://your-app.vercel.app/admin.html`
2. Login (default password: `admin123`)
3. Add your Groq API key
4. Enable AI sources
5. Click **💾 Save All**

**Security Note:** API keys are stored in browser localStorage. Only admin can access/modify them.

---

## 🔐 Security Improvements

### ✅ Configuration Tab Removed
- No more public configuration page
- API keys can't be stolen by users
- Admin-only access via `/admin.html`

### ✅ Password Protected
- Admin panel requires password
- Change default password in admin panel
- Secure localStorage storage

### ✅ Separation of Concerns
- **Users:** Use the AI (can't see/change API keys)
- **Admins:** Configure AI sources (protected access)

---

## 📁 Project Structure

```
NextGenAI/
├── public/
│   ├── index.html          # Main UI (NO CONFIG TAB)
│   ├── app.js              # Frontend with Artifacts
│   └── admin.html          # Admin Panel (Password Protected)
├── api/
│   ├── chat.js             # Main chat endpoint
│   ├── tools/
│   │   └── index.js        # Tool handlers
│   └── admin/
│       ├── sources.js      # AI source management
│       └── test.js         # Connection testing
├── package.json
├── vercel.json
└── README.md
```

---

## 🎨 How Artifacts Work

### Detection
AI automatically detects when you want to create something:

```javascript
// Keywords that trigger artifacts:
- "create", "build", "make", "generate"
- "website", "app", "game", "calculator"
- "html", "react", "component"
```

### Generation Process
1. User asks to create something
2. AI generates complete working code
3. Code is displayed in artifact container
4. User can preview, edit, copy, or download

### Example Interaction:
```
User: "Create a todo list app with local storage"

AI: "I've created a beautiful todo list app for you!"

[ARTIFACT SHOWN]
Title: Todo List App
Type: HTML
Features:
- Add/remove tasks
- Mark as complete
- LocalStorage persistence
- Tailwind CSS styling

[Preview Tab] - See working app
[Code Tab] - View/copy source code
[Copy Button] - Copy to clipboard
[Download Button] - Save as .html
```

---

## 🛠️ Available Tools

| Tool | Status | Description | Setup Required |
|------|--------|-------------|----------------|
| **🎨 Artifacts** | Always ON | Code generation with preview | None |
| **🔍 Web Search** | Optional | Real-time internet search | Brave API key |
| **💻 Code Execution** | Optional | Run Python/JS code | None (Piston API) |
| **🖼️ Image Gen** | Optional | Text-to-image | None (Pollinations) |
| **👁️ Image Analysis** | Optional | AI vision | Groq Vision |
| **📊 Data Analysis** | Optional | CSV processing | None (client-side) |

---

## 💡 Usage Tips

### For Better Artifacts:

1. **Be Specific:**
   ```
   ❌ "Make a website"
   ✅ "Create a portfolio website with dark mode toggle, 
       hero section, and contact form using Tailwind CSS"
   ```

2. **Request Features:**
   ```
   "Build a calculator with:
   - Basic operations (+, -, *, /)
   - Clear button
   - Keyboard support
   - Beautiful gradient design"
   ```

3. **Iterate:**
   ```
   1st: "Create a timer app"
   2nd: "Add pause/resume buttons"
   3rd: "Make it look more modern with animations"
   ```

### Artifact Best Practices:

- **HTML Apps:** Request Tailwind CSS for styling
- **React Components:** Specify props and state needed
- **Games:** Describe rules and win conditions
- **Charts:** Provide sample data structure
- **SVG:** Describe colors and animation style

---

## 🔧 Admin Panel Features

### Access: `/admin.html`

**Features:**
- ✅ **Multiple AI Sources** - Add Groq, OpenRouter, etc
- ✅ **Priority Management** - Set fallback order
- ✅ **API Key Storage** - Secure localStorage
- ✅ **Connection Testing** - Test before enabling
- ✅ **Custom Sources** - Add any OpenAI-compatible API
- ✅ **Auto-Save** - Changes saved every 30s

**Default Password:** `admin123`

**Change Password:**
```javascript
// In browser console on admin.html:
localStorage.setItem('admin_password', 'your-new-password');
```

---

## 🎓 Example Prompts to Try

### Web Applications:
```
"Create a weather app with city search"
"Build a markdown editor with live preview"
"Make a color picker tool with hex/rgb values"
"Create a BMI calculator with metric/imperial units"
```

### Games:
```
"Build a memory card matching game"
"Create snake game with arrow key controls"
"Make a whack-a-mole game"
"Build rock-paper-scissors with score tracking"
```

### Visualizations:
```
"Create a bar chart showing monthly sales data"
"Build an animated progress ring component"
"Make a real-time clock with digital display"
"Create a kanban board with drag-drop"
```

### Utilities:
```
"Build a QR code generator"
"Create a password strength checker"
"Make a unit converter (length, weight, temp)"
"Build a countdown timer for events"
```

---

## 🌟 Advanced Features

### Multi-Source AI (Admin Setup)
Configure multiple AI providers for:
- **Redundancy:** Auto-failover if one fails
- **Quality:** Compare responses from multiple AIs
- **Cost Optimization:** Use free tier, upgrade selectively

### Smart Mode (Coming Soon)
- Query multiple AIs simultaneously
- Synthesize best response
- Higher accuracy for complex tasks

---

## 🐛 Troubleshooting

### "No AI sources configured"
**Solution:** Go to `/admin.html` and add Groq API key

### Artifact not rendering
**Solution:** 
1. Check browser console for errors
2. Try simpler prompt first
3. AI might need clearer instructions

### Code doesn't work
**Solution:**
1. Copy code and test locally
2. Check for missing dependencies
3. Ask AI to "fix bugs in previous artifact"

### Admin panel password forgotten
**Solution:**
```javascript
// Browser console:
localStorage.removeItem('admin_password');
// Default password restored: admin123
```

---

## 📊 Cost Breakdown

### 100% FREE Setup:
- ✅ Groq (AI generation) - FREE unlimited
- ✅ Piston (Code execution) - FREE unlimited  
- ✅ Pollinations (Images) - FREE unlimited
- ✅ Vercel (Hosting) - FREE tier generous

**Total: $0/month** 🎉

### Optional Paid (for scale):
- 💰 Brave Search Pro: $5/mo unlimited
- 💰 OpenRouter: ~$1-5/mo (light usage)
- 💰 Vercel Pro: $20/mo (if needed)

---

## 🔄 Roadmap

### v1.1 (Current) ✅
- Artifacts system
- Admin panel integration
- Security improvements
- Multi-tool support

### v1.2 (Next) 🚧
- Streaming responses
- Artifact templates library
- Code editing in-app
- Export to CodeSandbox/JSFiddle

### v2.0 (Future) 🌟
- Artifact versioning
- Collaboration features
- AI personality cloning
- Voice interaction

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

**Areas we need help:**
- More artifact templates
- Better code generation prompts
- UI/UX improvements
- Documentation
- Bug fixes

---

## 📄 License

MIT License - Free to use and modify!

---

## 🙏 Credits

**Built with:**
- Groq (AI Engine)
- Vercel (Hosting)
- Tailwind CSS (Styling)
- PrismJS (Syntax Highlighting)
- Marked (Markdown Parsing)

**Inspired by:**
- Claude.ai Artifacts System
- GitHub Copilot
- CodePen/JSFiddle

---

## 📞 Support

- 🐛 **Issues:** [GitHub Issues](https://github.com/lababanih/NextGenAi/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/lababanih/NextGenAi/discussions)
- 📧 **Email:** your-email@example.com

---

## 🌟 Star Us!

If you find NextGenAI useful, please ⭐ star the repo!

---

**Made with ❤️ in Indonesia 🇮🇩**

**by [@lababanih](https://github.com/lababanih)**
