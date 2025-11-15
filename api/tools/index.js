// api/tools/index.js
// Unified Tool API Router

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
    const { tool, ...params } = req.body;

    switch (tool) {
      case 'websearch':
        return await handleWebSearch(req, res, params);
      case 'coderun':
        return await handleCodeExecution(req, res, params);
      case 'imagegen':
        return await handleImageGeneration(req, res, params);
      case 'imageanalyze':
        return await handleImageAnalysis(req, res, params);
      default:
        return res.status(400).json({ error: 'Invalid tool' });
    }
  } catch (error) {
    console.error('Tool API error:', error);
    return res.status(500).json({
      error: 'Tool execution failed',
      message: error.message
    });
  }
}

// ========================================
// 1. WEB SEARCH TOOL (Brave Search API)
// ========================================
async function handleWebSearch(req, res, params) {
  try {
    const { query } = params;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    // Option 1: Brave Search API (FREE tier: 2000 queries/month)
    // Get API key from: https://brave.com/search/api/
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;
    
    if (braveApiKey) {
      const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': braveApiKey
        }
      });

      if (!response.ok) {
        throw new Error('Brave Search API failed');
      }

      const data = await response.json();
      
      const results = data.web?.results?.slice(0, 5).map(r => ({
        title: r.title,
        url: r.url,
        description: r.description,
        snippet: r.description
      })) || [];

      return res.json({
        success: true,
        results,
        source: 'brave'
      });
    }

    // Option 2: SerpAPI (Alternative)
    const serpApiKey = process.env.SERP_API_KEY;
    
    if (serpApiKey) {
      const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      const results = data.organic_results?.slice(0, 5).map(r => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet
      })) || [];

      return res.json({
        success: true,
        results,
        source: 'serp'
      });
    }

    // Fallback: No API key configured
    return res.json({
      success: false,
      error: 'No search API configured',
      hint: 'Add BRAVE_SEARCH_API_KEY to environment variables'
    });

  } catch (error) {
    console.error('Web search error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========================================
// 2. CODE EXECUTION TOOL (Piston API - 100% FREE)
// ========================================
async function handleCodeExecution(req, res, params) {
  try {
    const { language, code, stdin } = params;

    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code required' });
    }

    // Piston API - FREE code execution
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language.toLowerCase(),
        version: '*',
        files: [{ content: code }],
        stdin: stdin || ''
      })
    });

    if (!response.ok) {
      throw new Error('Piston API failed');
    }

    const result = await response.json();

    if (result.run) {
      return res.json({
        success: true,
        output: result.run.output || result.run.stdout || '',
        stderr: result.run.stderr || '',
        exitCode: result.run.code,
        language: result.language,
        version: result.version
      });
    } else {
      return res.json({
        success: false,
        error: result.message || 'Execution failed'
      });
    }

  } catch (error) {
    console.error('Code execution error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========================================
// 3. IMAGE GENERATION TOOL (Multiple FREE options)
// ========================================
async function handleImageGeneration(req, res, params) {
  try {
    const { prompt, width = 1024, height = 1024, style = 'realistic' } = params;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    // Option 1: Pollinations.ai (100% FREE, no API key needed)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${Date.now()}`;
    
    return res.json({
      success: true,
      imageUrl: pollinationsUrl,
      provider: 'pollinations',
      prompt,
      note: 'Image URL is ready to use'
    });

    // Option 2: Hugging Face Inference API (FREE with API key)
    // Uncomment if you have HF API key
    /*
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (hfApiKey) {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: prompt })
        }
      );

      const imageBlob = await response.blob();
      const buffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      return res.json({
        success: true,
        imageData: `data:image/png;base64,${base64}`,
        provider: 'huggingface'
      });
    }
    */

  } catch (error) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========================================
// 4. IMAGE ANALYSIS TOOL (Groq Vision - FREE)
// ========================================
async function handleImageAnalysis(req, res, params) {
  try {
    const { imageUrl, imageData, prompt = 'Describe this image in detail.' } = params;

    if (!imageUrl && !imageData) {
      return res.status(400).json({ error: 'Image URL or data required' });
    }

    // Use Groq Vision (Llama 3.2 90B Vision - FREE)
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return res.json({
        success: false,
        error: 'GROQ_API_KEY not configured',
        hint: 'Add Groq API key to environment variables'
      });
    }

    const imageContent = imageData || imageUrl;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: imageContent 
              } 
            }
          ]
        }],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq Vision API failed: ${error}`);
    }

    const data = await response.json();
    
    return res.json({
      success: true,
      analysis: data.choices[0].message.content,
      provider: 'groq-vision',
      model: 'llama-3.2-90b-vision'
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========================================
// HELPER: Get available Piston languages
// ========================================
export async function getAvailableLanguages() {
  try {
    const response = await fetch('https://emkc.org/api/v2/piston/runtimes');
    const languages = await response.json();
    return languages.map(l => ({
      language: l.language,
      version: l.version,
      aliases: l.aliases
    }));
  } catch (error) {
    return [];
  }
}

/*
========================================
SETUP INSTRUCTIONS FOR FREE APIs:
========================================

1. BRAVE SEARCH (2000 free queries/month):
   - Visit: https://brave.com/search/api/
   - Sign up and get API key
   - Add to Vercel: BRAVE_SEARCH_API_KEY=your_key

2. GROQ (FREE - Fast Inference):
   - Visit: https://console.groq.com/
   - Get API key
   - Add to Vercel: GROQ_API_KEY=your_key
   - Supports: Llama 3.2 Vision (FREE)

3. PISTON (100% FREE - Code Execution):
   - No API key needed!
   - Just use: https://emkc.org/api/v2/piston/execute
   - Supports: Python, JS, Java, C++, Go, and 40+ languages

4. POLLINATIONS.AI (100% FREE - Image Gen):
   - No API key needed!
   - Just construct URL with prompt
   - Unlimited usage

5. HUGGING FACE (Optional - Advanced):
   - Visit: https://huggingface.co/settings/tokens
   - Get API key (FREE tier available)
   - Add to Vercel: HUGGINGFACE_API_KEY=your_key
   - Access to Stable Diffusion and more models

========================================
VERCEL ENVIRONMENT VARIABLES:
========================================

Add these to your Vercel project:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - GROQ_API_KEY (required for main AI + vision)
   - BRAVE_SEARCH_API_KEY (optional for web search)
   - HUGGINGFACE_API_KEY (optional for advanced features)

========================================
COST BREAKDOWN:
========================================

FREE Forever:
✅ Piston (Code execution) - Unlimited
✅ Pollinations (Image gen) - Unlimited
✅ Groq (AI inference) - Very generous free tier

FREE with Limits:
✅ Brave Search - 2000 queries/month
✅ HuggingFace - Rate limited but generous

Paid (Optional for Scale):
💰 OpenRouter - Pay per use
💰 OpenAI - Pay per use
💰 Anthropic - Pay per use

========================================
*/
