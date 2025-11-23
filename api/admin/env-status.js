// api/admin/env-status.js
// Environment Status + API Key Testing

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Return status
  if (req.method === 'GET') {
    return getEnvStatus(req, res);
  }

  // POST: Test API key
  if (req.method === 'POST') {
    return testApiKey(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ==========================================
// GET ENV STATUS
// ==========================================

async function getEnvStatus(req, res) {
  try {
    console.log('📊 Getting environment status...');

    const status = {
      success: true,
      timestamp: new Date().toISOString()
    };

    // Authentication Config
    status.auth = {
      adminEmails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').length : 0,
      adminPassword: !!process.env.ADMIN_PASSWORD,
      jwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      isSecure: process.env.JWT_SECRET ? process.env.JWT_SECRET.length >= 32 : false
    };

    console.log('Auth check:', status.auth);

    // AI Providers with ACTUAL CHECK
    status.aiProviders = {
      groq: {
        configured: !!process.env.GROQ_API_KEY,
        key: process.env.GROQ_API_KEY ? maskApiKey(process.env.GROQ_API_KEY) : null,
        models: ['llama-3.3-70b', 'llama-3.1-70b'],
        tested: false,
        status: 'unknown'
      },
      google: {
        configured: !!process.env.GOOGLE_API_KEY,
        key: process.env.GOOGLE_API_KEY ? maskApiKey(process.env.GOOGLE_API_KEY) : null,
        models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
        tested: false,
        status: 'unknown'
      },
      openrouter: {
        configured: !!process.env.OPENROUTER_API_KEY,
        key: process.env.OPENROUTER_API_KEY ? maskApiKey(process.env.OPENROUTER_API_KEY) : null,
        models: ['Multiple models'],
        tested: false,
        status: 'unknown'
      }
    };

    console.log('AI Providers:', {
      groq: status.aiProviders.groq.configured,
      google: status.aiProviders.google.configured,
      openrouter: status.aiProviders.openrouter.configured
    });

    // MongoDB Databases
    status.databases = {
      mongodb: [],
      supabase: [],
      vercelKV: {
        configured: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
        url: process.env.KV_REST_API_URL ? maskUrl(process.env.KV_REST_API_URL) : null,
        token: process.env.KV_REST_API_TOKEN ? maskApiKey(process.env.KV_REST_API_TOKEN) : null
      }
    };

    // Check MongoDB (1-10)
    for (let i = 1; i <= 10; i++) {
      const uri = process.env[`MONGODB_URI_${i}`];
      const db = process.env[`MONGODB_DB_${i}`];
      const name = process.env[`MONGODB_NAME_${i}`];

      if (uri) {
        status.databases.mongodb.push({
          id: i,
          name: name || `MongoDB ${i}`,
          uri: maskUrl(uri),
          database: db || 'nextgenai'
        });
      }
    }

    // Check Supabase (1-5)
    for (let i = 1; i <= 5; i++) {
      const url = process.env[`SUPABASE_URL_${i}`];
      const key = process.env[`SUPABASE_KEY_${i}`];
      const name = process.env[`SUPABASE_NAME_${i}`];

      if (url && key) {
        status.databases.supabase.push({
          id: i,
          name: name || `Supabase ${i}`,
          url: maskUrl(url),
          key: maskApiKey(key)
        });
      }
    }

    // Storage Capacity
    status.storage = {
      mongodb: {
        count: status.databases.mongodb.length,
        total: status.databases.mongodb.length * 512
      },
      supabase: {
        count: status.databases.supabase.length,
        total: status.databases.supabase.length * 500
      },
      vercelKV: {
        configured: status.databases.vercelKV.configured,
        capacity: status.databases.vercelKV.configured ? 256 : 0
      },
      total: (status.databases.mongodb.length * 512) + 
             (status.databases.supabase.length * 500) + 
             (status.databases.vercelKV.configured ? 256 : 0)
    };

    // Overall Status
    const hasAuth = status.auth.adminPassword && status.auth.jwtSecret;
    const hasAI = Object.values(status.aiProviders).some(p => p.configured);
    const hasStorage = status.storage.total > 0;

    status.status = {
      overall: (hasAuth && hasAI) ? 'healthy' : 'needs-attention',
      hasAuth,
      hasAI,
      hasStorage,
      warnings: []
    };

    // Add warnings
    if (!hasAuth) {
      status.status.warnings.push('Authentication not configured');
    }
    if (status.auth.jwtSecretLength < 32) {
      status.status.warnings.push('JWT_SECRET < 32 chars (insecure)');
    }
    if (!hasAI) {
      status.status.warnings.push('No AI provider configured');
    }
    if (!hasStorage) {
      status.status.warnings.push('No database configured');
    }

    // Deployment Info
    status.deployment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      vercelUrl: process.env.VERCEL_URL || null,
      isProduction: process.env.NODE_ENV === 'production'
    };

    console.log('✅ Status prepared successfully');

    return res.json(status);

  } catch (error) {
    console.error('❌ Env status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load environment status',
      message: error.message
    });
  }
}

// ==========================================
// TEST API KEY
// ==========================================

async function testApiKey(req, res) {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider required (groq, google, or openrouter)' 
      });
    }

    console.log(`🧪 Testing ${provider} API key...`);

    let result;

    switch (provider.toLowerCase()) {
      case 'groq':
        result = await testGroq();
        break;
      case 'google':
        result = await testGoogle();
        break;
      case 'openrouter':
        result = await testOpenRouter();
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid provider' 
        });
    }

    return res.json(result);

  } catch (error) {
    console.error('❌ Test error:', error);
    return res.json({
      success: false,
      error: error.message,
      provider: req.body.provider
    });
  }
}

// ==========================================
// TEST FUNCTIONS
// ==========================================

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'GROQ_API_KEY not set in environment variables',
      provider: 'groq'
    };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "Hello" in one word' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `API returned ${response.status}: ${error.substring(0, 200)}`,
        provider: 'groq'
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || 'No response';

    return {
      success: true,
      message: `✅ Groq API working! Response: "${message}"`,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      provider: 'groq'
    };
  }
}

async function testGoogle() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'GOOGLE_API_KEY not set in environment variables',
      provider: 'google'
    };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: 'Say "Hello" in one word' }] 
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `API returned ${response.status}: ${error.substring(0, 200)}`,
        provider: 'google'
      };
    }

    const data = await response.json();
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    return {
      success: true,
      message: `✅ Google API working! Response: "${message}"`,
      provider: 'google',
      model: 'gemini-1.5-pro'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      provider: 'google'
    };
  }
}

async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'OPENROUTER_API_KEY not set in environment variables',
      provider: 'openrouter'
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "Hello" in one word' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `API returned ${response.status}: ${error.substring(0, 200)}`,
        provider: 'openrouter'
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || 'No response';

    return {
      success: true,
      message: `✅ OpenRouter API working! Response: "${message}"`,
      provider: 'openrouter',
      model: 'gpt-3.5-turbo'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      provider: 'openrouter'
    };
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function maskApiKey(key) {
  if (!key || key.length < 8) return '***';
  return key.substring(0, 8) + '...' + key.substring(key.length - 4);
}

function maskUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname.substring(0, 15)}...`;
  } catch {
    return url.substring(0, 25) + '...';
  }
}
