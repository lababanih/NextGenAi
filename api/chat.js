// api/chat.js
// Enhanced with Multi-Language Learning & Better Code Generation

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

    // Get enabled AI sources
    let enabledProviders = [];

    if (aiSources && Array.isArray(aiSources) && aiSources.length > 0) {
      enabledProviders = aiSources
        .filter(s => s.enabled && s.apiKey && s.apiKey.length > 5)
        .sort((a, b) => a.priority - b.priority);
    } else {
      enabledProviders = getDefaultProviders();
    }

    if (enabledProviders.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured',
        message: 'Please configure at least one AI source in Admin Panel',
        hint: 'Go to /admin.html to setup API keys'
      });
    }

    console.log(`💡 Using ${enabledProviders.length} AI provider(s):`, enabledProviders.map(p => p.name));

    // Enhance system prompt for better code generation
    const enhancedMessages = enhanceMessagesForCodeGeneration(messages);

    // SMART MODE: Multi-AI synthesis
    if (mode === 'smart' && enabledProviders.length > 1) {
      try {
        console.log('🧠 Smart mode: Querying multiple AIs...');
        const responses = await queryMultipleAIs(enabledProviders, enhancedMessages);
        const synthesized = await synthesizeResponses(responses, enhancedMessages, enabledProviders[0]);
        
        return res.json({
          answer: synthesized.answer,
          mode: 'smart',
          sources: responses.map(r => r.sourceName),
          confidence: synthesized.confidence || 90,
          learnedFrom: responses.length
        });
      } catch (error) {
        console.error('⚠️ Smart mode failed, falling back to fast mode:', error.message);
      }
    }

    // FAST MODE: Priority-based with fallback
    console.log('⚡ Fast mode: Using priority-based routing...');
    const result = await queryWithFallback(enabledProviders, enhancedMessages);
    
    return res.json({
      answer: result.answer,
      mode: 'fast',
      source: result.sourceName,
      confidence: 85
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    return res.status(500).json({
      error: 'AI request failed',
      message: error.message,
      details: 'Check console logs for more information'
    });
  }
}

// ========================================
// ENHANCED CODE GENERATION SYSTEM
// ========================================

function enhanceMessagesForCodeGeneration(messages) {
  const lastMessage = messages[messages.length - 1];
  
  // Detect if this is a code generation request
  const codeKeywords = [
    'create', 'build', 'make', 'generate', 'buat', 'bikin',
    'code', 'script', 'program', 'kode', 'skrip', 'aplikasi',
    'function', 'class', 'module', 'component'
  ];
  
  const isCodeRequest = codeKeywords.some(k => 
    lastMessage.content.toLowerCase().includes(k)
  );

  if (!isCodeRequest) {
    return messages;
  }

  // Add enhanced system message for code generation
  const enhancedSystem = {
    role: 'system',
    content: `You are an expert programmer proficient in ALL programming languages including:
- Web: HTML, CSS, JavaScript, TypeScript, React, Vue, Angular
- Backend: Python, Java, C#, Go, Ruby, PHP, Node.js
- Mobile: Swift, Kotlin, React Native, Flutter
- Game Dev: Lua (Roblox), C++, Unity C#, Unreal
- Data: Python, R, SQL, Jupyter
- Systems: C, C++, Rust, Assembly

CRITICAL CODE GENERATION RULES:
1. Always provide COMPLETE, WORKING code that can be used immediately
2. Include clear comments explaining logic
3. Follow industry best practices and design patterns
4. Make code clean, efficient, and maintainable
5. Handle edge cases and errors properly
6. Use proper formatting and indentation
7. Include usage examples when applicable
8. Wrap code in markdown blocks with language identifier

Example format:
\`\`\`language
// Complete working code here
\`\`\`

Remember: Quality > Speed. Users need code that WORKS.`
  };

  // Insert system message at the beginning
  return [enhancedSystem, ...messages];
}

// ========================================
// MULTI-AI QUERYING SYSTEM
// ========================================

async function queryMultipleAIs(providers, messages) {
  // Query up to 3 AIs simultaneously for speed/cost balance
  const selectedProviders = providers.slice(0, 3);
  
  console.log(`📡 Querying ${selectedProviders.length} AIs:`, selectedProviders.map(p => p.name));
  
  const queries = selectedProviders.map(provider => 
    queryAIProvider(provider, messages)
      .then(result => {
        console.log(`✅ ${provider.name} responded`);
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
    throw new Error('All AI providers failed to respond');
  }

  console.log(`📊 Received ${validResults.length} valid responses`);
  return validResults;
}

async function queryWithFallback(providers, messages) {
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
      continue;
    }
  }

  throw new Error(`All ${providers.length} provider(s) failed. Last error: ${lastError?.message}`);
}

