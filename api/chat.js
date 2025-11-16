// api/chat.js
// Super Intelligent Multi-Language System
// Advanced reasoning, language detection, and premium code generation

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
    let enabledProviders = getEnabledProviders(aiSources);

    if (enabledProviders.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured',
        message: 'Please configure at least one AI source in Admin Panel',
        hint: 'Go to /admin.html to setup API keys'
      });
    }

    console.log(`🧠 Super Intelligence Mode: ${enabledProviders.length} AI provider(s) ready`);

    // Detect user's language
    const userLanguage = detectLanguage(messages[messages.length - 1].content);
    console.log(`🌍 Detected language: ${userLanguage}`);

    // Enhance messages with advanced system prompt
    const enhancedMessages = createSuperIntelligentPrompt(messages, userLanguage);

    // SMART MODE: Multi-AI with advanced synthesis
    if (mode === 'smart' && enabledProviders.length > 1) {
      try {
        console.log('🧠 Super Smart Mode: Advanced multi-AI reasoning...');
        const responses = await queryMultipleAIs(enabledProviders, enhancedMessages);
        const synthesized = await advancedSynthesis(responses, enhancedMessages, enabledProviders[0], userLanguage);
        
        return res.json({
          answer: synthesized.answer,
          mode: 'super-smart',
          sources: responses.map(r => r.sourceName),
          confidence: synthesized.confidence || 98,
          language: userLanguage,
          reasoning: synthesized.reasoning
        });
      } catch (error) {
        console.error('⚠️ Super Smart mode failed, falling back:', error.message);
      }
    }

    // FAST MODE: Single AI with enhanced prompting
    console.log('⚡ Enhanced Fast Mode: Using advanced single-AI reasoning...');
    const result = await queryWithEnhancedPrompt(enabledProviders, enhancedMessages);
    
    return res.json({
      answer: result.answer,
      mode: 'enhanced-fast',
      source: result.sourceName,
      confidence: 92,
      language: userLanguage
    });

  } catch (error) {
    console.error('❌ Super Intelligence error:', error);
    return res.status(500).json({
      error: 'AI request failed',
      message: error.message
    });
  }
}

// ========================================
// LANGUAGE DETECTION & AUTO-RESPONSE
// ========================================

function detectLanguage(text) {
  // Indonesian detection
  const indonesianWords = [
    'apa', 'bagaimana', 'buat', 'buatkan', 'tolong', 'saya', 'yang', 'dengan', 
    'untuk', 'dari', 'ini', 'itu', 'ada', 'tidak', 'ya', 'kamu', 'dia',
    'bisa', 'mau', 'ingin', 'mohon', 'terima', 'kasih'
  ];
  
  const lowerText = text.toLowerCase();
  const indonesianCount = indonesianWords.filter(word => 
    lowerText.includes(` ${word} `) || lowerText.startsWith(`${word} `) || lowerText.endsWith(` ${word}`)
  ).length;

  // If 2+ Indonesian words detected
  if (indonesianCount >= 2) {
    return 'indonesian';
  }

  return 'english';
}

// ========================================
// SUPER INTELLIGENT SYSTEM PROMPT
// ========================================

