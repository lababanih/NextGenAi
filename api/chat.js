// api/chat.js
// Comprehensive Multi-File Code Generation System
// Generates COMPLETE solutions with all necessary files

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

    console.log(`🧠 Comprehensive Code Generation Mode: ${enabledProviders.length} AI provider(s) ready`);

    // Detect user's language
    const userLanguage = detectLanguage(messages[messages.length - 1].content);
    console.log(`🌍 Detected language: ${userLanguage}`);

    // Analyze request complexity
    const complexity = analyzeRequestComplexity(messages[messages.length - 1].content);
    console.log(`📊 Request complexity: ${complexity.level} (${complexity.filesNeeded} files needed)`);

    // Create comprehensive system prompt
    const enhancedMessages = createComprehensivePrompt(messages, userLanguage, complexity);

    // SMART MODE: Multi-AI with comprehensive synthesis
    if (mode === 'smart' && enabledProviders.length > 1) {
      try {
        console.log('🧠 Comprehensive Smart Mode: Generating complete solution...');
        const responses = await queryMultipleAIs(enabledProviders, enhancedMessages);
        const synthesized = await comprehensiveSynthesis(responses, enhancedMessages, enabledProviders[0], userLanguage, complexity);
        
        return res.json({
          answer: synthesized.answer,
          mode: 'comprehensive-smart',
          sources: responses.map(r => r.sourceName),
          confidence: synthesized.confidence || 98,
          language: userLanguage,
          complexity: complexity.level,
          filesGenerated: complexity.filesNeeded
        });
      } catch (error) {
        console.error('⚠️ Smart mode failed, falling back:', error.message);
      }
    }

    // FAST MODE: Single AI with comprehensive prompting
    console.log('⚡ Comprehensive Fast Mode: Generating complete solution...');
    const result = await queryWithComprehensivePrompt(enabledProviders, enhancedMessages);
    
    return res.json({
      answer: result.answer,
      mode: 'comprehensive-fast',
      source: result.sourceName,
      confidence: 95,
      language: userLanguage,
      complexity: complexity.level
    });

  } catch (error) {
    console.error('❌ Comprehensive generation error:', error);
    return res.status(500).json({
      error: 'AI request failed',
      message: error.message
    });
  }
}

// ========================================
// REQUEST COMPLEXITY ANALYSIS
// ========================================

function analyzeRequestComplexity(text) {
  const lowerText = text.toLowerCase();
  
  // Count feature indicators
  let featureCount = 0;
  const features = [
    'dengan', 'with', 'include', 'including', 'termasuk',
    'feature', 'fitur', 'fungsi', 'function',
    'menu', 'button', 'tombol', 'panel',
    'system', 'sistem', 'module', 'modul'
  ];
  
  features.forEach(keyword => {
    if (lowerText.includes(keyword)) featureCount++;
  });

  // Count numbered lists (1., 2., 3., etc)
  const numberedLists = (text.match(/\d+\./g) || []).length;
  
  // Count bullet points
  const bulletPoints = (text.match(/[-•]\s/g) || []).length;
  
  // Detect comprehensive keywords
  const comprehensiveKeywords = [
    'complete', 'lengkap', 'full', 'penuh',
    'comprehensive', 'komprehensif', 'detailed', 'detail',
    'production', 'produksi', 'professional', 'profesional',
    'system', 'sistem', 'framework', 'struktur'
  ];
  
  const isComprehensive = comprehensiveKeywords.some(k => lowerText.includes(k));

  // Calculate complexity
  let totalScore = featureCount + numberedLists + bulletPoints;
  if (isComprehensive) totalScore += 5;

  // Determine files needed
  let filesNeeded = 1;
  let level = 'simple';

  if (totalScore >= 10) {
    filesNeeded = 5; // Main + 4 modules
    level = 'very-complex';
  } else if (totalScore >= 7) {
    filesNeeded = 4; // Main + 3 modules
    level = 'complex';
  } else if (totalScore >= 4) {
    filesNeeded = 3; // Main + 2 modules
    level = 'medium';
  } else if (totalScore >= 2) {
    filesNeeded = 2; // Main + 1 module
    level = 'basic';
  }

  return {
    level,
    filesNeeded,
    featureCount,
    isComprehensive,
    score: totalScore
  };
}

// ========================================
// COMPREHENSIVE SYSTEM PROMPT
// ========================================

