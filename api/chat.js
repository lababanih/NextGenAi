// api/chat.js
// SIMPLIFIED MEMORY-FIRST CHAT SYSTEM
// Uses environment variables ONLY (no admin panel for API keys)

import dbManager from './database/manager.js';

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
    const { messages, useMemory = true } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const userMessage = messages[messages.length - 1].content;
    const userLanguage = detectLanguage(userMessage);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 NEW REQUEST: "${userMessage.substring(0, 50)}..."`);
    console.log(`${'='.repeat(60)}\n`);

    // ==========================================
    // STEP 1: CHECK MEMORY FIRST (if enabled)
    // ==========================================
    
    if (useMemory) {
      console.log('📚 STEP 1: Checking knowledge base...');
      
      try {
        await dbManager.initialize();
        
        const memoryResults = await dbManager.searchKnowledge(userMessage, {
          language: userLanguage,
          limit: 3
        });

        if (memoryResults.length > 0) {
          const bestMatch = memoryResults[0];
          const similarity = calculateSimilarity(userMessage, bestMatch.topic);

          console.log(`  🔍 Found ${memoryResults.length} potential matches`);
          console.log(`  📊 Best match: "${bestMatch.topic.substring(0, 50)}..."`);
          console.log(`  🎯 Similarity: ${Math.round(similarity * 100)}%`);

          // If similarity is high enough, return from memory
          if (similarity > 0.65) {
            console.log(`  ✅ RETURNING FROM MEMORY (threshold: 65%)\n`);
            
            const answer = formatMemoryAnswer(bestMatch);
            
            return res.json({
              answer,
              metadata: {
                source: 'memory',
                database: bestMatch.source_db,
                confidence: Math.round(similarity * 100),
                learnedAt: bestMatch.createdAt,
                fast: true,
                duration: 0,
                cost: 0,
                language: userLanguage,
                fromCache: true
              }
            });
          } else {
            console.log(`  ⚠️  Similarity too low (${Math.round(similarity * 100)}% < 65%), querying AIs...\n`);
          }
        } else {
          console.log(`  ℹ️  No matches found in memory, querying AIs...\n`);
        }
      } catch (error) {
        console.error('  ❌ Memory check failed:', error.message);
        console.log('  ➡️  Continuing with AI query...\n');
      }
    } else {
      console.log('📚 STEP 1: Memory disabled, skipping...\n');
    }

    // ==========================================
    // STEP 2: LOAD AI SOURCES FROM ENV VARS
    // ==========================================

    console.log('🤖 STEP 2: Loading AI sources from environment...');

    const providers = loadProvidersFromEnv();

    if (providers.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured',
        message: 'Please set AI API keys in Vercel Environment Variables:\n' +
                 '- GROQ_API_KEY (recommended - free)\n' +
                 '- GOOGLE_API_KEY (optional - 2M tokens)\n' +
                 '- OPENROUTER_API_KEY (optional - premium models)',
        setup: 'Go to: Vercel Dashboard → Settings → Environment Variables'
      });
    }

    console.log(`  ✅ ${providers.length} AI source(s) loaded from environment:`);
    providers.forEach(p => {
      console.log(`     - ${p.name} (${p.maxTokens.toLocaleString()} tokens)`);
    });
    console.log();

    // ==========================================
    // STEP 3: ANALYZE & SELECT STRATEGY
    // ==========================================

    console.log('📊 STEP 3: Analyzing query complexity...');

    const analysis = analyzeComplexityDeep(userMessage);
    
    console.log(`  📈 Complexity: ${analysis.level}`);
    console.log(`  📁 Files needed: ${analysis.filesNeeded}`);
    console.log(`  📏 Estimated tokens: ${analysis.estimatedTokens.toLocaleString()}`);
    console.log(`  📝 Estimated lines: ${analysis.estimatedLines.toLocaleString()}\n`);

    const strategy = selectOptimalStrategy(providers, analysis);
    
    console.log(`🎯 STEP 4: Selected strategy: ${strategy.name}`);
    console.log(`  🤖 Model: ${strategy.model.name}`);
    console.log(`  📦 Capacity: ${strategy.model.maxTokens.toLocaleString()} tokens`);
    console.log(`  🎬 Approach: ${strategy.approach}`);
    console.log(`  🔄 Turns: ${strategy.turns || 1}`);
    console.log(`  💰 Est. cost: $${strategy.costEstimate.toFixed(6)}\n`);

    // ==========================================
    // STEP 5: CREATE ENHANCED PROMPT
    // ==========================================

    console.log('✍️  STEP 5: Creating enhanced prompt...');

    const enhancedMessages = createUltimatePrompt(
      messages, 
      userLanguage, 
      analysis,
      strategy
    );

    console.log(`  ✅ Prompt enhanced\n`);

    // ==========================================
    // STEP 6: EXECUTE STRATEGY
    // ==========================================

    console.log('⚡ STEP 6: Executing AI query...');

    const startTime = Date.now();
    const result = await executeStrategy(strategy, enhancedMessages, providers);
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ Generation complete in ${duration}ms`);
    console.log(`  📊 Output: ${result.tokensGenerated.toLocaleString()} tokens, ${result.linesGenerated.toLocaleString()} lines`);
    console.log(`  💰 Cost: $${result.cost.toFixed(6)}\n`);

    // ==========================================
    // STEP 7: AUTO-SAVE TO MEMORY
    // ==========================================

    if (useMemory && result.answer) {
      console.log('💾 STEP 7: Auto-saving to knowledge base...');
      
      try {
        const saved = await autoSaveToMemory(
          userMessage, 
          result.answer, 
          userLanguage,
          analysis
        );
        
        if (saved) {
          console.log(`  ✅ Saved to: ${saved.database}`);
          console.log(`  📦 ID: ${saved.id}`);
          console.log(`  📏 Size: ${saved.size.toFixed(2)} MB\n`);
        }
      } catch (error) {
        console.error('  ⚠️  Auto-save failed (non-critical):', error.message, '\n');
      }
    } else {
      console.log('💾 STEP 7: Memory disabled, skipping auto-save\n');
    }

    console.log(`${'='.repeat(60)}`);
    console.log(`✅ REQUEST COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);

    // ==========================================
    // RETURN RESPONSE
    // ==========================================

    return res.json({
      answer: result.answer,
      metadata: {
        strategy: strategy.name,
        model: strategy.model.name,
        provider: strategy.model.provider,
        tokensGenerated: result.tokensGenerated,
        linesGenerated: result.linesGenerated,
        confidence: result.confidence,
        duration,
        cost: result.cost,
        language: userLanguage,
        complexity: analysis.level,
        savedToMemory: useMemory,
        fromCache: false
      }
    });

  } catch (error) {
    console.error('\n❌ SYSTEM ERROR:', error);
    console.error('Stack:', error.stack, '\n');
    
    return res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
}

// ==========================================
// LOAD PROVIDERS FROM ENVIRONMENT VARIABLES
// ==========================================

function loadProvidersFromEnv() {
  const providers = [];

  // Groq (FREE - 32K tokens)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      id: 'groq-llama-3.3',
      name: 'Groq Llama 3.3 70B',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      maxTokens: 32000,
      costPerToken: 0,
      speed: 'very-fast',
      quality: 'high',
      priority: 1
    });
  }

  // Google Gemini (FREE - 2M tokens!)
  if (process.env.GOOGLE_API_KEY) {
    providers.push({
      id: 'google-gemini-1.5-pro',
      name: 'Google Gemini 1.5 Pro',
      provider: 'google',
      model: 'gemini-1.5-pro',
      apiKey: process.env.GOOGLE_API_KEY,
      endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      maxTokens: 2000000,
      costPerToken: 0,
      speed: 'medium',
      quality: 'very-high',
      priority: 2
    });
  }

  // OpenRouter (PAID - Multiple models)
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      id: 'openrouter-gpt4-turbo',
      name: 'OpenRouter GPT-4 Turbo',
      provider: 'openrouter',
      model: 'openai/gpt-4-turbo',
      apiKey: process.env.OPENROUTER_API_KEY,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      maxTokens: 128000,
      costPerToken: 0.00001,
      speed: 'fast',
      quality: 'very-high',
      priority: 3
    });

    providers.push({
      id: 'openrouter-claude-3.5',
      name: 'OpenRouter Claude 3.5 Sonnet',
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      apiKey: process.env.OPENROUTER_API_KEY,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      maxTokens: 200000,
      costPerToken: 0.000003,
      speed: 'fast',
      quality: 'excellent',
      priority: 4
    });
  }

  // Sort by priority (lower = higher priority)
  return providers.sort((a, b) => a.priority - b.priority);
}

// ==========================================
// AUTO-SAVE TO MEMORY
// ==========================================

async function autoSaveToMemory(question, answer, language, analysis) {
  try {
    // Extract code blocks
    const codeBlocks = answer.match(/```(\w+)?\n([\s\S]*?)```/g);
    
    let code = null;
    if (codeBlocks && codeBlocks.length > 0) {
      code = codeBlocks.map(block => {
        const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
        return {
          language: match[1] || 'code',
          code: match[2].trim()
        };
      });
    }

    // Generate topic (first 100 chars)
    const topic = question.substring(0, 100).trim();

    // Extract tags
    const tags = extractTags(question + ' ' + answer);

    // Save to database
    const result = await dbManager.saveKnowledge({
      topic,
      language,
      content: answer,
      code: code ? JSON.stringify(code) : null,
      tags,
      metadata: {
        originalQuestion: question,
        complexity: analysis.level,
        filesCount: analysis.filesNeeded,
        estimatedTokens: analysis.estimatedTokens,
        source: 'auto-learned',
        learnedAt: new Date()
      }
    });

    return result;

  } catch (error) {
    console.error('Auto-save error:', error);
    throw error;
  }
}

// ==========================================
// MEMORY HELPERS
// ==========================================

function formatMemoryAnswer(knowledge) {
  let answer = knowledge.content;

  // Add code if present
  if (knowledge.code) {
    try {
      const codeBlocks = JSON.parse(knowledge.code);
      if (Array.isArray(codeBlocks)) {
        answer += '\n\n' + codeBlocks.map(block => 
          `\`\`\`${block.language}\n${block.code}\n\`\`\``
        ).join('\n\n');
      }
    } catch (e) {
      // Code is in plain format
      if (knowledge.code.trim()) {
        answer += '\n\n```\n' + knowledge.code + '\n```';
      }
    }
  }

  // Add metadata info
  const learnedDate = new Date(knowledge.createdAt).toLocaleDateString();
  answer += `\n\n---\n*💡 Retrieved from knowledge base • Learned: ${learnedDate} • Database: ${knowledge.source_db}*`;

  return answer;
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

