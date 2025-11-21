// api/learn/index.js
// ENHANCED AUTO-LEARNING SYSTEM WITH MEMORY

import dbManager from '../database/manager.js';
import { getEnabledAISources } from '../config/unified.js';

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
    const { action, data } = req.body;

    // Initialize database manager
    await dbManager.initialize();

    switch (action) {
      case 'query':
        // Smart query: Check memory first, then ask AI
        return await handleSmartQuery(req, res, data);
      
      case 'save':
        // Manually save knowledge
        return await handleSave(req, res, data);
      
      case 'search':
        // Search knowledge base
        return await handleSearch(req, res, data);
      
      case 'auto-learn':
        // Automatically extract and save knowledge from conversation
        return await handleAutoLearn(req, res, data);
      
      case 'status':
        // Get learning system status
        return await handleStatus(req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Learning system error:', error);
    return res.status(500).json({ 
      error: 'Learning failed',
      message: error.message 
    });
  }
}

// ==========================================
// SMART QUERY: Memory-First Approach
// ==========================================

async function handleSmartQuery(req, res, data) {
  const { question, mode = 'smart', language = 'general' } = data;

  if (!question) {
    return res.status(400).json({ error: 'Question required' });
  }

  console.log(`🧠 Smart Query: "${question}"`);

  try {
    // STEP 1: Search memory first (FAST!)
    console.log('  1️⃣ Searching knowledge base...');
    const memoryResults = await dbManager.searchKnowledge(question, {
      language,
      limit: 5
    });

    // If found good match in memory, return immediately
    if (memoryResults.length > 0) {
      const bestMatch = memoryResults[0];
      const similarity = calculateSimilarity(question, bestMatch.topic);

      if (similarity > 0.7) {
        console.log(`  ✅ Found in memory! (${Math.round(similarity * 100)}% match)`);
        
        return res.json({
          answer: formatMemoryAnswer(bestMatch),
          source: 'memory',
          confidence: similarity * 100,
          database: bestMatch.source_db,
          learnedAt: bestMatch.createdAt,
          fast: true
        });
      }
    }

    // STEP 2: No good match, query AIs and learn
    console.log('  2️⃣ No memory match, querying AIs...');
    
    const aiSources = await getEnabledAISources();
    
    if (aiSources.length === 0) {
      return res.status(500).json({
        error: 'No AI sources available',
        message: 'Please configure AI sources in admin panel'
      });
    }

    // Query all AI sources
    const queries = aiSources.slice(0, 3).map(source => 
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
    console.log('  3️⃣ Synthesizing from multiple AIs...');
    const synthesis = await synthesizeKnowledge(question, validResponses, aiSources[0]);

    // STEP 4: Auto-save to memory for future use
    console.log('  4️⃣ Saving to memory for future queries...');
    await autoSaveKnowledge(question, synthesis, language);

    return res.json({
      answer: synthesis.answer,
      source: 'learned',
      learnedFrom: validResponses.map(r => r.sourceName),
      confidence: synthesis.confidence,
      saved: true,
      fast: false
    });

  } catch (error) {
    console.error('Smart query failed:', error);
    return res.status(500).json({ 
      error: 'Query failed',
      message: error.message 
    });
  }
}

// ==========================================
// AI QUERY & SYNTHESIS
// ==========================================

async function queryAISource(source, question) {
  try {
    const requestBody = {
      model: source.model,
      messages: [{ role: 'user', content: question }],
      max_tokens: 2000,
      temperature: 0.7
    };

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

async function synthesizeKnowledge(question, responses, primarySource) {
  const responsesText = responses.map((r, i) => 
    `[AI ${i+1} - ${r.sourceName}]:\n${r.answer}`
  ).join('\n\n---\n\n');

  const synthesisPrompt = `You are a knowledge synthesizer. Analyze these responses and create the BEST answer:

QUESTION: ${question}

RESPONSES FROM MULTIPLE AIs:
${responsesText}

TASK: Create a comprehensive answer that:
1. Combines the best insights from each AI
2. Removes contradictions and redundancies
3. Adds structure and clarity
4. Includes code examples if relevant

Respond in JSON format:
{
  "answer": "your synthesized answer",
  "confidence": 85,
  "key_points": ["point1", "point2"]
}`;

  try {
    const requestBody = {
      model: primarySource.model,
      messages: [{ role: 'user', content: synthesisPrompt }],
      temperature: 0.5,
      max_tokens: 3000
    };

    const headers = buildHeaders(primarySource);

    const response = await fetch(primarySource.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const synthesisText = extractResponse(primarySource.provider, data);
    
    try {
      return JSON.parse(synthesisText);
    } catch {
      return {
        answer: synthesisText,
        confidence: 75,
        key_points: []
      };
    }
  } catch (error) {
    console.error('Synthesis error:', error);
    return {
      answer: responses[0].answer,
      confidence: 60,
      key_points: []
    };
  }
}

// ==========================================
// AUTO-SAVE KNOWLEDGE
// ==========================================

async function autoSaveKnowledge(question, synthesis, language) {
  try {
    // Extract code blocks if present
    const codeBlocks = synthesis.answer.match(/```(\w+)?\n([\s\S]*?)```/g);
    
    let code = null;
    if (codeBlocks && codeBlocks.length > 0) {
      code = codeBlocks.map(block => {
        const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
        return {
          language: match[1] || 'code',
          code: match[2]
        };
      });
    }

    // Generate topic (first 100 chars of question)
    const topic = question.substring(0, 100).trim();

    // Extract tags
    const tags = extractTags(question + ' ' + synthesis.answer);

    // Save to database
    const result = await dbManager.saveKnowledge({
      topic,
      language,
      content: synthesis.answer,
      code: code ? JSON.stringify(code) : null,
      tags,
      metadata: {
        originalQuestion: question,
        confidence: synthesis.confidence,
        keyPoints: synthesis.key_points || [],
        source: 'auto-learned',
        learnedAt: new Date()
      }
    });

    console.log(`    ✅ Saved to ${result.database}`);

    return result;

  } catch (error) {
    console.error('Auto-save failed:', error);
    return null;
  }
}

// ==========================================
// MANUAL SAVE
// ==========================================

async function handleSave(req, res, data) {
  const { topic, language, content, code, tags, metadata } = data;

  if (!topic || !content) {
    return res.status(400).json({ error: 'Topic and content required' });
  }

  const knowledge = {
    topic,
    language: language || 'general',
    content,
    code: code || null,
    tags: tags || [],
    metadata: metadata || {},
    version: 1
  };

  const result = await dbManager.saveKnowledge(knowledge);

  return res.json({
    success: true,
    message: `Knowledge saved to ${result.database}`,
    id: result.id,
    database: result.database
  });
}

// ==========================================
// SEARCH
// ==========================================

async function handleSearch(req, res, data) {
  const { query, language, tags, limit } = data;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const results = await dbManager.searchKnowledge(query, {
    language,
    tags,
    limit: limit || 10
  });

  return res.json({
    success: true,
    count: results.length,
    results: results.map(r => ({
      id: r.id || r._id,
      topic: r.topic,
      language: r.language,
      preview: r.content.substring(0, 200) + '...',
      hasCode: !!r.code,
      tags: r.tags,
      source: r.source_db,
      createdAt: r.createdAt
    }))
  });
}

// ==========================================
// AUTO-LEARN FROM CONVERSATION
// ==========================================

async function handleAutoLearn(req, res, data) {
  const { question, answer, language } = data;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer required' });
  }

  console.log('🧠 Auto-learning from conversation...');

  try {
    await autoSaveKnowledge(question, { answer }, language || 'general');

    return res.json({
      success: true,
      message: 'Knowledge learned and saved'
    });

  } catch (error) {
    console.error('Auto-learn error:', error);
    return res.json({
      success: false,
      message: 'Auto-learning failed',
      error: error.message
    });
  }
}

// ==========================================
// STATUS
// ==========================================

async function handleStatus(req, res) {
  const dbStatus = dbManager.getStatus();
  const stats = await dbManager.getStorageStats();
  
  return res.json({
    success: true,
    database: dbStatus,
    stats,
    capabilities: {
      autonomousLearning: true,
      multiDatabase: true,
      federatedSearch: true,
      memoryFirst: true
    }
  });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatMemoryAnswer(knowledge) {
  let answer = knowledge.content;

  // Add code if present
  if (knowledge.code) {
    try {
      const codeBlocks = JSON.parse(knowledge.code);
      if (Array.isArray(codeBlocks)) {
        answer += '\n\n' + codeBlocks.map(block => 
          `\`\`\`${block.language}\n${block.code}\n\`\`\``
        ).join('\n\n');
      }
    } catch (e) {
      // Code is in plain format
      answer += '\n\n```\n' + knowledge.code + '\n```';
    }
  }

  return answer;
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(w => words2.includes(w));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

function extractTags(text) {
  const keywords = text.toLowerCase().match(/\b(react|vue|angular|node|python|javascript|typescript|java|php|ruby|go|rust|api|database|mongodb|sql|postgresql|mysql|redis|authentication|security|performance|optimization|tutorial|guide|example|component|function|class|hook|state|props|async|await|promise|fetch|axios|express|fastapi|django|flask|spring|laravel|nextjs|vercel)\b/g);
  return keywords ? [...new Set(keywords)].slice(0, 10) : [];
}

function buildHeaders(provider) {
  const headers = { 'Content-Type': 'application/json' };
  const providerType = provider.provider.toLowerCase();

  if (providerType === 'groq' || providerType === 'openai') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  } else if (providerType === 'openrouter') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    headers['HTTP-Referer'] = process.env.VERCEL_URL || 'http://localhost:3000';
  } else if (providerType === 'google') {
    headers['x-goog-api-key'] = provider.apiKey;
  }

  return headers;
}

function extractResponse(provider, data) {
  const providerType = provider.toLowerCase();

  if (['groq', 'openrouter', 'openai'].includes(providerType)) {
    return data.choices?.[0]?.message?.content || '';
  }

  if (providerType === 'google') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  return data.response || data.output || '';
}