async function queryAIProvider(provider, messages) {
  const requestBody = buildRequestBody(provider, messages);
  const headers = buildHeaders(provider);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

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

    return {
      sourceName: provider.name,
      provider: provider.provider,
      model: provider.model,
      answer: answer.trim()
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`${provider.name} timeout after 45s`);
    }
    throw error;
  }
}

// ========================================
// RESPONSE SYNTHESIS SYSTEM
// ========================================

async function synthesizeResponses(responses, originalMessages, primaryProvider) {
  if (responses.length === 1) {
    return {
      answer: responses[0].answer,
      confidence: 85
    };
  }

  console.log('🧠 Synthesizing knowledge from multiple AI responses...');

  const responsesText = responses.map((r, i) => 
    `[AI Source ${i+1}: ${r.sourceName}]\n${r.answer}`
  ).join('\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n');

  const userQuery = originalMessages[originalMessages.length - 1].content;

  const synthesisPrompt = {
    role: 'user',
    content: `You are an AI synthesis expert. You've received answers from multiple AI sources for the same question.

ORIGINAL QUESTION:
${userQuery}

RESPONSES FROM DIFFERENT AI SOURCES:
${responsesText}

YOUR TASK:
1. Analyze all responses above
2. Extract the BEST insights, code, and information from each source
3. Combine into ONE superior, comprehensive answer
4. If it's code, merge best practices from all sources
5. Remove contradictions and redundancies
6. Keep formatting clean and professional

CRITICAL RULES:
- If multiple AIs provided code, combine the best elements
- Preserve code blocks with proper formatting
- Keep explanations clear and concise
- Maintain technical accuracy
- Output should be BETTER than any single source

Provide your synthesized answer directly (no meta-commentary like "Based on the sources..." - just give the final answer).`
  };

  try {
    const result = await queryAIProvider(primaryProvider, [synthesisPrompt]);
    
    return {
      answer: result.answer,
      confidence: 95, // Higher confidence from synthesis
      synthesizedFrom: responses.length
    };
  } catch (error) {
    console.error('⚠️ Synthesis failed:', error.message);
    // Fallback: return best response (longest with code blocks)
    const bestResponse = responses.reduce((best, current) => {
      const currentScore = current.answer.length + (current.answer.includes('```') ? 1000 : 0);
      const bestScore = best.answer.length + (best.answer.includes('```') ? 1000 : 0);
      return currentScore > bestScore ? current : best;
    });
    
    return {
      answer: bestResponse.answer,
      confidence: 80
    };
  }
}

// ========================================
// REQUEST BUILDING
// ========================================

function buildRequestBody(provider, messages) {
  const providerType = provider.provider.toLowerCase();

  // OpenAI-compatible (Groq, OpenRouter, OpenAI)
  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096, // Increased for longer code
      stream: false
    };
  }

  // Anthropic (Claude)
  if (providerType === 'anthropic') {
    return {
      model: provider.model,
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7
    };
  }

  // HuggingFace
  if (providerType === 'huggingface') {
    const lastMessage = messages[messages.length - 1];
    return {
      inputs: lastMessage.content,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        return_full_text: false,
        do_sample: true
      }
    };
  }

  // Default
  return { messages, max_tokens: 4096 };
}

function buildHeaders(provider) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const providerType = provider.provider.toLowerCase();

  if (providerType === 'groq' || providerType === 'openai') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (providerType === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://nextgenai.vercel.app';
    headers['X-Title'] = 'NextGenAI Multi-Model Assistant';
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

  // OpenAI-compatible
  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return data.choices?.[0]?.message?.content || '';
  }

  // Anthropic
  if (providerType === 'anthropic') {
    return data.content?.[0]?.text || '';
  }

  // HuggingFace
  if (providerType === 'huggingface') {
    if (Array.isArray(data)) {
      return data[0]?.generated_text || '';
    }
    return data.generated_text || '';
  }

  // Fallback
  return data.response || data.output || data.text || '';
}

// ========================================
// DEFAULT PROVIDERS (FALLBACK)
// ========================================

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

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: 'OpenRouter (GPT-4)',
      provider: 'openrouter',
      model: 'openai/gpt-4-turbo-preview',
      apiKey: process.env.OPENROUTER_API_KEY,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      priority: 2,
      enabled: true
    });
  }

  return providers;
}
