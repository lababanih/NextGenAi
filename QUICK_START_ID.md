# 🚀 Panduan Cepat NextGenAI

Panduan setup lengkap dalam **5 menit**!

---

## 📦 Yang Anda Dapatkan

NextGenAI adalah AI assistant dengan **6 tools powerful**:

### ✅ Tools GRATIS Selamanya:
1. **💬 Chat AI** - Percakapan natural dengan AI
2. **💻 Code Execution** - Jalankan kode Python, JavaScript, dll
3. **🎨 Image Generation** - Buat gambar dari text
4. **🖼️ Image Analysis** - Analisis gambar dengan AI Vision
5. **🔍 Web Search** - Cari informasi terkini di internet
6. **📊 Data Analysis** - Analisis CSV dan buat charts

### 💰 Total Biaya: **$0** (GRATIS!)

---

## 🎯 Step 1: Dapatkan API Keys GRATIS

### 1.1. Groq (WAJIB - Main AI Engine)

**Kenapa Groq?**
- ⚡ Super cepat
- 🆓 100% GRATIS
- 🔥 Model terbaru (Llama 3.3 70B)
- 👁️ Vision AI included

**Cara Daftar:**
1. Buka: https://console.groq.com/
2. Klik **Sign Up** (bisa pakai Google)
3. Verify email
4. Klik **API Keys** → **Create API Key**
5. Copy API key (mulai dengan `gsk_`)

**Contoh API Key:**
```
gsk_ABcDEfGhIjKLmnoPQrSTuvwXYz1234567890
```

⚠️ **PENTING:** Simpan API key ini! Kita akan pakai nanti.

---

### 1.2. Brave Search (OPSIONAL - Untuk Web Search)

**Kenapa Brave?**
- 🔍 Search engine terbaik untuk AI
- 🆓 2000 queries/bulan GRATIS
- 📊 Data real-time

**Cara Daftar:**
1. Buka: https://brave.com/search/api/
2. Klik **Get Started**
3. Sign up (email + password)
4. Pilih **Free Plan** (2000 queries/bulan)
5. Copy API key (mulai dengan `BSA`)

**Contoh API Key:**
```
BSAaBbCcDdEeFfGgHhIiJjKkLlMm1234567890
```

---

### 1.3. Piston & Pollinations (Auto GRATIS!)

Dua tools ini **TIDAK PERLU API KEY**:
- **Piston** - Code execution (unlimited FREE)
- **Pollinations** - Image generation (unlimited FREE)

🎉 Tinggal pakai aja!

---

## 🚀 Step 2: Deploy ke Vercel

### 2.1. Fork Repository

1. Buka: https://github.com/lababanih/NextGenAi
2. Klik tombol **Fork** (pojok kanan atas)
3. Repository akan di-copy ke akun GitHub Anda

### 2.2. Deploy Otomatis

#### Option A: One-Click Deploy (TERMUDAH)

1. Klik tombol ini:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lababanih/NextGenAi)

2. Login dengan GitHub
3. Klik **Deploy**
4. Tunggu ~2 menit
5. **DONE!** 🎉

#### Option B: Manual Import

1. Buka: https://vercel.com/
2. Klik **Add New** → **Project**
3. Import repository **NextGenAi** Anda
4. Klik **Deploy**

---

## ⚙️ Step 3: Setup Environment Variables

Setelah deploy, kita perlu tambah API keys:

### 3.1. Buka Settings

1. Di Vercel Dashboard → Pilih project **NextGenAi**
2. Klik **Settings** (tab atas)
3. Pilih **Environment Variables** (sidebar kiri)

### 3.2. Tambah API Keys

Klik **Add New** dan masukkan:

#### Variable 1 (WAJIB):
```
Name: GROQ_API_KEY
Value: gsk_your_groq_api_key_here
Environment: Production, Preview, Development
```

#### Variable 2 (OPSIONAL - untuk Web Search):
```
Name: BRAVE_SEARCH_API_KEY
Value: BSA_your_brave_api_key_here
Environment: Production, Preview, Development
```

### 3.3. Redeploy

Setelah tambah variables:
1. Klik **Deployments** (tab atas)
2. Klik **⋯** pada deployment terakhir
3. Klik **Redeploy**
4. Tunggu ~1 menit

---

## 🎮 Step 4: Setup & Gunakan

### 4.1. Buka Website Anda

URL website: `https://your-project-name.vercel.app`

### 4.2. Configure AI Engine

1. Klik tab **⚙️ Configuration**
2. Lihat **Primary Engine (Groq)**
3. Paste API Key Groq Anda (yang dimulai `gsk_`)
4. Toggle switch menjadi **ON** (warna biru)
5. Klik **💾 Save All**

✅ Status akan berubah jadi **Active: 1**

### 4.3. Enable Tools

1. Klik tab **🛠️ Tools**
2. Toggle tools yang mau Anda gunakan:

**Recommend untuk pemula:**
- ✅ Code Execution (langsung jalan, tanpa setup)
- ✅ Image Generation (langsung jalan, tanpa setup)
- ✅ Web Search (jika sudah ada Brave API key)

