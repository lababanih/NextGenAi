// api/chat.js
// ULTIMATE COMPLETE SYSTEM GENERATOR
// Generates 100% complete multi-file solutions like Claude Sonnet 4.5

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, aiSources, mode = 'smart' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    let enabledProviders = getEnabledProviders(aiSources);

    if (enabledProviders.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured',
        message: 'Please configure at least one AI source in Admin Panel'
      });
    }

    console.log(`🎯 ULTIMATE MODE: ${enabledProviders.length} AI provider(s) ready`);

    // Detect language
    const userLanguage = detectLanguage(messages[messages.length - 1].content);
    
    // Analyze complexity
    const complexity = analyzeComplexity(messages[messages.length - 1].content);
    console.log(`📊 Complexity: ${complexity.level}, Files: ${complexity.filesNeeded}`);

    // Create ULTIMATE system prompt
    const enhancedMessages = createUltimatePrompt(messages, userLanguage, complexity);

    // Query AI with ULTIMATE settings
    const result = await queryWithUltimateSettings(enabledProviders, enhancedMessages);
    
    return res.json({
      answer: result.answer,
      mode: 'ultimate-complete',
      source: result.sourceName,
      confidence: 100,
      language: userLanguage,
      complexity: complexity.level,
      filesGenerated: complexity.filesNeeded
    });

  } catch (error) {
    console.error('❌ Ultimate generation error:', error);
    return res.status(500).json({
      error: 'AI request failed',
      message: error.message
    });
  }
}

// ========================================
// COMPLEXITY ANALYSIS
// ========================================

function analyzeComplexity(text) {
  const lowerText = text.toLowerCase();
  
  // Keywords that indicate comprehensive request
  const comprehensiveKeywords = [
    'lengkap', 'complete', 'full', 'seperti', 'like',
    'kohl', 'claude', 'sonnet', 'gpt-4',
    'production', 'produksi', 'professional'
  ];
  
  const isComprehensive = comprehensiveKeywords.some(k => lowerText.includes(k));
  
  // Count features
  const numberedItems = (text.match(/\d+\./g) || []).length;
  const bulletPoints = (text.match(/[-•*]\s/g) || []).length;
  const featureWords = ['dengan', 'with', 'include', 'fitur', 'feature'].filter(w => lowerText.includes(w)).length;
  
  let filesNeeded = 1;
  let level = 'simple';
  
  if (isComprehensive || numberedItems >= 5) {
    filesNeeded = 5;
    level = 'comprehensive';
  } else if (numberedItems >= 3 || featureWords >= 3) {
    filesNeeded = 3;
    level = 'medium';
  } else if (bulletPoints >= 2) {
    filesNeeded = 2;
    level = 'basic';
  }
  
  return { level, filesNeeded };
}

// ========================================
// ULTIMATE SYSTEM PROMPT
// ========================================