function extractTags(text) {
  const keywords = text.toLowerCase().match(/\b(react|vue|angular|node|python|javascript|typescript|java|php|ruby|go|rust|api|database|mongodb|sql|postgresql|mysql|redis|authentication|auth|security|jwt|oauth|performance|optimization|tutorial|guide|example|component|function|class|hook|state|props|async|await|promise|fetch|axios|express|fastapi|django|flask|spring|laravel|nextjs|vercel|deployment|docker|kubernetes|aws|azure|gcp|frontend|backend|fullstack|html|css|tailwind|bootstrap|testing|jest|cypress|git|github|gitlab|ci|cd|devops|agile|scrum|rest|graphql|websocket|microservice|serverless|lambda)\b/g);
  return keywords ? [...new Set(keywords)].slice(0, 15) : [];
}

// ==========================================
// COMPLEXITY ANALYSIS
// ==========================================

function analyzeComplexityDeep(text) {
  const lowerText = text.toLowerCase();
  
  const fileMatch = text.match(/(\d+)\s*(file|files|modul)/i);
  const explicitFiles = fileMatch ? parseInt(fileMatch[1]) : 0;
  
  const numberedItems = (text.match(/\d+\./g) || []).length;
  const bulletPoints = (text.match(/[-•*]\s/g) || []).length;
  
  const comprehensiveKeywords = [
    'lengkap', 'complete', 'full', 'penuh',
    'seperti', 'like', 'claude', 'sonnet', 'chatgpt',
    'production', 'produksi', 'professional', 'profesional',
    'system', 'sistem', 'framework', 'aplikasi', 'application'
  ];
  const comprehensiveScore = comprehensiveKeywords.filter(k => lowerText.includes(k)).length;
  
  const featureKeywords = ['dengan', 'with', 'include', 'termasuk', 'fitur', 'feature'];
  const featureScore = featureKeywords.filter(k => lowerText.includes(k)).length;
  
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
  
  const linesPerFile = filesNeeded <= 1 ? 150 : 
                       filesNeeded <= 2 ? 250 :
                       filesNeeded <= 3 ? 300 :
                       filesNeeded <= 5 ? 280 : 250;
  
  const estimatedLines = filesNeeded * linesPerFile;
  const estimatedTokens = estimatedLines * 25 + 2000;
  
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

// ==========================================
// STRATEGY SELECTION
// ==========================================

function selectOptimalStrategy(providers, analysis) {
  const tokensNeeded = analysis.estimatedTokens;
  
  // Sort: FREE first, then by capacity
  const sortedProviders = providers.sort((a, b) => {
    if (a.costPerToken === 0 && b.costPerToken > 0) return -1;
    if (a.costPerToken > 0 && b.costPerToken === 0) return 1;
    return b.maxTokens - a.maxTokens;
  });
  
  // Try single-turn with high-capacity model
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
  
  // Fallback: multi-turn with best available model
  const bestModel = sortedProviders[0];
  const turns = Math.ceil(tokensNeeded / (bestModel.maxTokens * 0.9));
  
  return {
    name: 'multi-turn-chunked',
    approach: 'multi-turn',
    model: bestModel,
    turns,
    costEstimate: tokensNeeded * bestModel.costPerToken * turns
  };
}

// ==========================================
// STRATEGY EXECUTION
// ==========================================

async function executeStrategy(strategy, messages, providers) {
  if (strategy.approach === 'single-turn') {
    return await executeSingleTurn(strategy, messages);
  } else {
    return await executeMultiTurn(strategy, messages);
  }
}

async function executeSingleTurn(strategy, messages) {
  const result = await queryAIProvider(strategy.model, messages);
  const tokensGenerated = estimateTokens(result.answer);
  const linesGenerated = result.answer.split('\n').length;
  const cost = tokensGenerated * strategy.model.costPerToken;
  
  return {
    answer: result.answer,
    tokensGenerated,
    linesGenerated,
    cost,
    confidence: 98
  };
}

async function executeMultiTurn(strategy, messages) {
  const originalPrompt = messages[messages.length - 1].content;
  const systemPrompt = messages.find(m => m.role === 'system');
  const parts = [];
  
  for (let turn = 0; turn < strategy.turns; turn++) {
    console.log(`    🔄 Turn ${turn + 1}/${strategy.turns}...`);
    
    const turnPrompt = {
      role: 'user',
      content: turn === 0 ? 
        originalPrompt + `\n\n[Generate first part completely]` :
        `Continue from previous. Generate next part completely.\n\nPrevious output:\n${parts[parts.length - 1].substring(parts[parts.length - 1].length - 500)}\n\n[Continue and complete remaining content]`
    };
    
    const turnMessages = systemPrompt ? [systemPrompt, turnPrompt] : [turnPrompt];
    
    try {
      const result = await queryAIProvider(strategy.model, turnMessages);
      parts.push(result.answer);
      
      console.log(`       ✓ Generated ${estimateTokens(result.answer).toLocaleString()} tokens`);
      
      if (detectCompleteness(result.answer) && turn < strategy.turns - 1) {
        console.log(`       ℹ️  Generation complete, stopping early`);
        break;
      }
    } catch (error) {
      console.error(`       ✗ Turn failed: ${error.message}`);
      if (parts.length === 0) throw error;
      break;
    }
  }
  
  const combined = parts.join('\n\n');
  const tokensGenerated = estimateTokens(combined);
  const linesGenerated = combined.split('\n').length;
  const cost = tokensGenerated * strategy.model.costPerToken;
  
  return {
    answer: combined,
    tokensGenerated,
    linesGenerated,
    cost,
    confidence: 95
  };
}

function detectCompleteness(text) {
  const markers = ['setup instructions', 'usage example', 'installation', 'selesai', 'demikian', 'conclusion'];
  const lowerText = text.toLowerCase();
  const hasMarkers = markers.filter(m => lowerText.includes(m)).length >= 2;
  const codeBlocks = (text.match(/```/g) || []).length / 2;
  return hasMarkers && codeBlocks >= 3;
}

// ==========================================
// PROMPT CREATION
// ==========================================

function createUltimatePrompt(messages, userLanguage, analysis, strategy) {
  const isIndonesian = userLanguage === 'indonesian';
  
  const prompt = {
    role: 'system',
    content: `You are an expert coding assistant. Generate COMPLETE, PRODUCTION-READY code.

📊 Target Output:
- Files: ${analysis.filesNeeded}
- Lines: ${analysis.estimatedLines}
- Tokens: ${analysis.estimatedTokens}

⚡ Critical Rules:
${isIndonesian ? `
- Generate LENGKAP tanpa placeholder
- SEMUA fungsi fully implemented
- Include error handling lengkap
- Add dokumentasi dalam Bahasa Indonesia
- Code siap production, bukan contoh!
` : `
- Generate COMPLETE without placeholders
- ALL functions fully implemented
- Include complete error handling
- Add comprehensive documentation
- Production-ready code, not examples!
`}

🎯 Quality Standards:
- Best practices
- Clean code
- Security conscious
- Performance optimized

USE FULL CAPACITY! Generate ${analysis.estimatedLines}+ lines!`
  };
  
  return [prompt, ...messages];
}

// ==========================================
// AI PROVIDER QUERY
// ==========================================

async function queryAIProvider(provider, messages) {
  const requestBody = {
    model: provider.model,
    messages,
    temperature: 0.7,
    max_tokens: Math.floor(provider.maxTokens * 0.95),
    top_p: 0.95,
    stream: false
  };
  
  const headers = buildHeaders(provider);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3 minutes

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
      throw new Error('Empty response from AI');
    }

    return { answer: answer.trim() };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 3 minutes');
    }
    throw error;
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function detectLanguage(text) {
  const indonesianWords = ['apa', 'bagaimana', 'buat', 'buatkan', 'tolong', 'saya', 'dengan', 'untuk', 'yang', 'ini'];
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
  } else if (providerType === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://nextgenai.vercel.app/';
    headers['X-Title'] = 'NextGenAI Memory System';
  } else if (providerType === 'google') {
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