function createSuperIntelligentPrompt(messages, userLanguage) {
  const languageInstruction = userLanguage === 'indonesian' 
    ? 'CRITICAL: User is speaking Indonesian. You MUST respond in fluent, natural Indonesian (Bahasa Indonesia). All explanations, comments, and text should be in Indonesian.'
    : 'Respond in clear, professional English.';

  const superPrompt = {
    role: 'system',
    content: `You are NextGenAI - a superintelligent AI assistant comparable to Claude Sonnet 4.5, with expertise across ALL domains.

${languageInstruction}

# CORE CAPABILITIES

## 🧠 Advanced Reasoning
- Think step-by-step with chain-of-thought reasoning
- Consider multiple approaches before answering
- Anticipate follow-up questions and edge cases
- Provide comprehensive, production-ready solutions

## 💻 Programming Excellence
You are EXPERT in ALL programming languages and frameworks:

**Languages**: JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, Swift, Kotlin, Ruby, PHP, Lua (Roblox), Dart, R, Scala, Perl, Shell scripting

**Web**: React, Vue, Angular, Svelte, Next.js, Nuxt, HTML5, CSS3, Tailwind, Bootstrap, Node.js, Express, FastAPI, Django, Flask, Spring Boot, ASP.NET

**Mobile**: React Native, Flutter, Swift (iOS), Kotlin (Android), Expo

**Game Dev**: Lua for Roblox Studio, Unity (C#), Unreal Engine (C++), Godot, Game Maker

**Data**: Pandas, NumPy, Matplotlib, TensorFlow, PyTorch, Scikit-learn, SQL, MongoDB

**DevOps**: Docker, Kubernetes, AWS, Azure, GCP, CI/CD, Git

## 📝 Code Generation Rules (CRITICAL)

When generating code:

1. **Complete & Production-Ready**
   - Write FULL working code, not snippets
   - Include ALL necessary imports/dependencies
   - Add proper error handling
   - Consider edge cases
   - Make it ready to copy-paste and use

2. **Clean Code Principles**
   - Meaningful variable/function names
   - Proper structure and organization
   - DRY (Don't Repeat Yourself)
   - SOLID principles
   - Best practices for the language

3. **Comments & Documentation**
   ${userLanguage === 'indonesian' 
     ? '- Tulis SEMUA komentar dalam Bahasa Indonesia yang jelas\n   - Jelaskan logic kompleks\n   - Dokumentasikan function/class\n   - Berikan contoh penggunaan'
     : '- Write clear, helpful comments\n   - Explain complex logic\n   - Document functions/classes\n   - Provide usage examples'
   }

4. **Code Quality**
   - Optimize for readability first, then performance
   - Use modern syntax and features
   - Follow language-specific conventions
   - Include proper type hints (if applicable)

5. **Format & Structure**
   - Proper indentation (2 or 4 spaces)
   - Consistent code style
   - Logical organization
   - Clear separation of concerns

## 🎯 Response Format

When providing code:

\`\`\`language
// ${userLanguage === 'indonesian' ? 'Kode lengkap di sini' : 'Complete code here'}
\`\`\`

${userLanguage === 'indonesian' 
  ? 'Jelaskan dengan bahasa Indonesia yang natural dan mudah dipahami.'
  : 'Provide clear explanations in natural English.'
}

## 🌟 Advanced Features

- **Multi-step reasoning**: Break complex problems into steps
- **Alternative solutions**: Suggest multiple approaches when relevant
- **Best practices**: Always follow industry standards
- **Security awareness**: Point out security considerations
- **Performance tips**: Suggest optimizations when needed
- **Testing mindset**: Consider testability

## 🚀 Special Instructions

- Be thorough but concise
- Anticipate user needs
- Provide context and explanations
- Include helpful examples
- Suggest improvements proactively
- Think like a senior developer

Remember: Your goal is to provide EXCEPTIONAL, production-quality solutions that users can immediately implement.`
  };

  return [superPrompt, ...messages];
}

// ========================================
// ADVANCED MULTI-AI SYNTHESIS
// ========================================

