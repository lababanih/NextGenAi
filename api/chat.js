// api/chat.js
// ULTIMATE UNLIMITED TOKEN SYSTEM
// Automatically handles ANY complexity with smart routing
// FREE (Groq 32K) + FREE Backup (Gemini 2M) + Premium (Claude 200K)

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
    const { messages, aiSources } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Get providers and enhance with model capabilities
    let providers = getEnabledProviders(aiSources);
    providers = providers.map(p => enhanceProviderInfo(p));

    if (providers.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured',
        message: 'Please add at least one API key in admin panel'
      });
    }

    console.log(`🚀 ULTIMATE System initialized with ${providers.length} provider(s)`);

    // Detect language
    const userLanguage = detectLanguage(messages[messages.length - 1].content);
    
    // Analyze complexity deeply
    const analysis = analyzeComplexityDeep(messages[messages.length - 1].content);
    
    console.log(`📊 Analysis:
    - Complexity: ${analysis.level}
    - Files needed: ${analysis.filesNeeded}
    - Estimated tokens: ${analysis.estimatedTokens}
    - Estimated lines: ${analysis.estimatedLines}`);

    // Select optimal strategy
    const strategy = selectOptimalStrategy(providers, analysis);
    
    console.log(`🎯 Selected strategy: ${strategy.name}
    - Model: ${strategy.model.name} (${strategy.model.maxTokens} tokens)
    - Approach: ${strategy.approach}
    - Turns: ${strategy.turns || 1}`);

    // Create enhanced prompt
    const enhancedMessages = createUltimatePrompt(
      messages, 
      userLanguage, 
      analysis,
      strategy
    );

    // Execute strategy
    const result = await executeStrategy(strategy, enhancedMessages, providers);
    
    console.log(`✅ Generation complete:
    - Output tokens: ${result.tokensGenerated}
    - Output lines: ${result.linesGenerated}
    - Time: ${result.duration}ms
    - Cost: $${result.cost.toFixed(4)}`);

    return res.json({
      answer: result.answer,
      metadata: {
        strategy: strategy.name,
        model: strategy.model.name,
        tokensGenerated: result.tokensGenerated,
        linesGenerated: result.linesGenerated,
        confidence: result.confidence,
        duration: result.duration,
        cost: result.cost,
        language: userLanguage,
        complexity: analysis.level
      }
    });

  } catch (error) {
    console.error('❌ Ultimate system error:', error);
    return res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
}

// ========================================
// DEEP COMPLEXITY ANALYSIS
// ========================================

function analyzeComplexityDeep(text) {
  const lowerText = text.toLowerCase();
  
  // Detect explicit file requests
  const fileMatch = text.match(/(\d+)\s*(file|files|modul)/i);
  const explicitFiles = fileMatch ? parseInt(fileMatch[1]) : 0;
  
  // Count features/requirements
  const numberedItems = (text.match(/\d+\./g) || []).length;
  const bulletPoints = (text.match(/[-•*]\s/g) || []).length;
  
  // Detect comprehensive keywords
  const comprehensiveKeywords = [
    'lengkap', 'complete', 'full', 'penuh',
    'seperti', 'like', 'kohl', 'claude', 'sonnet',
    'production', 'produksi', 'professional', 'profesional',
    'system', 'sistem', 'framework'
  ];
  const comprehensiveScore = comprehensiveKeywords.filter(k => lowerText.includes(k)).length;
  
  // Detect feature keywords
  const featureKeywords = ['dengan', 'with', 'include', 'termasuk', 'fitur', 'feature'];
  const featureScore = featureKeywords.filter(k => lowerText.includes(k)).length;
  
  // Calculate files needed
  let filesNeeded = 1;
  
  if (explicitFiles > 0) {
    filesNeeded = explicitFiles;
  } else if (comprehensiveScore >= 2 || numberedItems >= 5) {
    filesNeeded = 5;
  } else if (comprehensiveScore >= 1 || numberedItems >= 3) {
    filesNeeded = 3;
  } else if (featureScore >= 2 || bulletPoints >= 3) {
    filesNeeded = 2;
  }
  
  // Estimate lines per file
  const linesPerFile = filesNeeded <= 1 ? 150 : 
                       filesNeeded <= 2 ? 250 :
                       filesNeeded <= 3 ? 300 :
                       filesNeeded <= 5 ? 280 : 250;
  
  const estimatedLines = filesNeeded * linesPerFile;
  
  // Estimate tokens (1 line ≈ 25 tokens average)
  const estimatedTokens = estimatedLines * 25 + 2000; // +2000 for instructions
  
  // Determine complexity level
  let level = 'simple';
  if (estimatedTokens > 60000) level = 'extreme';
  else if (estimatedTokens > 35000) level = 'very-complex';
  else if (estimatedTokens > 15000) level = 'complex';
  else if (estimatedTokens > 6000) level = 'medium';
  else if (estimatedTokens > 2000) level = 'basic';
  
  return {
    level,
    filesNeeded,
    estimatedLines,
    estimatedTokens,
    comprehensiveScore,
    featureCount: numberedItems + bulletPoints
  };
}

