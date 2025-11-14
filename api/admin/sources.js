// api/admin/sources.js
// Manage AI sources configuration

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Load AI sources configuration
    if (req.method === 'GET') {
      const sources = await loadAISources();
      return res.json({ sources });
    }

    // POST: Save AI sources configuration
    if (req.method === 'POST') {
      const { sources } = req.body;
      await saveAISources(sources);
      return res.json({ success: true, message: 'Sources saved' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Admin sources error:', error);
    return res.status(500).json({ 
      error: 'Failed to manage sources',
      message: error.message 
    });
  }
}

// Load AI sources dari storage
async function loadAISources() {
  try {
    // Opsi 1: Dari environment variables (simple)
    if (process.env.AI_SOURCES) {
      return JSON.parse(process.env.AI_SOURCES);
    }

    // Opsi 2: Dari Vercel KV (recommended)
    // const { kv } = await import('@vercel/kv');
    // const sources = await kv.get('ai_sources');
    // if (sources) return sources;

    // Opsi 3: Dari Supabase/Database
    // const sources = await db.query('SELECT * FROM ai_sources');
    // return sources;

    // Default sources jika belum ada config
    return getDefaultSources();
  } catch (error) {
    console.error('Load sources error:', error);
    return getDefaultSources();
  }
}

// Save AI sources ke storage
async function saveAISources(sources) {
  try {
    // Opsi 1: Ke Vercel KV (recommended)
    // const { kv } = await import('@vercel/kv');
    // await kv.set('ai_sources', sources);

    // Opsi 2: Ke Supabase/Database
    // await db.query('UPDATE ai_sources SET config = $1', [JSON.stringify(sources)]);

    // Opsi 3: Ke file (untuk development)
    // await fs.writeFile('./config/ai_sources.json', JSON.stringify(sources, null, 2));

    // Untuk sekarang, log saja (implement storage sesuai kebutuhan)
    console.log('Sources to save:', sources);
    return true;
  } catch (error) {
    console.error('Save sources error:', error);
    throw error;
  }
}

function getDefaultSources() {
  return [
    {
      id: 'groq-llama-90b',
      name: 'Groq (Llama 3.2 90B)',
      provider: 'groq',
      model: 'llama-3.2-90b-vision-preview',
      apiKey: process.env.GROQ_API_KEY || '',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      enabled: true,
      priority: 1,
      status: 'active',
      description: 'Super cepat, gratis, excellent untuk coding'
    },
    {
      id: 'openrouter-gpt4',
      name: 'OpenRouter (GPT-4)',
      provider: 'openrouter',
      model: 'openai/gpt-4',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      enabled: !!process.env.OPENROUTER_API_KEY,
      priority: 2,
      status: 'active',
      description: 'Best quality, comprehensive answers'
    },
    {
      id: 'openrouter-claude',
      name: 'OpenRouter (Claude 3.5)',
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      enabled: !!process.env.OPENROUTER_API_KEY,
      priority: 3,
      status: 'active',
      description: 'Excellent reasoning, good for analysis'
    }
  ];
}


// api/admin/test.js
// Test AI source connection

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { source } = req.body;

    if (!source || !source.endpoint || !source.apiKey) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid source configuration' 
      });
    }

    // Test query
    const testQuestion = "Say 'Hello' in one word only.";

    // Build request based on provider
    const requestBody = buildRequestBody(source, testQuestion);
    const headers = buildHeaders(source);

    // Make test request
    const response = await fetch(source.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      return res.json({
        success: false,
        error: `API returned ${response.status}: ${error}`
      });
    }

    const data = await response.json();
    const aiResponse = extractResponse(source.provider, data);

    return res.json({
      success: true,
      response: aiResponse,
      latency: response.headers.get('x-response-time') || 'N/A'
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.json({
      success: false,
      error: error.message
    });
  }
}

function buildRequestBody(source, question) {
  // OpenAI-compatible format (Groq, OpenRouter, OpenAI)
  if (['groq', 'openrouter', 'openai'].includes(source.provider)) {
    return {
      model: source.model,
      messages: [{ role: 'user', content: question }],
      max_tokens: 50,
      temperature: 0.5
    };
  }

  // Anthropic format
  if (source.provider === 'anthropic') {
    return {
      model: source.model,
      messages: [{ role: 'user', content: question }],
      max_tokens: 50
    };
  }

  // HuggingFace format
  if (source.provider === 'huggingface') {
    return {
      inputs: question,
      parameters: {
        max_new_tokens: 50,
        temperature: 0.5
      }
    };
  }

  // Custom/default format
  return {
    prompt: question,
    max_tokens: 50
  };
}