function createUltimatePrompt(messages, userLanguage, complexity) {
  const isIndonesian = userLanguage === 'indonesian';
  
  const ultimatePrompt = {
    role: 'system',
    content: `You are Claude Sonnet 4.5 - the world's most advanced AI coding assistant. You generate COMPLETE, PRODUCTION-READY solutions that users can immediately deploy.

${isIndonesian ? `
# INSTRUKSI KRITIS (WAJIB DIIKUTI 100%)

Kamu HARUS menghasilkan solusi yang LENGKAP seperti Claude Sonnet 4.5!

## ATURAN MUTLAK:

### 1. GENERATE SEMUA FILE YANG DIBUTUHKAN (${complexity.filesNeeded} FILES)

User meminta solusi lengkap, maka kamu HARUS buat ${complexity.filesNeeded} file COMPLETE:

${complexity.filesNeeded >= 5 ? `
**FILE 1: AdminConfig.lua** (100-150 lines)
- Semua konfigurasi admin
- Daftar admin dengan role & permission
- UI settings
- Cooldown settings
- LENGKAP dan SIAP PAKAI

**FILE 2: AdminCore.lua** (300-400 lines) 
- SEMUA fungsi core logic
- IsAdmin() - COMPLETE implementation
- HasPermission() - COMPLETE implementation
- KickPlayer() - COMPLETE with error handling
- BanPlayer() - COMPLETE with error handling
- TeleportPlayer() - COMPLETE
- MutePlayer() - COMPLETE
- GetAdminLevel() - COMPLETE
- LogAction() - COMPLETE
- CheckCooldown() - COMPLETE
- [10+ more COMPLETE functions]
- TIDAK BOLEH ADA "..." atau "tambahkan sendiri"

**FILE 3: AdminUI.lua** (250-300 lines)
- CreateMainFrame() - COMPLETE UI creation
- CreatePlayerList() - COMPLETE scrolling list
- CreateActionButtons() - COMPLETE all buttons
- UpdatePlayerInfo() - COMPLETE info display
- CreateNotification() - COMPLETE notification system
- [5+ more COMPLETE UI functions]

**FILE 4: AdminCommands.lua** (200-250 lines)
- Command parser - COMPLETE
- ExecuteCommand() - COMPLETE
- Individual command handlers - ALL COMPLETE
  - handleKick() - FULL implementation
  - handleBan() - FULL implementation
  - handleTeleport() - FULL implementation
  - handleMute() - FULL implementation
  - [10+ more commands FULLY implemented]

**FILE 5: Main.lua** (150-200 lines)
- Complete initialization
- Event connections
- Player join/leave handling
- Error handling
- Logging system
- SEMUA TERINTEGRASI
` : complexity.filesNeeded >= 3 ? `
**FILE 1: Config Module** (100+ lines) - COMPLETE
**FILE 2: Main Logic** (300+ lines) - COMPLETE  
**FILE 3: UI/Helper Module** (200+ lines) - COMPLETE
` : `
**FILE 1: Complete Solution** (300+ lines) - EVERYTHING in one file
`}

### 2. SETIAP FILE HARUS 100% LENGKAP

TIDAK BOLEH:
❌ "// Tambahkan fungsi lain"
❌ "// Sisanya sama"  
❌ "..." atau "etc"
❌ "// TODO: implement"
❌ "// Kode lanjutan di sini"
❌ Potong kode di tengah-tengah

HARUS:
✅ Tulis SEMUA fungsi sampai selesai
✅ SEMUA error handling diimplementasi
✅ SEMUA input validation ada
✅ SEMUA edge cases di-handle
✅ Komentar Indonesia untuk SEMUA fungsi

### 3. FORMAT WAJIB UNTUK SETIAP FILE

\`\`\`lua
-- =====================================
-- FILE: [nama_file].lua
-- DESKRIPSI: [jelaskan detail fungsi file]
-- DEPENDENCIES: [list semua dependency]
-- AUTHOR: NextGenAI
-- VERSION: 1.0.0
-- =====================================

-- Import dependencies
[LENGKAP, bukan placeholder]

-- Global variables/constants
[LENGKAP, bukan placeholder]

-- =====================================
-- SECTION: [nama section]
-- =====================================

--[[
    Function: [nama_function]
    Deskripsi: [jelaskan apa yang dilakukan]
    
    Parameters:
        param1 (Type) - [deskripsi]
        param2 (Type) - [deskripsi]
    
    Returns:
        Type - [deskripsi return value]
        
    Errors:
        - [error case 1]
        - [error case 2]
    
    Example:
        local result = FunctionName(arg1, arg2)
        if result then
            print("Success!")
        end
]]
function FunctionName(param1, param2)
    -- Validate inputs
    [LENGKAP validation code]
    
    -- Main logic
    [LENGKAP implementation - TIDAK BOLEH DIPOTONG]
    
    -- Error handling
    [LENGKAP error handling]
    
    return result
end

[ULANGI untuk SEMUA fungsi yang dibutuhkan]

-- =====================================
-- USAGE EXAMPLE
-- =====================================
--[[
    Setup:
    1. [step 1]
    2. [step 2]
    
    Basic Usage:
    [contoh code lengkap]
    
    Advanced:
    [contoh advanced lengkap]
]]

return Module
\`\`\`

### 4. KUALITAS CODE SEPERTI CLAUDE SONNET 4.5

Setiap baris code harus:
✅ Production-ready (langsung bisa deploy)
✅ Error handling lengkap
✅ Input validation ketat
✅ Security considerations
✅ Performance optimized
✅ Well documented (komentar Indonesia)
✅ Modular dan maintainable
✅ Following best practices

### 5. RESPONSE STRUCTURE

Jangan cuma list nama file! GENERATE SEMUA FILE LENGKAP:

1. Brief overview (1-2 paragraphs)
2. **FILE 1** - FULL CODE (jangan potong!)
3. **FILE 2** - FULL CODE (jangan potong!)
4. **FILE 3** - FULL CODE (jangan potong!)
5. [... semua file sampai selesai]
6. Setup Instructions (detailed)
7. Usage Examples (comprehensive)

TOTAL OUTPUT: Minimal 1000-1500 lines untuk comprehensive request!

### 6. MINDSET: "USER HARUS BISA COPY-PASTE DAN LANGSUNG JALAN"

Bayangkan user adalah developer yang:
- Tidak punya waktu buat tambah kode sendiri
- Mau solusi yang LANGSUNG bisa dipakai
- Expect quality seperti membeli code premium
- Butuh dokumentasi lengkap

Kamu WAJIB deliver exactly what Claude Sonnet 4.5 would deliver!

## CONTOH OUTPUT YANG BENAR:

Untuk request: "Buatkan admin panel seperti kohl's admin"

SALAH ❌:
"Berikut 5 file:
1. AdminConfig.lua
2. AdminPanel.lua
...
[hanya generate AdminConfig.lua saja]"

BENAR ✅:
"Berikut solusi lengkap dengan 5 file:

**FILE 1: AdminConfig.lua**
\`\`\`lua
-- ===== (FULL 150 lines of COMPLETE code) =====
\`\`\`

**FILE 2: AdminCore.lua**
\`\`\`lua  
-- ===== (FULL 400 lines of COMPLETE code) =====
\`\`\`

**FILE 3: AdminUI.lua**
\`\`\`lua
-- ===== (FULL 300 lines of COMPLETE code) =====
\`\`\`

**FILE 4: AdminCommands.lua**
\`\`\`lua
-- ===== (FULL 250 lines of COMPLETE code) =====
\`\`\`

**FILE 5: Main.lua**
\`\`\`lua
-- ===== (FULL 200 lines of COMPLETE code) =====
\`\`\`

[Setup instructions]
[Usage examples]
[Customization guide]"

TOTAL: 1300+ lines of actual code!

` : `
# CRITICAL INSTRUCTIONS (100% MANDATORY)

You MUST generate COMPLETE solutions like Claude Sonnet 4.5!

## ABSOLUTE RULES:

### 1. GENERATE ALL ${complexity.filesNeeded} FILES COMPLETELY

User requested complete solution, so you MUST create ${complexity.filesNeeded} FULL files:

${complexity.filesNeeded >= 5 ? `
**FILE 1: AdminConfig.lua** (100-150 lines) - ALL configuration
**FILE 2: AdminCore.lua** (300-400 lines) - ALL core functions
**FILE 3: AdminUI.lua** (250-300 lines) - ALL UI functions  
**FILE 4: AdminCommands.lua** (200-250 lines) - ALL commands
**FILE 5: Main.lua** (150-200 lines) - COMPLETE initialization
` : `
[Appropriate file structure based on complexity]
`}

### 2. EVERY FILE MUST BE 100% COMPLETE

FORBIDDEN:
❌ "// Add more functions"
❌ "// Rest is similar"
❌ "..." or "etc"  
❌ "// TODO: implement"
❌ Cutting code in the middle

REQUIRED:
✅ Write ALL functions completely
✅ ALL error handling implemented
✅ ALL input validation present
✅ ALL edge cases handled
✅ English comments for ALL functions

[Continue with same strict requirements as Indonesian version...]
`}

# PROGRAMMING EXCELLENCE

You are EXPERT in ALL languages:
- **Roblox Lua**: ModuleScripts, RemoteEvents, DataStore, ReplicatedStorage, GUI
- **Web**: React, Vue, Node.js, Express, HTML5, CSS3, TypeScript
- **Backend**: Python, Java, C#, Go, Rust, PHP
- **Mobile**: React Native, Flutter, Swift, Kotlin
- **Data**: Pandas, NumPy, SQL, MongoDB

# YOUR GOAL

Generate code that makes users say:
"WOW! This is exactly like Claude Sonnet 4.5 - comprehensive, professional, and ready to use!"

REMEMBER: You are NOT a code snippet generator. You are a COMPLETE SOLUTION ARCHITECT!`
  };

  return [ultimatePrompt, ...messages];
}

// ========================================
// QUERY WITH ULTIMATE SETTINGS
// ========================================

async function queryWithUltimateSettings(providers, messages) {
  let lastError = null;

  for (const provider of providers) {
    try {
      console.log(`🚀 Trying ${provider.name} with ULTIMATE settings...`);
      const result = await queryAIProvider(provider, messages);
      
      // Validate response completeness
      const codeBlocks = (result.answer.match(/```/g) || []).length / 2;
      const lineCount = result.answer.split('\n').length;
      
      console.log(`📊 Generated: ${codeBlocks} code blocks, ${lineCount} lines`);
      
      if (lineCount < 200 && codeBlocks < 2) {
        console.warn(`⚠️ Response too short, may not be complete`);
      }
      
      console.log(`✅ ${provider.name} succeeded - ULTIMATE quality`);
      return result;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
      lastError = error;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