function createComprehensivePrompt(messages, userLanguage, complexity) {
  const languageInstruction = userLanguage === 'indonesian' 
    ? `CRITICAL: User speaks Indonesian. You MUST:
- Respond in fluent, natural Bahasa Indonesia
- Write ALL code comments in Indonesian
- Use Indonesian in explanations
- Natural Indonesian phrases, not translated English`
    : 'Respond in clear, professional English with English code comments.';

  const comprehensiveInstructions = userLanguage === 'indonesian'
    ? `
# INSTRUKSI PENTING: GENERATE KODE LENGKAP

Kamu HARUS membuat solusi yang LENGKAP dan KOMPREHENSIF, TIDAK BOLEH hanya satu function!

## ATURAN WAJIB:

1. **Buat SEMUA File yang Dibutuhkan**
   ${complexity.filesNeeded === 1 ? '- Minimal 1 file lengkap dengan semua fungsi' : 
     `- Buat ${complexity.filesNeeded} file terpisah (main + ${complexity.filesNeeded - 1} modules)`}
   - Setiap file harus LENGKAP dan SIAP PAKAI
   - JANGAN hanya kasih contoh atau snippet
   - JANGAN kasih placeholder atau "// tambahkan sendiri"

2. **Struktur Kode Profesional**
   - Pisahkan logic ke multiple modules (jika kompleks)
   - Setiap module fokus pada satu tanggung jawab
   - Clear separation of concerns
   - Mudah di-maintain dan di-extend

3. **Kelengkapan Wajib**
   - Import/require statements LENGKAP
   - Semua fungsi di-implementasi PENUH (bukan TODO)
   - Error handling di SEMUA fungsi
   - Input validation
   - Edge case handling
   - Configuration constants
   - Helper functions

4. **Dokumentasi Lengkap**
   - Header setiap file dengan deskripsi
   - Komentar untuk setiap fungsi (purpose, params, returns)
   - Usage examples
   - Setup instructions
   - Dependencies list

5. **Format Output**
   Untuk SETIAP file, gunakan format:

   \`\`\`filename.ext
   -- =====================================
   -- NAMA FILE: filename.ext
   -- DESKRIPSI: [jelaskan fungsi file ini]
   -- DEPENDENCIES: [list dependencies]
   -- =====================================

   [KODE LENGKAP DI SINI - JANGAN POTONG!]
   
   -- =====================================
   -- USAGE EXAMPLE:
   -- [contoh cara pakai]
   -- =====================================
   \`\`\`

## CONTOH YANG BENAR:

❌ SALAH (Terlalu Singkat):
\`\`\`lua
function AdminPanel:IsAdmin(player)
    -- cek admin
    return false
end
\`\`\`

✅ BENAR (Lengkap & Komprehensif):

**FILE 1: AdminConfig.lua**
\`\`\`lua
-- =====================================
-- KONFIGURASI ADMIN PANEL
-- File ini berisi semua konfigurasi admin
-- =====================================

local AdminConfig = {}

-- Daftar admin dengan role
AdminConfig.Admins = {
    ["Username1"] = {Role = "Owner", GroupId = 123456, MinRank = 255},
    ["Username2"] = {Role = "Admin", GroupId = 123456, MinRank = 200}
}

-- Permission settings
AdminConfig.Permissions = {
    Owner = {"kick", "ban", "teleport", "announce", "shutdown"},
    Admin = {"kick", "teleport", "mute"}
}

return AdminConfig
\`\`\`

**FILE 2: AdminPanel.lua** (300+ lines)
\`\`\`lua
-- =====================================
-- ADMIN PANEL MAIN MODULE
-- Module utama yang handle semua fitur admin
-- DEPENDENCIES: AdminConfig.lua
-- =====================================

local AdminConfig = require(script.Parent.AdminConfig)
local Players = game:GetService("Players")

local AdminPanel = {}

-- [IMPLEMENTASI LENGKAP 300+ BARIS]
-- Semua fungsi: IsAdmin, KickPlayer, BanPlayer, etc
-- Error handling lengkap
-- Input validation
-- UI creation
-- Event handlers

return AdminPanel
\`\`\`

**FILE 3: AdminUI.lua** (200+ lines)
\`\`\`lua
-- =====================================
-- ADMIN UI CREATOR
-- Membuat GUI admin panel
-- =====================================

[KODE LENGKAP UNTUK UI]
\`\`\`

## RULES TAMBAHAN:

- JANGAN pernah bilang "sisanya sama seperti sebelumnya"
- JANGAN kasih "..." atau "// kode lainnya"
- JANGAN potong kode di tengah-tengah
- TULIS SEMUA KODE SAMPAI SELESAI
- Jika user minta "lengkap", berikan SEMUA file yang dibutuhkan
- Jika user minta "seperti kamu", berikan kualitas seperti Claude/GPT-4

INGAT: User mau COPY-PASTE langsung ke project mereka!
Buat kode yang 100% siap pakai tanpa perlu modifikasi!`
    : `
# CRITICAL INSTRUCTION: GENERATE COMPLETE CODE

You MUST create COMPREHENSIVE and COMPLETE solutions, NOT just one function!

## MANDATORY RULES:

1. **Create ALL Required Files**
   ${complexity.filesNeeded === 1 ? '- Minimum 1 complete file with all functions' : 
     `- Create ${complexity.filesNeeded} separate files (main + ${complexity.filesNeeded - 1} modules)`}
   - Each file must be COMPLETE and PRODUCTION-READY
   - NO examples or snippets only
   - NO placeholders or "// add yourself"

2. **Professional Code Structure**
   - Separate logic into multiple modules (if complex)
   - Each module focuses on one responsibility
   - Clear separation of concerns
   - Easy to maintain and extend

3. **Completeness Required**
   - FULL import/require statements
   - ALL functions fully implemented (not TODO)
   - Error handling in ALL functions
   - Input validation
   - Edge case handling
   - Configuration constants
   - Helper functions

4. **Complete Documentation**
   - File headers with description
   - Comments for each function (purpose, params, returns)
   - Usage examples
   - Setup instructions
   - Dependencies list

5. **Output Format**
   For EACH file, use format:

   \`\`\`filename.ext
   // =====================================
   // FILE: filename.ext
   // DESCRIPTION: [explain file purpose]
   // DEPENDENCIES: [list dependencies]
   // =====================================

   [COMPLETE CODE HERE - DON'T CUT!]
   
   // =====================================
   // USAGE EXAMPLE:
   // [how to use]
   // =====================================
   \`\`\`

## EXAMPLE OF CORRECT APPROACH:

❌ WRONG (Too Brief):
\`\`\`lua
function AdminPanel:IsAdmin(player)
    -- check admin
    return false
end
\`\`\`

✅ CORRECT (Complete & Comprehensive):

**FILE 1: AdminConfig.lua**
\`\`\`lua
-- =====================================
-- ADMIN PANEL CONFIGURATION
-- Contains all admin configurations
-- =====================================

local AdminConfig = {}

-- Admin list with roles
AdminConfig.Admins = {
    ["Username1"] = {Role = "Owner", GroupId = 123456, MinRank = 255},
    ["Username2"] = {Role = "Admin", GroupId = 123456, MinRank = 200}
}

-- Permission settings
AdminConfig.Permissions = {
    Owner = {"kick", "ban", "teleport", "announce", "shutdown"},
    Admin = {"kick", "teleport", "mute"}
}

return AdminConfig
\`\`\`

**FILE 2: AdminPanel.lua** (300+ lines)
\`\`\`lua
-- =====================================
-- ADMIN PANEL MAIN MODULE
-- Main module handling all admin features
-- DEPENDENCIES: AdminConfig.lua
-- =====================================

local AdminConfig = require(script.Parent.AdminConfig)
local Players = game:GetService("Players")

local AdminPanel = {}

-- [COMPLETE IMPLEMENTATION 300+ LINES]
-- All functions: IsAdmin, KickPlayer, BanPlayer, etc
-- Complete error handling
-- Input validation
-- UI creation
-- Event handlers

return AdminPanel
\`\`\`

**FILE 3: AdminUI.lua** (200+ lines)
\`\`\`lua
-- =====================================
-- ADMIN UI CREATOR
-- Creates admin panel GUI
-- =====================================

[COMPLETE UI CODE]
\`\`\`

## ADDITIONAL RULES:

- NEVER say "rest is same as before"
- NEVER use "..." or "// other code"
- NEVER cut code in the middle
- WRITE ALL CODE UNTIL COMPLETE
- If user asks "complete", provide ALL needed files
- If user asks "like you", provide Claude/GPT-4 quality

REMEMBER: User wants to COPY-PASTE directly into their project!
Create code that's 100% ready to use without modifications!`;

  const superPrompt = {
    role: 'system',
    content: `You are NextGenAI - a superintelligent coding assistant that generates COMPLETE, PRODUCTION-READY solutions.

${languageInstruction}

${comprehensiveInstructions}

# CORE PROGRAMMING EXPERTISE

You are EXPERT in ALL programming languages:
- **Roblox**: Lua, ModuleScripts, RemoteEvents, DataStore, GUI
- **Web**: HTML, CSS, JavaScript, React, Vue, Node.js, Express
- **Backend**: Python, Java, C#, Go, PHP, Ruby
- **Mobile**: React Native, Flutter, Swift, Kotlin
- **Data**: Python (Pandas, NumPy), R, SQL
- **Systems**: C, C++, Rust

# CODE GENERATION PHILOSOPHY

**Think like a senior developer creating a real production system:**

1. **Architecture First**: Plan the structure before coding
2. **Modularity**: Break complex systems into manageable modules
3. **Error Handling**: Every function handles errors gracefully
4. **Input Validation**: Validate all inputs before processing
5. **Security**: Consider security implications
6. **Performance**: Write efficient, optimized code
7. **Maintainability**: Code should be easy to understand and modify
8. **Documentation**: Every file and function is documented
9. **Testing**: Code should be testable
10. **Best Practices**: Follow language-specific conventions

# QUALITY STANDARDS

Your code must meet these standards:
- ✅ **Complete**: No TODO, no placeholders, no "add yourself"
- ✅ **Working**: Can be copy-pasted and used immediately
- ✅ **Professional**: Production-ready quality
- ✅ **Documented**: Clear comments and documentation
- ✅ **Robust**: Handles errors and edge cases
- ✅ **Efficient**: Optimized for performance
- ✅ **Maintainable**: Easy to read and modify
- ✅ **Secure**: No obvious security vulnerabilities

# RESPONSE STRUCTURE

For ${complexity.level} requests (${complexity.filesNeeded} files needed):

${complexity.filesNeeded > 1 ? `
1. Start with overview of files
2. Provide each file in separate code blocks
3. Include setup/installation instructions
4. Provide usage examples
5. List dependencies
` : `
1. Provide complete single-file solution
2. Include all necessary functions
3. Add usage examples
4. Document dependencies
`}

Remember: Users want COMPLETE solutions they can use immediately, not teaching examples or snippets!`
  };

  return [superPrompt, ...messages];
}

