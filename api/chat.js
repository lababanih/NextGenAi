// api/chat.js
// Backend API dengan multi-AI fallback system
// User TIDAK perlu setup API key - semua di backend!

export default async function handler(req, res) {
  // CORS headers
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
    const { messages, mode = 'smart' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Daftar AI providers (urut berdasarkan priority)
    const aiProviders = [
      {
        name: 'Groq (Llama 3.3 70B)',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        priority: 1,
        enabled: !!process.env.GROQ_API_KEY
      },
      {
        name: 'Groq (Llama 3.1 70B)',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        priority: 2,
        enabled: !!process.env.GROQ_API_KEY
      },
      {
        name: 'OpenRouter (GPT-4 Free)',
        provider: 'openrouter',
        model: 'openai/gpt-3.5-turbo',
        apiKey: process.env.OPENROUTER_API_KEY,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        priority: 3,
        enabled: !!process.env.OPENROUTER_API_KEY
      },
      {
        name: 'OpenRouter (Claude)',
        provider: 'openrouter',
        model: 'anthropic/claude-3-haiku',
        apiKey: process.env.OPENROUTER_API_KEY,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        priority: 4,
        enabled: !!process.env.OPENROUTER_API_KEY
      },
      {
        name: 'HuggingFace (Mistral)',
        provider: 'huggingface',
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        apiKey: process.env.HUGGINGFACE_API_KEY,
        endpoint: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
        priority: 5,
        enabled: !!process.env.HUGGINGFACE_API_KEY
      }
    ];

    // Filter hanya yang enabled dan ada API key
    const enabledProviders = aiProviders.filter(p => p.enabled);

    if (enabledProviders.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured',
        message: 'Admin: Please set at least one API key in Vercel environment variables'
      });
    }

    // SMART MODE: Query semua AI dan sintesis
    if (mode === 'smart' && enabledProviders.length > 1) {
      try {
        const responses = await queryMultipleAIs(enabledProviders, messages);
        const synthesized = await synthesizeResponses(responses, messages, enabledProviders[0]);
        
        return res.json({
          answer: synthesized.answer,
          mode: 'smart',
          sources: responses.map(r => r.sourceName),
          confidence: synthesized.confidence || 85
        });
      } catch (error) {
        console.error('Smart mode failed, falling back:', error);
        // Fallback ke fast mode jika smart gagal
      }
    }

    // FAST MODE atau FALLBACK: Query dengan retry mechanism
    const result = await queryWithFallback(enabledProviders, messages);
    
    return res.json({
      answer: result.answer,
      mode: 'fast',
      source: result.sourceName,
      confidence: 80
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'All AI providers failed',
      message: error.message,
      details: 'Please contact admin to check API keys configuration'
    });
  }
}

// Query multiple AIs in parallel
async function queryMultipleAIs(providers, messages) {
  const queries = providers.map(provider => 
    queryAIProvider(provider, messages)
      .catch(error => {
        console.error(`${provider.name} failed:`, error.message);
        return null;
      })
  );

  const results = await Promise.all(queries);
  const validResults = results.filter(r => r !== null);

  if (validResults.length === 0) {
    throw new Error('All AI providers failed to respond');
  }

  return validResults;
}

// Query with fallback (try each provider until one succeeds)
async function queryWithFallback(providers, messages) {
  let lastError = null;

  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name}...`);
      const result = await queryAIProvider(provider, messages);
      console.log(`✅ ${provider.name} succeeded`);
      return result;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

// Query single AI provider
async function queryAIProvider(provider, messages) {
  const requestBody = buildRequestBody(provider, messages);
  const headers = buildHeaders(provider);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

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
      throw new Error(`${provider.name} API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const answer = extractAnswer(provider, data);

    if (!answer || answer.trim().length === 0) {
      throw new Error(`${provider.name} returned empty response`);
    }

    return {
      sourceName: provider.name,
      provider: provider.provider,
      model: provider.model,
      answer
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`${provider.name} timeout after 30s`);
    }
    throw error;
  }
}

