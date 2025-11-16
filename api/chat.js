// api/chat.js
// Hybrid Strategy: Smart model routing + Multi-API key load balancing
// Automatically selects best model based on complexity

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

    // Get all configured providers
    let allProviders = getEnabledProviders(aiSources);

    if (allProviders.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured'
      });
    }

    console.log(`🎯 Available providers: ${allProviders.length}`);

    // Detect language & analyze complexity
    const userLanguage = detectLanguage(messages[messages.length - 1].content);
    const complexity = analyzeComplexity(messages[messages.length - 1].content);
    
    console.log(`📊 Complexity: ${complexity.level}, Estimated tokens needed: ${complexity.tokensNeeded}`);

    // SMART ROUTING: Select best provider(s) based on complexity
    const selectedProviders = smartRouting(allProviders, complexity);
    
    console.log(`🚀 Selected: ${selectedProviders.map(p => `${p.name} (${p.maxTokens} tokens)`).join(', ')}`);

    // Create enhanced prompt
    const enhancedMessages = createUltimatePrompt(messages, userLanguage, complexity);

    // Execute with selected strategy
    let result;
    
    if (complexity.tokensNeeded > 16000) {
      // MULTI-TURN strategy for very complex requests
      console.log('📚 Using MULTI-TURN generation strategy...');
      result = await multiTurnGeneration(selectedProviders, enhancedMessages, complexity);
    } else {
      // SINGLE-TURN with best model
      console.log('⚡ Using SINGLE-TURN generation strategy...');
      result = await singleTurnGeneration(selectedProviders, enhancedMessages);
    }
    
    return res.json({
      answer: result.answer,
      mode: result.mode,
      provider: result.provider,
      tokensUsed: result.tokensUsed,
      confidence: result.confidence,
      language: userLanguage,
      complexity: complexity.level
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    return res.status(500).json({
      error: 'AI request failed',
      message: error.message
    });
  }
}

// ========================================
// SMART ROUTING: Select best provider
// ========================================

function smartRouting(providers, complexity) {
  const tokensNeeded = complexity.tokensNeeded;
  
  // Group providers by same model (for load balancing)
  const groupedByModel = {};
  
  providers.forEach(provider => {
    const key = `${provider.provider}-${provider.model}`;
    if (!groupedByModel[key]) {
      groupedByModel[key] = [];
    }
    groupedByModel[key].push(provider);
  });
  
  // Rank models by max_tokens capability
  const rankedGroups = Object.values(groupedByModel).map(group => {
    const sample = group[0];
    const maxTokens = getModelMaxTokens(sample.provider, sample.model);
    
    return {
      providers: group,
      maxTokens,
      model: sample.model,
      provider: sample.provider
    };
  }).sort((a, b) => b.maxTokens - a.maxTokens);
  
  // Select providers that can handle the complexity
  const suitable = rankedGroups.filter(g => g.maxTokens >= tokensNeeded);
  
  if (suitable.length === 0) {
    console.warn('⚠️ No provider can handle tokens needed, using largest available');
    return rankedGroups[0].providers;
  }
  
  // Return all API keys for the best model (for load balancing)
  return suitable[0].providers;
}

function getModelMaxTokens(provider, model) {
  // Model-specific max_tokens
  const limits = {
    // Groq models (FREE!)
    'llama-3.3-70b-versatile': 32000,
    'llama-3.1-70b-versatile': 8000,
    'llama-3.2-90b-vision-preview': 8000,
    
    // OpenRouter models
    'openai/gpt-4-turbo': 128000,
    'openai/gpt-4': 8192,
    'openai/gpt-3.5-turbo': 16385,
    'anthropic/claude-3-opus': 200000,
    'anthropic/claude-3.5-sonnet': 200000,
    'google/gemini-pro-1.5': 1000000,
    
    // HuggingFace models
    'mistralai/Mistral-7B-Instruct-v0.2': 8000,
  };
  
  // Check exact match
  if (limits[model]) return limits[model];
  
  // Check by provider default
  const providerDefaults = {
    'groq': 8000,
    'openrouter': 8000,
    'openai': 8000,
    'anthropic': 100000,
    'huggingface': 8000
  };
  
  return providerDefaults[provider] || 4096;
}

// ========================================
// COMPLEXITY ANALYSIS
// ========================================

