// api/admin/env-status.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized - No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Simple token verification
    if (!token || token.length < 10) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token format' 
      });
    }

    // Helper function to mask sensitive data
    const maskKey = (key) => {
      if (!key) return null;
      if (key.length <= 8) return '***';
      return key.substring(0, 4) + '...' + key.substring(key.length - 4);
    };

    // Helper to check if env var exists
    const hasEnv = (key) => {
      const value = process.env[key];
      return !!(value && value.length > 0);
    };

    // Check Authentication Config
    const authConfig = {
      adminEmails: hasEnv('ADMIN_EMAILS') ? (process.env.ADMIN_EMAILS || '').split(',').length : 0,
      adminPassword: hasEnv('ADMIN_PASSWORD'),
      jwtSecret: hasEnv('JWT_SECRET'),
      jwtSecretLength: (process.env.JWT_SECRET || '').length,
      isSecure: (process.env.JWT_SECRET || '').length >= 32
    };

    // Check AI Providers
    const aiProviders = {
      groq: {
        configured: hasEnv('GROQ_API_KEY'),
        key: hasEnv('GROQ_API_KEY') ? maskKey(process.env.GROQ_API_KEY) : null,
        models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile']
      },
      google: {
        configured: hasEnv('GOOGLE_API_KEY'),
        key: hasEnv('GOOGLE_API_KEY') ? maskKey(process.env.GOOGLE_API_KEY) : null,
        models: ['gemini-pro', 'gemini-1.5-flash']
      },
      openrouter: {
        configured: hasEnv('OPENROUTER_API_KEY'),
        key: hasEnv('OPENROUTER_API_KEY') ? maskKey(process.env.OPENROUTER_API_KEY) : null,
        models: ['Multiple models available']
      }
    };

    // Check MongoDB Databases (up to 10)
    const mongoDBs = [];
    for (let i = 1; i <= 10; i++) {
      const uriKey = `MONGODB_URI_${i}`;
      const dbKey = `MONGODB_DB_${i}`;
      const nameKey = `MONGODB_NAME_${i}`;
      
      if (hasEnv(uriKey)) {
        const uri = process.env[uriKey] || '';
        const dbName = process.env[dbKey] || 'nextgenai';
        const customName = process.env[nameKey] || `MongoDB ${i}`;
        
        mongoDBs.push({
          id: i,
          name: customName,
          database: dbName,
          uri: maskKey(uri),
          configured: true
        });
      }
    }

    // Check Supabase Databases (up to 5)
    const supabaseDbs = [];
    for (let i = 1; i <= 5; i++) {
      const urlKey = `SUPABASE_URL_${i}`;
      const keyKey = `SUPABASE_KEY_${i}`;
      const nameKey = `SUPABASE_NAME_${i}`;
      
      if (hasEnv(urlKey) && hasEnv(keyKey)) {
        supabaseDbs.push({
          id: i,
          name: process.env[nameKey] || `Supabase ${i}`,
          url: process.env[urlKey] || '',
          key: maskKey(process.env[keyKey] || ''),
          configured: true
        });
      }
    }

    // Check Vercel KV
    const vercelKV = {
      configured: hasEnv('KV_REST_API_URL') && hasEnv('KV_REST_API_TOKEN'),
      url: hasEnv('KV_REST_API_URL') ? process.env.KV_REST_API_URL : null,
      token: hasEnv('KV_REST_API_TOKEN') ? maskKey(process.env.KV_REST_API_TOKEN || '') : null
    };

    // Calculate storage capacity
    const storageCapacity = {
      mongodb: {
        count: mongoDBs.length,
        perDB: 512,
        total: mongoDBs.length * 512
      },
      supabase: {
        count: supabaseDbs.length,
        perDB: 500,
        total: supabaseDbs.length * 500
      },
      vercelKV: {
        configured: vercelKV.configured,
        capacity: vercelKV.configured ? 256 : 0
      },
      total: (mongoDBs.length * 512) + (supabaseDbs.length * 500) + (vercelKV.configured ? 256 : 0)
    };

    // Check deployment info
    const deployment = {
      vercelUrl: process.env.VERCEL_URL || null,
      nodeEnv: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };

    // Overall status
    const hasAnyAI = aiProviders.groq.configured || aiProviders.google.configured || aiProviders.openrouter.configured;
    const hasAnyDB = mongoDBs.length > 0 || supabaseDbs.length > 0 || vercelKV.configured;
    
    const warnings = [];
    if (!authConfig.isSecure) {
      warnings.push('JWT_SECRET should be at least 32 characters');
    }
    if (!hasAnyAI) {
      warnings.push('No AI provider configured');
    }
    if (!hasAnyDB) {
      warnings.push('No database configured (learning features disabled)');
    }

    const status = {
      overall: (authConfig.adminPassword && authConfig.jwtSecret && hasAnyAI) ? 'healthy' : 'needs_attention',
      ready: authConfig.adminPassword && authConfig.jwtSecret && hasAnyAI,
      hasAuth: authConfig.adminPassword && authConfig.jwtSecret,
      hasAI: hasAnyAI,
      hasStorage: hasAnyDB,
      warnings
    };

    // Return complete status
    return res.status(200).json({
      success: true,
      status,
      auth: authConfig,
      aiProviders,
      databases: {
        mongodb: mongoDBs,
        supabase: supabaseDbs,
        vercelKV
      },
      storage: storageCapacity,
      deployment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Env status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get environment status',
      message: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