// Build request body based on provider
function buildRequestBody(provider, messages) {
  // OpenAI-compatible (Groq, OpenRouter, OpenAI)
  if (['groq', 'openrouter', 'openai'].includes(provider.provider)) {
    return {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false
    };
  }

  // HuggingFace
  if (provider.provider === 'huggingface') {
    const lastMessage = messages[messages.length - 1];
    return {
      inputs: lastMessage.content,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
        return_full_text: false
      }
    };
  }

  // Anthropic
  if (provider.provider === 'anthropic') {
    return {
      model: provider.model,
      messages: messages,
      max_tokens: 2048
    };
  }

  return { messages };
}

// Build headers based on provider
function buildHeaders(provider) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (provider.provider === 'groq') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (provider.provider === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://yourdomain.com';
    headers['X-Title'] = 'Self-Learning AI';
  }

  if (provider.provider === 'openai') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (provider.provider === 'anthropic') {
    headers['x-api-key'] = provider.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  if (provider.provider === 'huggingface') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  return headers;
}

// Extract answer from response
function extractAnswer(provider, data) {
  // OpenAI-compatible
  if (['groq', 'openrouter', 'openai'].includes(provider.provider)) {
    return data.choices?.[0]?.message?.content || '';
  }

  // HuggingFace
  if (provider.provider === 'huggingface') {
    if (Array.isArray(data)) {
      return data[0]?.generated_text || '';
    }
    return data.generated_text || '';
  }

  // Anthropic
  if (provider.provider === 'anthropic') {
    return data.content?.[0]?.text || '';
  }

  return data.response || data.output || JSON.stringify(data);
}

// Synthesize multiple responses into one better answer
async function synthesizeResponses(responses, originalMessages, primaryProvider) {
  if (responses.length === 1) {
    return {
      answer: responses[0].answer,
      confidence: 80
    };
  }

  const responsesText = responses.map((r, i) => 
    `[AI ${i+1} - ${r.sourceName}]:\n${r.answer}`
  ).join('\n\n---\n\n');

  const synthesisPrompt = `
Kamu adalah AI yang belajar dari AI lain. Berikut adalah pertanyaan dan jawaban dari berbagai AI:

PERTANYAAN: ${originalMessages[originalMessages.length - 1].content}

JAWABAN DARI BERBAGAI AI:
${responsesText}

TUGAS:
1. Analisis semua jawaban di atas
2. Gabungkan menjadi jawaban yang lebih baik dan lengkap
3. Ambil insight terbaik dari setiap AI
4. Buang informasi yang salah atau bertentangan
5. Jawab dalam bahasa Indonesia

Berikan jawaban final yang komprehensif (JANGAN format JSON, langsung jawab saja):
`;

  try {
    const synthesisMessages = [
      { role: 'user', content: synthesisPrompt }
    ];

    const result = await queryAIProvider(primaryProvider, synthesisMessages);
    
    return {
      answer: result.answer,
      confidence: 90
    };
  } catch (error) {
    console.error('Synthesis failed, using first response:', error);
    return {
      answer: responses[0].answer,
      confidence: 75
    };
  }
}

/*
SETUP INSTRUCTIONS FOR ADMIN:

1. Buka Vercel Dashboard
2. Pilih project Anda
3. Go to Settings → Environment Variables
4. Tambahkan minimal 1 API key (recommended: semua):

   GROQ_API_KEY=gsk_...
   OPENROUTER_API_KEY=sk-or-...
   HUGGINGFACE_API_KEY=hf_...

5. Redeploy project
6. DONE! User tinggal pakai tanpa setup!

API KEYS (semua gratis atau ada free tier):
- Groq: https://console.groq.com/ (GRATIS, RECOMMENDED)
- OpenRouter: https://openrouter.ai/ (ada free models)
- HuggingFace: https://huggingface.co/settings/tokens (GRATIS)

FEATURES:
✅ Multi-AI fallback (jika 1 gagal, pakai yang lain)
✅ Auto-retry mechanism
✅ Smart mode (belajar dari multiple AI)
✅ Fast mode (query 1 AI dengan fallback)
✅ Timeout protection (30s)
✅ Error handling yang robust
✅ User tidak perlu setup apapun!

TESTING:
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Halo"}]}'
*/