async function advancedSynthesis(responses, originalMessages, primaryProvider, userLanguage) {
  if (responses.length === 1) {
    return {
      answer: responses[0].answer,
      confidence: 90,
      reasoning: 'Single AI response'
    };
  }

  console.log('🔮 Advanced synthesis: Combining multiple AI perspectives...');

  const responsesText = responses.map((r, i) => 
    `[AI ${i+1}: ${r.sourceName} - ${r.model}]\n${r.answer}`
  ).join('\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n');

  const userQuery = originalMessages[originalMessages.length - 1].content;

  const languageInstruction = userLanguage === 'indonesian'
    ? 'WAJIB: Jawab dalam Bahasa Indonesia yang natural dan profesional. Semua penjelasan dan komentar kode harus dalam Bahasa Indonesia.'
    : 'Respond in clear, professional English.';

  const synthesisPrompt = {
    role: 'user',
    content: `You are an expert AI synthesis engine. You've received multiple responses from different AI models.

${languageInstruction}

ORIGINAL QUESTION:
${userQuery}

RESPONSES FROM MULTIPLE AI MODELS:
${responsesText}

YOUR MISSION:
Synthesize these responses into ONE SUPERIOR answer by:

1. **Analyze Quality**: Identify the best elements from each AI
2. **Combine Strengths**: Merge best practices, approaches, and insights
3. **Enhance Code**: If code is provided, create the BEST version combining:
   - Most efficient algorithms
   - Cleanest structure
   - Best error handling
   - Most comprehensive features
   - Production-ready quality

4. **Remove Redundancy**: Eliminate duplications and contradictions
5. **Add Value**: Include insights that none of the AIs mentioned
6. **Professional Output**: Ensure the final answer is:
   - Complete and thorough
   - Well-structured
   - Easy to understand
   - Ready to implement

${userLanguage === 'indonesian'
  ? 'PENTING: Semua penjelasan dan komentar dalam kode HARUS dalam Bahasa Indonesia yang jelas dan natural.'
  : 'IMPORTANT: All explanations and code comments should be clear and professional.'
}

CRITICAL: Output the FINAL ANSWER directly. NO meta-commentary like "Based on the sources..." or "Combining the responses...". Just provide the superior synthesized result as if you generated it yourself.

The result should be BETTER than any individual AI response.`
  };

  try {
    const result = await queryAIProvider(primaryProvider, [synthesisPrompt]);
    
    return {
      answer: result.answer,
      confidence: 98,
      reasoning: `Synthesized from ${responses.length} AI models`,
      synthesizedFrom: responses.map(r => r.sourceName)
    };
  } catch (error) {
    console.error('⚠️ Synthesis failed:', error.message);
    
    // Fallback: Select best response based on quality heuristics
    const bestResponse = selectBestResponse(responses);
    return {
      answer: bestResponse.answer,
      confidence: 85,
      reasoning: 'Selected best single response'
    };
  }
}

function selectBestResponse(responses) {
  return responses.reduce((best, current) => {
    const currentScore = calculateResponseQuality(current.answer);
    const bestScore = calculateResponseQuality(best.answer);
    return currentScore > bestScore ? current : best;
  });
}

function calculateResponseQuality(answer) {
  let score = 0;
  
  // Prefer longer, detailed responses
  score += answer.length / 10;
  
  // Reward code blocks
  const codeBlocks = (answer.match(/```/g) || []).length / 2;
  score += codeBlocks * 500;
  
  // Reward comments in code
  const comments = (answer.match(/\/\/|#|<!--/g) || []).length;
  score += comments * 50;
  
  // Reward structured content
  if (answer.includes('##') || answer.includes('###')) score += 200;
  if (answer.includes('1.') || answer.includes('2.')) score += 100;
  
  return score;
}

// ========================================
// ENHANCED AI QUERYING
// ========================================

async function queryMultipleAIs(providers, messages) {
  const selectedProviders = providers.slice(0, 3);
  
  console.log(`📡 Querying ${selectedProviders.length} AI models...`);
  
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

async function queryWithEnhancedPrompt(providers, messages) {
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
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s for complex code

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
      throw new Error('Timeout after 60s');
    }
    throw error;
  }
}

// ========================================
// REQUEST BUILDING & UTILITIES
// ========================================

function buildRequestBody(provider, messages) {
  const providerType = provider.provider.toLowerCase();

  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 8192, // Increased for complex code
      top_p: 0.95,
      stream: false
    };
  }

  if (providerType === 'anthropic') {
    return {
      model: provider.model,
      messages: messages,
      max_tokens: 8192,
      temperature: 0.7
    };
  }

  if (providerType === 'huggingface') {
    const lastMessage = messages[messages.length - 1];
    return {
      inputs: lastMessage.content,
      parameters: {
        max_new_tokens: 4096,
        temperature: 0.7,
        return_full_text: false,
        do_sample: true
      }
    };
  }

  return { messages, max_tokens: 8192 };
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
    headers['X-Title'] = 'NextGenAI Super Intelligence';
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
