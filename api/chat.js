// api/chat.js
// Backend yang baca config AI dari client (admin panel)

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

    // Get AI sources from request (dari admin panel)
    // atau fallback ke environment variables (untuk backward compatibility)
    let enabledProviders = [];

    if (aiSources && Array.isArray(aiSources) && aiSources.length > 0) {
      // Dari admin panel
      enabledProviders = aiSources
        .filter(s => s.enabled && s.apiKey && s.apiKey.length > 5)
        .sort((a, b) => a.priority - b.priority);
    } else {
      // Fallback: dari environment variables
      enabledProviders = getDefaultProviders();
    }

    if (enabledProviders.length === 0) {
      return res.status(500).json({
        error: 'No AI providers configured',
        message: 'Please configure at least one AI source in Admin Panel',
        hint: 'Go to /admin.html to setup API keys'
      });
    }

    console.log(`Using ${enabledProviders.length} AI providers:`, enabledProviders.map(p => p.name));

    // SMART MODE: Query multiple AIs
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
        console.error('Smart mode failed, falling back to fast mode:', error);
      }
    }

    // FAST MODE: Query with fallback
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
      details: 'Check your AI sources configuration in Admin Panel'
    });
  }
}

// Get default providers dari environment variables (fallback)
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
      name: 'OpenRouter (GPT-3.5)',
      provider: 'openrouter',
      model: 'openai/gpt-3.5-turbo',
      apiKey: process.env.OPENROUTER_API_KEY,
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      priority: 2,
      enabled: true
    });
  }

  if (process.env.HUGGINGFACE_API_KEY) {
    providers.push({
      name: 'HuggingFace (Mistral)',
      provider: 'huggingface',
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      apiKey: process.env.HUGGINGFACE_API_KEY,
      endpoint: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      priority: 3,
      enabled: true
    });
  }

  return providers;
}

// Query multiple AIs
async function queryMultipleAIs(providers, messages) {
  const queries = providers.slice(0, 3).map(provider => // Max 3 untuk speed
    queryAIProvider(provider, messages)
      .catch(error => {
        console.error(`${provider.name} failed:`, error.message);
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

// Query with fallback
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
  const timeout = setTimeout(() => controller.abort(), 30000);

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
      answer
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Timeout after 30s');
    }
    throw error;
  }
}

// Build request body
function buildRequestBody(provider, messages) {
  if (['groq', 'openrouter', 'openai'].includes(provider.provider)) {
    return {
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false
    };
  }

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

  if (provider.provider === 'anthropic') {
    return {
      model: provider.model,
      messages: messages,
      max_tokens: 2048
    };
  }

  return { messages };
}

// Build headers
function buildHeaders(provider) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (provider.provider === 'groq' || provider.provider === 'openai') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  if (provider.provider === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'https://yourdomain.com';
    headers['X-Title'] = 'Self-Learning AI';
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

// Extract answer
function extractAnswer(provider, data) {
  if (['groq', 'openrouter', 'openai'].includes(provider.provider)) {
    return data.choices?.[0]?.message?.content || '';
  }

  if (provider.provider === 'huggingface') {
    if (Array.isArray(data)) {
      return data[0]?.generated_text || '';
    }
    return data.generated_text || '';
  }

  if (provider.provider === 'anthropic') {
    return data.content?.[0]?.text || '';
  }

  return data.response || data.output || '';
}

// Synthesize responses
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
Kamu adalah AI yang belajar dari AI lain. Berikut pertanyaan dan jawaban dari berbagai AI:

PERTANYAAN: ${originalMessages[originalMessages.length - 1].content}

JAWABAN DARI BERBAGAI AI:
${responsesText}

TUGAS:
Analisis semua jawaban dan gabungkan menjadi jawaban terbaik yang komprehensif.
Ambil insight terbaik dari setiap AI. Buang yang salah/bertentangan.
Jawab dalam bahasa Indonesia, langsung tanpa preamble.
`;

  try {
    const result = await queryAIProvider(primaryProvider, [
      { role: 'user', content: synthesisPrompt }
    ]);
    
    return {
      answer: result.answer,
      confidence: 90
    };
  } catch (error) {
    console.error('Synthesis failed:', error);
    return {
      answer: responses[0].answer,
      confidence: 75
    };
  }
}