// ========================================
// PROVIDER INFO ENHANCEMENT
// ========================================

function enhanceProviderInfo(provider) {
  const enhanced = { ...provider };
  
  // Get model capabilities
  const capabilities = getModelCapabilities(provider.provider, provider.model);
  
  enhanced.maxTokens = capabilities.maxTokens;
  enhanced.costPerToken = capabilities.costPerToken;
  enhanced.speed = capabilities.speed;
  enhanced.quality = capabilities.quality;
  
  return enhanced;
}

function getModelCapabilities(provider, model) {
  const capabilities = {
    // Groq models (FREE, FAST)
    'llama-3.3-70b-versatile': {
      maxTokens: 32000,
      costPerToken: 0,
      speed: 'very-fast',
      quality: 'high'
    },
    'llama-3.1-70b-versatile': {
      maxTokens: 8000,
      costPerToken: 0,
      speed: 'very-fast',
      quality: 'high'
    },
    
    // Google models (FREE, SLOW, HUGE CAPACITY)
    'gemini-1.5-pro': {
      maxTokens: 2000000,
      costPerToken: 0,
      speed: 'slow',
      quality: 'very-high'
    },
    'gemini-1.5-flash': {
      maxTokens: 1000000,
      costPerToken: 0,
      speed: 'medium',
      quality: 'high'
    },
    
    // OpenRouter models (PAID, HIGH QUALITY)
    'openai/gpt-4-turbo': {
      maxTokens: 128000,
      costPerToken: 0.00001,
      speed: 'fast',
      quality: 'very-high'
    },
    'anthropic/claude-3.5-sonnet': {
      maxTokens: 200000,
      costPerToken: 0.000003,
      speed: 'fast',
      quality: 'excellent'
    },
    'anthropic/claude-3-opus': {
      maxTokens: 200000,
      costPerToken: 0.000015,
      speed: 'medium',
      quality: 'excellent'
    },
    'openai/gpt-3.5-turbo': {
      maxTokens: 16385,
      costPerToken: 0.0000005,
      speed: 'very-fast',
      quality: 'good'
    }
  };
  
  // Try exact match
  if (capabilities[model]) {
    return capabilities[model];
  }
  
  // Default by provider
  const defaults = {
    'groq': { maxTokens: 8000, costPerToken: 0, speed: 'very-fast', quality: 'high' },
    'openrouter': { maxTokens: 8000, costPerToken: 0.000001, speed: 'medium', quality: 'high' },
    'google': { maxTokens: 32000, costPerToken: 0, speed: 'medium', quality: 'high' }
  };
  
  return defaults[provider] || { maxTokens: 4096, costPerToken: 0.000001, speed: 'medium', quality: 'medium' };
}

// ========================================
// STRATEGY SELECTION
// ========================================