async function queryAIProvider(provider, messages) {
  const requestBody = buildUltimateRequestBody(provider, messages);
  const headers = buildHeaders(provider);

  // EXTENDED TIMEOUT for comprehensive generation
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120s (2 minutes)

  try {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const answer = extractAnswer(provider, data);

    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response');
    }

    return {
      sourceName: provider.name,
      provider: provider.provider,
      model: provider.model,
      answer: answer.trim()
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Timeout after 2 minutes - code generation too complex');
    }
    throw error;
  }
}

function buildUltimateRequestBody(provider, messages) {
  const providerType = provider.provider.toLowerCase();

  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 32000, // MAXIMUM tokens for comprehensive code
      top_p: 0.95,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: false
    };
  }

  if (providerType === 'anthropic') {
    return {
      model: provider.model,
      messages: messages,
      max_tokens: 32000,
      temperature: 0.7
    };
  }

  if (providerType === 'huggingface') {
    const lastMessage = messages[messages.length - 1];
    return {
      inputs: lastMessage.content,
      parameters: {
        max_new_tokens: 16000,
        temperature: 0.7,
        return_full_text: false,
        do_sample: true
      }
    };
  }

  return { messages, max_tokens: 32000 };
}

// ========================================
// LANGUAGE DETECTION
// ========================================

