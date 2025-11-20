// api/admin/env-status.js - CommonJS Version (guaranteed to work)
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const maskKey = (key) => key ? key.substring(0, 4) + '...' + key.substring(key.length - 4) : null;
    const hasEnv = (key) => !!(process.env[key] && process.env[key].length > 0);

    const authConfig = {
      adminEmails: hasEnv('ADMIN_EMAILS') ? process.env.ADMIN_EMAILS.split(',').length : 0,
      adminPassword: hasEnv('ADMIN_PASSWORD'),
      jwtSecret: hasEnv('JWT_SECRET'),
      jwtSecretLength: (process.env.JWT_SECRET || '').length,
      isSecure: (process.env.JWT_SECRET || '').length >= 32
    };

    const aiProviders = {
      groq: {
        configured: hasEnv('GROQ_API_KEY'),
        key: hasEnv('GROQ_API_KEY') ? maskKey(process.env.GROQ_API_KEY) : null,
        models: ['llama-3.3-70b', 'llama-3.1-70b']
      },
      google: {
        configured: hasEnv('GOOGLE_API_KEY'),
        key: hasEnv('GOOGLE_API_KEY') ? maskKey(process.env.GOOGLE_API_KEY) : null,
        models: ['gemini-pro', 'gemini-flash']
      },
      openrouter: {
        configured: hasEnv('OPENROUTER_API_KEY'),
        key: hasEnv('OPENROUTER_API_KEY') ? maskKey(process.env.OPENROUTER_API_KEY) : null,
        models: ['Multiple models']
      }
    };

    const mongoDBs = [];
    for (let i = 1; i <= 10; i++) {
      if (hasEnv(`MONGODB_URI_${i}`)) {
        mongoDBs.push({
          id: i,
          name: process.env[`MONGODB_NAME_${i}`] || `MongoDB ${i}`,
          database: process.env[`MONGODB_DB_${i}`] || 'nextgenai',
          uri: maskKey(process.env[`MONGODB_URI_${i}`]),
          configured: true
        });
      }
    }

    const supabaseDbs = [];
    for (let i = 1; i <= 5; i++) {
      if (hasEnv(`SUPABASE_URL_${i}`) && hasEnv(`SUPABASE_KEY_${i}`)) {
        supabaseDbs.push({
          id: i,
          name: process.env[`SUPABASE_NAME_${i}`] || `Supabase ${i}`,
          url: process.env[`SUPABASE_URL_${i}`],
          key: maskKey(process.env[`SUPABASE_KEY_${i}`]),
          configured: true
        });
      }
    }

    const vercelKV = {
      configured: hasEnv('KV_REST_API_URL') && hasEnv('KV_REST_API_TOKEN'),
      url: process.env.KV_REST_API_URL || null,
      token: hasEnv('KV_REST_API_TOKEN') ? maskKey(process.env.KV_REST_API_TOKEN) : null
    };

    const storage = {
      mongodb: { count: mongoDBs.length, perDB: 512, total: mongoDBs.length * 512 },
      supabase: { count: supabaseDbs.length, perDB: 500, total: supabaseDbs.length * 500 },
      vercelKV: { configured: vercelKV.configured, capacity: vercelKV.configured ? 256 : 0 },
      total: (mongoDBs.length * 512) + (supabaseDbs.length * 500) + (vercelKV.configured ? 256 : 0)
    };

    const deployment = {
      vercelUrl: process.env.VERCEL_URL || null,
      nodeEnv: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };

    const hasAnyAI = aiProviders.groq.configured || aiProviders.google.configured || aiProviders.openrouter.configured;
    const hasAnyDB = mongoDBs.length > 0 || supabaseDbs.length > 0 || vercelKV.configured;
    
    const warnings = [];
    if (!authConfig.isSecure) warnings.push('JWT_SECRET < 32 chars');
    if (!hasAnyAI) warnings.push('No AI provider');
    if (!hasAnyDB) warnings.push('No database');

    const status = {
      overall: (authConfig.adminPassword && authConfig.jwtSecret && hasAnyAI) ? 'healthy' : 'needs_attention',
      ready: authConfig.adminPassword && authConfig.jwtSecret && hasAnyAI,
      hasAuth: authConfig.adminPassword && authConfig.jwtSecret,
      hasAI: hasAnyAI,
      hasStorage: hasAnyDB,
      warnings
    };

    return res.status(200).json({
      success: true,
      status,
      auth: authConfig,
      aiProviders,
      databases: { mongodb: mongoDBs, supabase: supabaseDbs, vercelKV },
      storage,
      deployment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal error',
      message: error.message
    });
  }
};