function selectOptimalStrategy(providers, analysis) {
  const tokensNeeded = analysis.estimatedTokens;
  
  // Sort providers by capability
  const sortedProviders = providers.sort((a, b) => {
    // Prioritize free first, then capacity
    if (a.costPerToken === 0 && b.costPerToken > 0) return -1;
    if (a.costPerToken > 0 && b.costPerToken === 0) return 1;
    return b.maxTokens - a.maxTokens;
  });
  
  // Find suitable single-turn model
  const singleTurnModel = sortedProviders.find(p => p.maxTokens >= tokensNeeded * 1.2);
  
  if (singleTurnModel) {
    return {
      name: 'single-turn-high-capacity',
      approach: 'single-turn',
      model: singleTurnModel,
      turns: 1,
      costEstimate: tokensNeeded * singleTurnModel.costPerToken
    };
  }
  
  // No single model can handle? Use multi-turn with best model
  const bestModel = sortedProviders[0];
  const turns = Math.ceil(tokensNeeded / (bestModel.maxTokens * 0.9)); // 90% utilization
  
  return {
    name: 'multi-turn-chunked',
    approach: 'multi-turn',
    model: bestModel,
    turns,
    costEstimate: tokensNeeded * bestModel.costPerToken * turns
  };
}

// ========================================
// STRATEGY EXECUTION
// ========================================

async function executeStrategy(strategy, messages, providers) {
  const startTime = Date.now();
  
  let result;
  
  if (strategy.approach === 'single-turn') {
    result = await executeSingleTurn(strategy, messages);
  } else {
    result = await executeMultiTurn(strategy, messages);
  }
  
  const duration = Date.now() - startTime;
  const tokensGenerated = estimateTokens(result.answer);
  const linesGenerated = result.answer.split('\n').length;
  const cost = tokensGenerated * strategy.model.costPerToken;
  
  return {
    answer: result.answer,
    tokensGenerated,
    linesGenerated,
    duration,
    cost,
    confidence: result.confidence
  };
}

async function executeSingleTurn(strategy, messages) {
  console.log(`⚡ Single-turn generation with ${strategy.model.name}...`);
  
  const result = await queryAIProvider(strategy.model, messages);
  
  return {
    answer: result.answer,
    confidence: 98
  };
}

async function executeMultiTurn(strategy, messages) {
  console.log(`📚 Multi-turn generation (${strategy.turns} turns) with ${strategy.model.name}...`);
  
  const originalPrompt = messages[messages.length - 1].content;
  const systemPrompt = messages.find(m => m.role === 'system');
  
  const parts = [];
  const filesPerTurn = Math.ceil(strategy.model.maxTokens / 10000); // Rough estimate
  
  for (let turn = 0; turn < strategy.turns; turn++) {
    const turnStart = turn * filesPerTurn + 1;
    const turnEnd = Math.min((turn + 1) * filesPerTurn, 999);
    
    console.log(`  Turn ${turn + 1}/${strategy.turns}: Generating content part ${turn + 1}...`);
    
    // Create turn-specific prompt
    const turnPrompt = {
      role: 'user',
      content: turn === 0 ? 
        originalPrompt + `\n\n[Generate first part completely]` :
        `Continue from previous response. Generate next part completely.\n\nPrevious output:\n${parts[parts.length - 1].substring(parts[parts.length - 1].length - 500)}\n\n[Continue and complete remaining content]`
    };
    
    const turnMessages = systemPrompt ? [systemPrompt, turnPrompt] : [turnPrompt];
    
    try {
      const result = await queryAIProvider(strategy.model, turnMessages);
      parts.push(result.answer);
      
      console.log(`  ✅ Turn ${turn + 1} complete (${estimateTokens(result.answer)} tokens)`);
      
      // Check if generation seems complete
      if (detectCompleteness(result.answer) && turn < strategy.turns - 1) {
        console.log(`  ℹ️ Generation appears complete at turn ${turn + 1}, stopping early`);
        break;
      }
    } catch (error) {
      console.error(`  ❌ Turn ${turn + 1} failed:`, error.message);
      if (parts.length === 0) throw error;
      break; // Use what we have so far
    }
  }
  
  // Combine all parts
  const combined = parts.join('\n\n');
  
  return {
    answer: combined,
    confidence: 95
  };
}