function buildHeaders(source) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Groq
  if (source.provider === 'groq') {
    headers['Authorization'] = `Bearer ${source.apiKey}`;
  }

  // OpenRouter
  if (source.provider === 'openrouter') {
    headers['Authorization'] = `Bearer ${source.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'http://localhost:3000';
  }

  // OpenAI
  if (source.provider === 'openai') {
    headers['Authorization'] = `Bearer ${source.apiKey}`;
  }

  // Anthropic
  if (source.provider === 'anthropic') {
    headers['x-api-key'] = source.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  // HuggingFace
  if (source.provider === 'huggingface') {
    headers['Authorization'] = `Bearer ${source.apiKey}`;
  }

  return headers;
}

function extractResponse(provider, data) {
  // OpenAI-compatible format
  if (['groq', 'openrouter', 'openai'].includes(provider)) {
    return data.choices?.[0]?.message?.content || 'No response';
  }

  // Anthropic format
  if (provider === 'anthropic') {
    return data.content?.[0]?.text || 'No response';
  }

  // HuggingFace format
  if (provider === 'huggingface') {
    return data[0]?.generated_text || 'No response';
  }

  // Default
  return data.response || data.output || JSON.stringify(data);
}


// api/learn.js (UPDATED - menggunakan dynamic AI sources)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, mode = 'smart' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Load configured AI sources
    const allSources = await loadAISources();
    const enabledSources = allSources
      .filter(s => s.enabled && s.apiKey)
      .sort((a, b) => a.priority - b.priority);

    if (enabledSources.length === 0) {
      return res.status(500).json({ 
        error: 'No AI sources configured',
        message: 'Please configure at least one AI source in admin panel'
      });
    }

    // STEP 1: Check memory (if fast mode)
    if (mode === 'fast') {
      const memory = await checkMemory(question);
      if (memory) {
        return res.json({
          answer: memory.answer,
          source: 'memory',
          confidence: memory.confidence,
          learnedFrom: memory.learnedFrom
        });
      }
    }

    // STEP 2: Query all enabled AI sources
    const queries = enabledSources.map(source => 
      queryAISource(source, question)
    );

    const results = await Promise.allSettled(queries);
    
    const validResponses = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    if (validResponses.length === 0) {
      throw new Error('All AI sources failed to respond');
    }

    // STEP 3: Synthesize knowledge
    const synthesis = await synthesizeKnowledge(question, validResponses, enabledSources[0]);

    // STEP 4: Save to memory
    await saveToMemory(question, synthesis, validResponses);

    return res.json({
      answer: synthesis.answer,
      source: 'learned',
      learnedFrom: validResponses.map(r => r.sourceName),
      confidence: synthesis.confidence,
      improvementSuggestions: synthesis.improvements
    });

  } catch (error) {
    console.error('Learning error:', error);
    return res.status(500).json({ 
      error: 'Learning process failed',
      message: error.message 
    });
  }
}

// Query individual AI source
async function queryAISource(source, question) {
  try {
    const requestBody = buildRequestBody(source, question);
    const headers = buildHeaders(source);

    const response = await fetch(source.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`${source.name} failed: ${response.status}`);
    }

    const data = await response.json();
    const answer = extractResponse(source.provider, data);

    return {
      sourceName: source.name,
      sourceId: source.id,
      provider: source.provider,
      model: source.model,
      answer
    };
  } catch (error) {
    console.error(`Error querying ${source.name}:`, error);
    return null;
  }
}

// Synthesize from multiple responses
async function synthesizeKnowledge(question, responses, primarySource) {
  const responsesText = responses.map((r, i) => 
    `[AI ${i+1} - ${r.sourceName}]:\n${r.answer}`
  ).join('\n\n---\n\n');

  const synthesisPrompt = `
You are an AI that learns from other AIs. Here is a question and answers from various AI sources:

QUESTION: ${question}

ANSWERS FROM VARIOUS AIs:
${responsesText}

YOUR TASK:
1. Analyze all answers above
2. Extract the best insights from each AI
3. Combine into a better, more comprehensive answer
4. Remove any incorrect or contradictory information
5. Provide a confidence score (0-100%)

Respond in JSON format only:
{
  "answer": "your synthesized comprehensive answer",
  "confidence": 85,
  "improvements": ["what you learned from these answers"]
}
`;

  try {
    const requestBody = buildRequestBody(primarySource, synthesisPrompt);
    const headers = buildHeaders(primarySource);

    const response = await fetch(primarySource.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...requestBody,
        temperature: 0.5,
        max_tokens: 3000
      })
    });

    const data = await response.json();
    const synthesisText = extractResponse(primarySource.provider, data);
    
    // Try to parse JSON, fallback to raw text
    try {
      return JSON.parse(synthesisText);
    } catch {
      return {
        answer: synthesisText,
        confidence: 75,
        improvements: ['Synthesized from multiple AI sources']
      };
    }
  } catch (error) {
    console.error('Synthesis error:', error);
    // Fallback: return first response
    return {
      answer: responses[0].answer,
      confidence: 60,
      improvements: ['Used fallback synthesis']
    };
  }
}

async function checkMemory(question) {
  // TODO: Implement memory checking
  return null;
}

async function saveToMemory(question, synthesis, sources) {
  // TODO: Implement memory saving
  console.log('Would save to memory:', { question, synthesis, sources });
}

// Import shared functions
async function loadAISources() {
  // Reuse from sources.js
  return getDefaultSources();
}

function getDefaultSources() {
  return [
    {
      id: 'groq-llama-90b',
      name: 'Groq (Llama 3.2 90B)',
      provider: 'groq',
      model: 'llama-3.2-90b-vision-preview',
      apiKey: process.env.GROQ_API_KEY || '',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      enabled: true,
      priority: 1
    }
  ];
}

/*
IMPLEMENTASI STORAGE OPTIONS:

1. VERCEL KV (Recommended - Super Easy):
   - Install: npm install @vercel/kv
   - Create KV database di Vercel Dashboard
   - Auto-connect via environment variables
   - Usage: await kv.set('ai_sources', sources)

2. SUPABASE (Advanced Features):
   - Create table: ai_sources
   - Store: id, config (jsonb), updated_at
   - Pros: SQL queries, relationships, advanced features

3. ENVIRONMENT VARIABLES (Simple):
   - Set AI_SOURCES in Vercel env vars
   - JSON.parse(process.env.AI_SOURCES)
   - Cons: Manual update, limited flexibility

4. FILE SYSTEM (Development Only):
   - fs.writeFile('./config/ai_sources.json')
   - NOT available in Vercel serverless
   - Use for local development only
*/