function analyzeComplexity(text) {
  const lowerText = text.toLowerCase();
  
  // Indicators of complexity
  const fileKeywords = ['file', 'files', 'module', 'modul', 'terpisah', 'separate'];
  const hasFileRequest = fileKeywords.some(k => lowerText.includes(k));
  
  const comprehensiveKeywords = ['lengkap', 'complete', 'full', 'seperti', 'like', 'kohl', 'claude'];
  const isComprehensive = comprehensiveKeywords.some(k => lowerText.includes(k));
  
  const numberedItems = (text.match(/\d+\./g) || []).length;
  const featureCount = ['dengan', 'with', 'include', 'fitur'].filter(w => lowerText.includes(w)).length;
  
  // Estimate files needed
  let filesNeeded = 1;
  
  if (text.match(/\d+\s*(file|files|modul)/i)) {
    const match = text.match(/(\d+)\s*(file|files|modul)/i);
    filesNeeded = parseInt(match[1]);
  } else if (isComprehensive || numberedItems >= 5) {
    filesNeeded = 5;
  } else if (numberedItems >= 3) {
    filesNeeded = 3;
  } else if (hasFileRequest) {
    filesNeeded = 2;
  }
  
  // Estimate tokens needed (rough calculation)
  // Assume: 1 file ≈ 3000-5000 tokens
  const tokensPerFile = 4000;
  const tokensNeeded = filesNeeded * tokensPerFile + 2000; // +2000 for instructions & examples
  
  let level = 'simple';
  if (tokensNeeded > 20000) level = 'very-complex';
  else if (tokensNeeded > 12000) level = 'complex';
  else if (tokensNeeded > 6000) level = 'medium';
  else if (tokensNeeded > 3000) level = 'basic';
  
  return {
    level,
    filesNeeded,
    tokensNeeded,
    isComprehensive
  };
}

// ========================================
// SINGLE-TURN GENERATION
// ========================================

async function singleTurnGeneration(providers, messages) {
  // Load balance across multiple API keys for same model
  const selectedProvider = providers[Math.floor(Math.random() * providers.length)];
  
  console.log(`🎯 Using: ${selectedProvider.name} (Key #${providers.indexOf(selectedProvider) + 1}/${providers.length})`);
  
  try {
    const result = await queryAIProvider(selectedProvider, messages);
    
    return {
      answer: result.answer,
      mode: 'single-turn',
      provider: selectedProvider.name,
      tokensUsed: estimateTokens(result.answer),
      confidence: 95
    };
  } catch (error) {
    // If failed, try next API key
    if (providers.length > 1) {
      console.warn(`⚠️ ${selectedProvider.name} failed, trying another API key...`);
      const otherProviders = providers.filter(p => p !== selectedProvider);
      return await singleTurnGeneration(otherProviders, messages);
    }
    throw error;
  }
}

// ========================================
// MULTI-TURN GENERATION (for very complex)
// ========================================

async function multiTurnGeneration(providers, messages, complexity) {
  console.log(`📚 Splitting into ${complexity.filesNeeded} parts...`);
  
  const parts = [];
  const filesPerPart = Math.ceil(complexity.filesNeeded / 3); // Max 3 turns
  
  for (let i = 0; i < Math.min(3, Math.ceil(complexity.filesNeeded / filesPerPart)); i++) {
    const startFile = i * filesPerPart + 1;
    const endFile = Math.min((i + 1) * filesPerPart, complexity.filesNeeded);
    
    console.log(`📝 Generating files ${startFile}-${endFile}...`);
    
    // Create focused prompt for this part
    const partPrompt = createPartPrompt(messages, startFile, endFile, complexity);
    
    // Use load-balanced provider
    const provider = providers[i % providers.length];
    
    try {
      const result = await queryAIProvider(provider, [partPrompt]);
      parts.push(result.answer);
      
      console.log(`✅ Part ${i + 1} done (${estimateTokens(result.answer)} tokens)`);
    } catch (error) {
      console.error(`❌ Part ${i + 1} failed:`, error.message);
      throw error;
    }
  }
  
  // Combine all parts
  const combined = parts.join('\n\n---\n\n');
  
  return {
    answer: combined,
    mode: 'multi-turn',
    provider: `${providers[0].name} (${parts.length} calls)`,
    tokensUsed: estimateTokens(combined),
    confidence: 92
  };
}

