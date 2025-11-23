// api/admin/env-status.js
// Display environment variables status (READ-ONLY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ==========================================
    // CHECK AUTHENTICATION (Optional)
    // ==========================================
    // Uncomment if you want password protection
    /*
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    */

    // ==========================================
    // COLLECT ENV STATUS
    // ==========================================

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

    // AI Providers
    status.aiProviders = {
      groq: {
        configured: !!process.env.GROQ_API_KEY,
        key: process.env.GROQ_API_KEY ? maskApiKey(process.env.GROQ_API_KEY) : null,
        models: ['llama-3.3-70b', 'llama-3.1-70b']
      },
      google: {
        configured: !!process.env.GOOGLE_API_KEY,
        key: process.env.GOOGLE_API_KEY ? maskApiKey(process.env.GOOGLE_API_KEY) : null,
        models: ['gemini-1.5-pro', 'gemini-1.5-flash']
      },
      openrouter: {
        configured: !!process.env.OPENROUTER_API_KEY,
        key: process.env.OPENROUTER_API_KEY ? maskApiKey(process.env.OPENROUTER_API_KEY) : null,
        models: ['Multiple models']
      }
    };

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
        total: status.databases.mongodb.length * 512 // MB
      },
      supabase: {
        count: status.databases.supabase.length,
        total: status.databases.supabase.length * 500 // MB
      },
      vercelKV: {
        configured: status.databases.vercelKV.configured,
        capacity: status.databases.vercelKV.configured ? 256 : 0 // MB
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

    return res.json(status);

  } catch (error) {
    console.error('Env status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load environment status',
      message: error.message
    });
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function maskApiKey(key) {
  if (!key || key.length < 8) return '***';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

function maskUrl(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname.substring(0, 10)}...`;
  } catch {
    return url.substring(0, 20) + '...';
  }
}
