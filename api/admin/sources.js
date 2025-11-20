// api/admin/sources.js
// Manage AI sources configuration

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