// ========================================
// COMPREHENSIVE SYNTHESIS
// ========================================

async function comprehensiveSynthesis(responses, originalMessages, primaryProvider, userLanguage, complexity) {
  if (responses.length === 1) {
    return {
      answer: responses[0].answer,
      confidence: 90
    };
  }

  console.log('🔮 Comprehensive synthesis: Combining multiple perspectives...');

  const responsesText = responses.map((r, i) => 
    `[AI ${i+1}: ${r.sourceName}]\n${r.answer}`
  ).join('\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n');

  const userQuery = originalMessages[originalMessages.length - 1].content;

  const languageInstruction = userLanguage === 'indonesian'
    ? `WAJIB: Jawab dalam Bahasa Indonesia. SEMUA komentar kode harus Bahasa Indonesia.
    
Jika ada multiple AI yang kasih kode berbeda, GABUNGKAN menjadi solusi TERBAIK:
- Ambil struktur terbaik dari AI 1
- Ambil error handling dari AI 2  
- Ambil best practices dari AI 3
- Kombinasikan menjadi SATU SOLUSI SUPERIOR

PENTING: Jangan cuma copy-paste dari satu AI. GABUNGKAN yang terbaik dari semua!`
    : `REQUIRED: Respond in English. ALL code comments must be in English.

If multiple AIs provided different code, COMBINE into BEST solution:
- Take best structure from AI 1
- Take error handling from AI 2
- Take best practices from AI 3
- Combine into ONE SUPERIOR SOLUTION

IMPORTANT: Don't just copy-paste from one AI. COMBINE the best from all!`;

  const synthesisPrompt = {
    role: 'user',
    content: `You are a master code synthesizer. Multiple AI models provided solutions.

${languageInstruction}

ORIGINAL REQUEST:
${userQuery}

SOLUTIONS FROM MULTIPLE AIs:
${responsesText}

YOUR TASK:
Create the ULTIMATE solution by:

1. **Analyze All Solutions**:
   - Which has best architecture?
   - Which has best error handling?
   - Which has most complete features?
   - Which has best documentation?

2. **Synthesize Best Elements**:
   - Combine best architecture from all
   - Merge all useful features
   - Include all error handling
   - Use most efficient algorithms
   - Keep best coding practices

3. **Create ${complexity.filesNeeded} Complete Files**:
   ${complexity.filesNeeded > 1 ? `
   - Main file with core logic
   - ${complexity.filesNeeded - 1} supporting modules
   - Each file 100% complete
   - No placeholders or TODOs
   ` : '- One complete file with all functions'}

4. **Ensure Quality**:
   - Production-ready code
   - Complete error handling
   - Full documentation
   - Usage examples
   - Ready to copy-paste

CRITICAL: Output COMPLETE CODE. Don't say "combine solutions above" - actually write the combined code in full!

The result must be BETTER than any individual AI's solution.`
  };

  try {
    const result = await queryAIProvider(primaryProvider, [synthesisPrompt]);
    
    return {
      answer: result.answer,
      confidence: 98,
      synthesizedFrom: responses.map(r => r.sourceName)
    };
  } catch (error) {
    console.error('⚠️ Synthesis failed:', error.message);
    
    // Fallback: Select most comprehensive response
    const bestResponse = responses.reduce((best, current) => {
      const currentScore = calculateComprehensiveness(current.answer);
      const bestScore = calculateComprehensiveness(best.answer);
      return currentScore > bestScore ? current : best;
    });
    
    return {
      answer: bestResponse.answer,
      confidence: 85
    };
  }
}