function detectCompleteness(text) {
  // Check for completion markers
  const completionMarkers = [
    'setup instructions',
    'usage example',
    'customization',
    'installation',
    'readme',
    'that\'s it',
    'you\'re done',
    'selesai',
    'demikian',
    'semoga membantu'
  ];
  
  const lowerText = text.toLowerCase();
  const hasMarkers = completionMarkers.filter(m => lowerText.includes(m)).length >= 2;
  
  // Check for multiple complete code blocks
  const codeBlocks = (text.match(/```/g) || []).length / 2;
  const hasMultipleFiles = codeBlocks >= 3;
  
  return hasMarkers && hasMultipleFiles;
}

// ========================================
// ULTIMATE PROMPT CREATION
// ========================================

function createUltimatePrompt(messages, userLanguage, analysis, strategy) {
  const isIndonesian = userLanguage === 'indonesian';
  
  const prompt = {
    role: 'system',
    content: `You are Claude Sonnet 4.5 - the world's most advanced coding assistant.

${isIndonesian ? `
# INSTRUKSI ULTRA-KRITIS

## Target Output:
- **${analysis.filesNeeded} files** LENGKAP
- **${analysis.estimatedLines} lines** total code
- **${analysis.estimatedTokens} tokens** output
${strategy.approach === 'multi-turn' ? `
- **Multi-turn generation** (part ${strategy.turns > 1 ? '1 of ' + strategy.turns : '1'})`
: ''}

## ATURAN MUTLAK:

### 1. COMPLETENESS (100%)
SETIAP file HARUS:
✅ 100% implemented (NO placeholders)
✅ ALL functions FULLY coded
✅ COMPLETE error handling
✅ COMPLETE input validation
✅ COMPLETE documentation
✅ Usage examples included

DILARANG:
❌ "Tambahkan sendiri"
❌ "..." atau "etc"
❌ "TODO" comments
❌ "Sisanya sama"
❌ Cutting code mid-function

### 2. QUALITY STANDARDS

Setiap baris code HARUS:
- Production-ready
- Best practices
- Security conscious
- Performance optimized
- Well documented (Bahasa Indonesia)
- Properly formatted

### 3. FILE STRUCTURE

${analysis.filesNeeded === 1 ? `
Generate 1 MASSIVE complete file dengan semua fungsi.
` : analysis.filesNeeded <= 3 ? `
Generate ${analysis.filesNeeded} files:
1. Config/Constants
2. Core Logic (LARGEST)
3. UI/Helper Functions
` : `
Generate ${analysis.filesNeeded} files:
1. Config Module (100-150 lines)
2. Core Logic (300-400 lines)
3. UI Module (250-300 lines)
4. Commands/Handlers (200-250 lines)
5. Main Orchestrator (150-200 lines)
`}

### 4. OUTPUT FORMAT

Untuk SETIAP file:

\`\`\`lua
-- =====================================
-- FILE: [nama].lua
-- DESKRIPSI: [jelaskan detail]
-- DEPENDENCIES: [list semua]
-- AUTHOR: NextGenAI
-- =====================================

[FULL IMPLEMENTATION - JANGAN POTONG!]

-- =====================================
-- USAGE EXAMPLE:
-- [contoh lengkap]
-- =====================================

return Module
\`\`\`

### 5. MINDSET

Bayangkan user adalah:
- Senior developer yang sibuk
- Butuh code production-ready SEKARANG
- Tidak punya waktu debug atau tambah kode
- Expect quality seperti membeli premium code

Deliver EXACTLY what Claude Sonnet 4.5 delivers!

` : `
# ULTRA-CRITICAL INSTRUCTIONS

## Target Output:
- **${analysis.filesNeeded} files** COMPLETE
- **${analysis.estimatedLines} lines** total code
- **${analysis.estimatedTokens} tokens** output
${strategy.approach === 'multi-turn' ? `
- **Multi-turn generation** (part ${strategy.turns > 1 ? '1 of ' + strategy.turns : '1'})`
: ''}

## ABSOLUTE RULES:

### 1. COMPLETENESS (100%)
EVERY file MUST:
✅ 100% implemented (NO placeholders)
✅ ALL functions FULLY coded
✅ COMPLETE error handling
✅ COMPLETE input validation
✅ COMPLETE documentation
✅ Usage examples included

FORBIDDEN:
❌ "Add yourself"
❌ "..." or "etc"
❌ "TODO" comments
❌ "Rest is similar"
❌ Cutting code mid-function

### 2. QUALITY STANDARDS

Every line MUST be:
- Production-ready
- Best practices
- Security conscious
- Performance optimized
- Well documented (English)
- Properly formatted

### 3. FILE STRUCTURE

${analysis.filesNeeded === 1 ? `
Generate 1 MASSIVE complete file with all functions.
` : analysis.filesNeeded <= 3 ? `
Generate ${analysis.filesNeeded} files:
1. Config/Constants
2. Core Logic (LARGEST)
3. UI/Helper Functions
` : `
Generate ${analysis.filesNeeded} files:
1. Config Module (100-150 lines)
2. Core Logic (300-400 lines)
3. UI Module (250-300 lines)
4. Commands/Handlers (200-250 lines)
5. Main Orchestrator (150-200 lines)
`}

### 4. OUTPUT FORMAT

For EVERY file:

\`\`\`lua
-- =====================================
-- FILE: [name].lua
-- DESCRIPTION: [detailed]
-- DEPENDENCIES: [list all]
-- AUTHOR: NextGenAI
-- =====================================

[FULL IMPLEMENTATION - DON'T CUT!]

-- =====================================
-- USAGE EXAMPLE:
-- [complete example]
-- =====================================

return Module
\`\`\`

### 5. MINDSET

Imagine user is:
- Senior developer who's busy
- Needs production-ready code NOW
- No time to debug or add code
- Expects quality like buying premium code

Deliver EXACTLY what Claude Sonnet 4.5 delivers!
`}

## MODEL CAPABILITIES
- max_tokens: ${strategy.model.maxTokens}
- Your output target: ${analysis.estimatedTokens} tokens
- Quality: ${strategy.model.quality}

USE FULL CAPACITY! Generate ${analysis.estimatedLines}+ lines of COMPLETE code!`
  };
  
  return [prompt, ...messages];
}

// ========================================
// AI PROVIDER QUERY
// ========================================

async function queryAIProvider(provider, messages) {
  const requestBody = {
    model: provider.model,
    messages: messages,
    temperature: 0.7,
    max_tokens: Math.floor(provider.maxTokens * 0.95), // Use 95% of capacity
    top_p: 0.95,
    stream: false
  };
  
  const headers = buildHeaders(provider);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3 min for large generation

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
      throw new Error(`${provider.name} error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const answer = extractAnswer(provider, data);

    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response');
    }

    return {
      answer: answer.trim()
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Timeout after 3 minutes');
    }
    throw error;
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function detectLanguage(text) {
  const indonesianWords = ['apa', 'bagaimana', 'buat', 'buatkan', 'tolong', 'saya', 'dengan', 'untuk', 'seperti', 'lengkap'];
  const lowerText = text.toLowerCase();
  const count = indonesianWords.filter(w => lowerText.includes(w)).length;
  return count >= 2 ? 'indonesian' : 'english';
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function buildHeaders(provider) {
  const headers = { 'Content-Type': 'application/json' };
  const providerType = provider.provider.toLowerCase();

  if (providerType === 'groq' || providerType === 'openai') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (providerType === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://next-gen-ai-azure.vercel.app/';
    headers['X-Title'] = 'NextGenAI Ultimate Unlimited';
  }

  if (providerType === 'google') {
    headers['x-goog-api-key'] = provider.apiKey;
  }

  return headers;
}

function extractAnswer(provider, data) {
  const providerType = provider.provider.toLowerCase();

  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return data.choices?.[0]?.message?.content || '';
  }

  if (providerType === 'google') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  return data.response || data.output || '';
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

  // Groq (FREE, 32K)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: 'Groq Llama 3.3 70B',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      priority: 1,
      enabled: true
    });
  }

  // Google Gemini (FREE, 2M tokens!)
  if (process.env.GOOGLE_API_KEY) {
    providers.push({
      name: 'Google Gemini 1.5 Pro',
      provider: 'google',
      model: 'gemini-1.5-pro',
      apiKey: process.env.GOOGLE_API_KEY,
      endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      priority: 2,
      enabled: true
    });
  }

  return providers;
}