function createPartPrompt(originalMessages, startFile, endFile, complexity) {
  const userMessage = originalMessages[originalMessages.length - 1].content;
  const isIndonesian = detectLanguage(userMessage) === 'indonesian';
  
  return {
    role: 'user',
    content: isIndonesian ? `
${userMessage}

INSTRUKSI KHUSUS:
Untuk request ini, tolong generate HANYA FILE ${startFile} sampai ${endFile} dari total ${complexity.filesNeeded} files.

Generate dengan LENGKAP:
- Setiap file 100% complete
- Semua fungsi fully implemented
- Error handling lengkap
- Komentar Indonesia
- Siap pakai

Format:
**FILE ${startFile}: [nama].lua**
\`\`\`lua
[FULL CODE]
\`\`\`

**FILE ${startFile + 1}: [nama].lua** (jika ada)
\`\`\`lua
[FULL CODE]
\`\`\`

Jangan generate file lain, fokus ${startFile}-${endFile} saja.
` : `
${userMessage}

SPECIAL INSTRUCTION:
For this request, please generate ONLY FILES ${startFile} to ${endFile} of ${complexity.filesNeeded} total files.

Generate COMPLETELY:
- Each file 100% complete
- All functions fully implemented
- Complete error handling
- English comments
- Production ready

Format:
**FILE ${startFile}: [name].lua**
\`\`\`lua
[FULL CODE]
\`\`\`

**FILE ${startFile + 1}: [name].lua** (if any)
\`\`\`lua
[FULL CODE]
\`\`\`

Don't generate other files, focus on ${startFile}-${endFile} only.
`
  };
}

// ========================================
// ULTIMATE SYSTEM PROMPT
// ========================================

function createUltimatePrompt(messages, userLanguage, complexity) {
  const isIndonesian = userLanguage === 'indonesian';
  
  const prompt = {
    role: 'system',
    content: `You are Claude Sonnet 4.5 - world's best coding assistant.

${isIndonesian ? `
INSTRUKSI KRITIS:

Generate ${complexity.filesNeeded} file LENGKAP dan SIAP PAKAI!

WAJIB:
✅ Setiap file 100% complete (no placeholder)
✅ Semua fungsi fully implemented  
✅ Error handling lengkap
✅ Komentar Indonesia
✅ Total ${complexity.tokensNeeded} tokens output

DILARANG:
❌ "Tambahkan sendiri"
❌ "..." atau "etc"
❌ TODO comments
❌ Potong kode di tengah

File structure:
${complexity.filesNeeded >= 5 ? `
- Config module (100-150 lines)
- Core logic (300-400 lines)
- UI module (250-300 lines)
- Commands (200-250 lines)
- Main (150-200 lines)
` : `
- ${complexity.filesNeeded} complete modules
- Setiap file 100+ lines
- Production-ready
`}

` : `
CRITICAL INSTRUCTIONS:

Generate ${complexity.filesNeeded} COMPLETE and PRODUCTION-READY files!

REQUIRED:
✅ Each file 100% complete (no placeholder)
✅ All functions fully implemented
✅ Complete error handling
✅ English comments
✅ Total ${complexity.tokensNeeded} tokens output

FORBIDDEN:
❌ "Add yourself"
❌ "..." or "etc"
❌ TODO comments
❌ Cutting code midway

File structure:
${complexity.filesNeeded >= 5 ? `
- Config module (100-150 lines)
- Core logic (300-400 lines)
- UI module (250-300 lines)
- Commands (200-250 lines)
- Main (150-200 lines)
` : `
- ${complexity.filesNeeded} complete modules
- Each file 100+ lines
- Production-ready
`}
`}

Remember: Users want COPY-PASTE ready code!`
  };
  
  return [prompt, ...messages];
}

// ========================================
// AI PROVIDER QUERY
// ========================================

async function queryAIProvider(provider, messages) {
  const maxTokens = getModelMaxTokens(provider.provider, provider.model);
  const requestBody = buildRequestBody(provider, messages, maxTokens);
  const headers = buildHeaders(provider);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 min

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
      throw new Error(`${provider.name} API error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const answer = extractAnswer(provider, data);

    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response');
    }

    return {
      sourceName: provider.name,
      answer: answer.trim()
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Timeout after 2 minutes');
    }
    throw error;
  }
}

function buildRequestBody(provider, messages, maxTokens) {
  const providerType = provider.provider.toLowerCase();

  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.95,
      stream: false
    };
  }

  if (providerType === 'anthropic') {
    return {
      model: provider.model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7
    };
  }

  if (providerType === 'huggingface') {
    const lastMessage = messages[messages.length - 1];
    return {
      inputs: lastMessage.content,
      parameters: {
        max_new_tokens: Math.floor(maxTokens / 2),
        temperature: 0.7
      }
    };
  }

  return { messages, max_tokens: maxTokens };
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
  // Rough estimation: 1 token ≈ 4 characters
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
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://nextgenai.vercel.app';
    headers['X-Title'] = 'NextGenAI Hybrid Strategy';
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