**Advance (perlu Groq Vision):**
- 🖼️ Image Analysis (perlu model vision)

### 4.4. Mulai Chat!

1. Klik tab **💬 Assistant**
2. Ketik pertanyaan atau command
3. Tekan Enter atau klik **📤**

---

## 💡 Contoh Penggunaan

### 1. Chat Biasa
```
User: "Jelaskan apa itu machine learning"
AI: *menjelaskan dengan detail*
```

### 2. Code Execution
```
User: "Run this code:
```python
import math
for i in range(1, 6):
    print(f"{i} squared is {i**2}")
```
"
AI: *execute dan tampilkan output*
```

### 3. Image Generation
```
User: "Generate image of a dragon flying over mountains at sunset"
AI: *creates beautiful image*
```

### 4. Web Search (jika enabled)
```
User: "What's the latest news about AI today?"
AI: *searches web and summarizes*
```

### 5. Image Analysis
```
User: *upload image* "What objects are in this image?"
AI: *analyzes with Llama Vision*
```

---

## 🐛 Troubleshooting

### ❌ Error: "No AI providers configured"

**Penyebab:** Groq API key belum disetup

**Solusi:**
1. Buka tab **⚙️ Configuration**
2. Paste Groq API key
3. Toggle switch ON
4. Save

### ❌ Error: "Service Unavailable"

**Penyebab:** Groq API key salah atau expired

**Solusi:**
1. Check API key di https://console.groq.com/keys
2. Buat key baru jika perlu
3. Update di Configuration

### ❌ Web Search tidak jalan

**Penyebab:** Brave API key belum disetup

**Solusi:**
1. Daftar di https://brave.com/search/api/
2. Tambah `BRAVE_SEARCH_API_KEY` di Vercel env vars
3. Redeploy

### ❌ Code execution timeout

**Penyebab:** Kode terlalu kompleks atau infinite loop

**Solusi:**
1. Simplify code
2. Coba lagi

---

## 📊 Monitoring Usage

### Groq Dashboard
- Visit: https://console.groq.com/
- Check **Usage** untuk lihat quota

### Brave Search Dashboard
- Visit: https://brave.com/search/api/dashboard
- Monitor remaining queries

---

## 🎯 Tips & Tricks

### 1. **Optimize Prompts**
Gunakan prompt yang spesifik:
- ❌ "Buat gambar mobil"
- ✅ "Buat gambar mobil sport futuristik warna merah dengan background city malam hari"

### 2. **Code Execution Best Practices**
- Selalu wrap code dengan ` ```language ```
- Test code kecil dulu
- Avoid infinite loops

### 3. **Multiple AI Sources**
Tambah lebih banyak AI engines:
- OpenRouter (akses GPT-4, Claude)
- Anthropic (Claude direct)
- OpenAI (GPT-4 direct)

### 4. **Smart Mode**
Jika punya multiple AI sources, enable **Smart Mode** untuk:
- Query semua AI sekaligus
- Synthesize jawaban terbaik
- Higher accuracy

---

## 🚀 Next Steps

Setelah basic setup, Anda bisa:

### 1. **Add More AI Providers**
```javascript
// Tambah di Configuration:
{
  name: 'OpenRouter GPT-4',
  provider: 'openrouter',
  model: 'openai/gpt-4',
  apiKey: 'your-openrouter-key'
}
```

### 2. **Custom Domain**
- Vercel Settings → Domains
- Add your custom domain
- Update DNS records

### 3. **Analytics**
- Install Vercel Analytics
- Track usage & performance

### 4. **Memory System**
- Implement conversation history
- Save learned knowledge
- Personalize responses

---

## 📞 Butuh Bantuan?

### Dokumentasi Lengkap:
- README.md (English)
- GitHub Issues

### Community:
- GitHub Discussions
- Discord (coming soon)

### Support:
- Email: support@your-domain.com
- GitHub: @lababanih

---

## 🎓 Resources

### Learn More:
- [Groq Documentation](https://console.groq.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Brave Search API](https://brave.com/search/api/docs)

### Video Tutorials:
- Coming soon on YouTube

---

## ✅ Checklist Setup

Copy checklist ini dan centang saat selesai:

```
☐ 1. Daftar Groq dan dapatkan API key
☐ 2. (Optional) Daftar Brave Search
☐ 3. Fork GitHub repository
☐ 4. Deploy ke Vercel
☐ 5. Add GROQ_API_KEY di Vercel env vars
☐ 6. (Optional) Add BRAVE_SEARCH_API_KEY
☐ 7. Redeploy Vercel
☐ 8. Buka website
☐ 9. Configure AI engine
☐ 10. Enable tools
☐ 11. Test chat
☐ 12. Test tools (code, image, etc)
☐ 13. Celebrate! 🎉
```

---

## 🎉 Selamat!

NextGenAI Anda sudah siap digunakan!

**Share ke teman-teman:**
- Twitter/X
- LinkedIn
- Facebook
- WhatsApp

**⭐ Jangan lupa star repository di GitHub!**

---

Made with ❤️ in Indonesia 🇮🇩