function calculateComprehensiveness(answer) {
  let score = 0;
  
  // Prefer longer responses
  score += answer.length / 10;
  
  // Count code blocks (each block = separate file)
  const codeBlocks = (answer.match(/```/g) || []).length / 2;
  score += codeBlocks * 1000; // Heavily reward multiple files
  
  // Count functions
  const functions = (answer.match(/function /g) || []).length;
  score += functions * 200;
  
  // Count comments
  const comments = (answer.match(/--|\/{2,}|\/\*|\#/g) || []).length;
  score += comments * 30;
  
  // Reward file headers
  if (answer.includes('FILE:') || answer.includes('NAMA FILE:')) score += 500;
  
  // Reward completeness indicators
  if (answer.includes('complete') || answer.includes('lengkap')) score += 300;
  if (answer.includes('production') || answer.includes('produksi')) score += 300;
  
  return score;
}

// ========================================
// LANGUAGE DETECTION
// ========================================

function detectLanguage(text) {
  const indonesianWords = [
    'apa', 'bagaimana', 'buat', 'buatkan', 'tolong', 'saya', 'yang', 'dengan', 
    'untuk', 'dari', 'ini', 'itu', 'ada', 'tidak', 'ya', 'kamu', 'dia',
    'bisa', 'mau', 'ingin', 'mohon', 'lengkap', 'seperti'
  ];
  
  const lowerText = text.toLowerCase();
  const indonesianCount = indonesianWords.filter(word => 
    lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `) || lowerText.endsWith(` ${word}`)
  ).length;

  return indonesianCount >= 2 ? 'indonesian' : 'english';
}