function detectLanguage(text) {
  const indonesianWords = [
    'apa', 'bagaimana', 'buat', 'buatkan', 'tolong', 'saya', 'yang', 'dengan', 
    'untuk', 'dari', 'ini', 'itu', 'seperti', 'lengkap', 'mohon'
  ];
  
  const lowerText = text.toLowerCase();
  const count = indonesianWords.filter(w => lowerText.includes(w)).length;

  return count >= 2 ? 'indonesian' : 'english';
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function buildHeaders(provider) {
  const headers = { 'Content-Type': 'application/json' };
  const providerType = provider.provider.toLowerCase();

  if (providerType === 'groq' || providerType === 'openai') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (providerType === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://nextgenai.vercel.app';
    headers['X-Title'] = 'NextGenAI Ultimate Code Generator';
  }

  if (providerType === 'anthropic') {
    headers['x-api-key'] = provider.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  if (providerType === 'huggingface') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  return headers;
}

function extractAnswer(provider, data) {
  const providerType = provider.provider.toLowerCase();

  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return data.choices?.[0]?.message?.content || '';
  }

  if (providerType === 'anthropic') {
    return data.content?.[0]?.text || '';
  }

  if (providerType === 'huggingface') {
    if (Array.isArray(data)) {
      return data[0]?.generated_text || '';
    }
    return data.generated_text || '';
  }

  return data.response || data.output || data.text || '';
}

function getEnabledProviders(aiSources) {
  if (aiSources && Array.isArray(aiSources) && aiSources.length > 0) {
    return aiSources
      .filter(s => s.enabled && s.apiKey && s.apiKey.length > 5)
      .sort((a, b) => a.priority - b.priority);
  }

  return getDefaultProviders();
}

function getDefaultProviders() {
  const providers = [];

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: 'Groq (Llama 3.3 70B)',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      priority: 1,
      enabled: true
    });
  }

  return providers;
}