// ========================================
// AI QUERYING (Same as before)
// ========================================

async function queryMultipleAIs(providers, messages) {
  const selectedProviders = providers.slice(0, 3);
  
  const queries = selectedProviders.map(provider => 
    queryAIProvider(provider, messages)
      .then(result => {
        console.log(`✅ ${provider.name} completed`);
        return result;
      })
      .catch(error => {
        console.error(`❌ ${provider.name} failed:`, error.message);
        return null;
      })
  );

  const results = await Promise.all(queries);
  const validResults = results.filter(r => r !== null);

  if (validResults.length === 0) {
    throw new Error('All AI providers failed');
  }

  return validResults;
}

async function queryWithComprehensivePrompt(providers, messages) {
  let lastError = null;

  for (const provider of providers) {
    try {
      console.log(`🔄 Trying ${provider.name}...`);
      const result = await queryAIProvider(provider, messages);
      console.log(`✅ ${provider.name} succeeded`);
      return result;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
      lastError = error;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

async function queryAIProvider(provider, messages) {
  const requestBody = buildRequestBody(provider, messages);
  const headers = buildHeaders(provider);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s for comprehensive code

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
      throw new Error('Timeout after 90s');
    }
    throw error;
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function buildRequestBody(provider, messages) {
  const providerType = provider.provider.toLowerCase();

  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 16000, // Maximum for comprehensive code
      top_p: 0.95,
      stream: false
    };
  }

  if (providerType === 'anthropic') {
    return {
      model: provider.model,
      messages: messages,
      max_tokens: 16000,
      temperature: 0.7
    };
  }

  if (providerType === 'huggingface') {
    const lastMessage = messages[messages.length - 1];
    return {
      inputs: lastMessage.content,
      parameters: {
        max_new_tokens: 8000,
        temperature: 0.7,
        return_full_text: false
      }
    };
  }

  return { messages, max_tokens: 16000 };
}

function buildHeaders(provider) {
  const headers = { 'Content-Type': 'application/json' };
  const providerType = provider.provider.toLowerCase();

  if (providerType === 'groq' || providerType === 'openai') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (providerType === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://nextgenai.vercel.app';
    headers['X-Title'] = 'NextGenAI Comprehensive Code Generator';
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
