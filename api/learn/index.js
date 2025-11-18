// api/learn/index.js
// AI AUTONOMOUS LEARNING SYSTEM

import dbManager from '../database/manager.js';

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

    await dbManager.initialize();

    switch (action) {
      case 'save':
        return await handleSave(req, res, data);
      
      case 'search':
        return await handleSearch(req, res, data);
      
      case 'auto-learn':
        return await handleAutoLearn(req, res, data);
      
      case 'status':
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
    learnedAt: new Date(),
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
      id: r.id,
      topic: r.topic,
      language: r.language,
      content: r.content.substring(0, 200) + '...',
      code: r.code ? r.code.substring(0, 100) + '...' : null,
      tags: r.tags,
      source: r.source_db,
      createdAt: r.createdAt || r.created_at
    }))
  });
}

async function handleAutoLearn(req, res, data) {
  const { question, answer, language } = data;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer required' });
  }

  console.log('🧠 Auto-learning from conversation...');

  try {
    const knowledge = extractKnowledgeSimple(question, answer, language);

    if (knowledge.length === 0) {
      return res.json({
        success: false,
        message: 'No significant knowledge to learn'
      });
    }

    const savePromises = knowledge.map(item => 
      dbManager.saveKnowledge({
        topic: item.topic,
        language: item.language,
        content: item.summary,
        code: item.code,
        tags: item.tags,
        metadata: {
          originalQuestion: question,
          extractedFrom: 'conversation'
        }
      })
    );

    const results = await Promise.all(savePromises);

    console.log(`✅ Learned ${results.length} knowledge items`);

    return res.json({
      success: true,
      message: `Learned ${results.length} new concepts`,
      learned: knowledge.map((k, i) => ({
        topic: k.topic,
        database: results[i].database
      }))
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

async function handleStatus(req, res) {
  const status = dbManager.getStatus();
  
  return res.json({
    success: true,
    federation: status,
    capabilities: {
      autonomousLearning: true,
      multiDatabase: true,
      federatedSearch: true,
      languages: ['javascript', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'general']
    }
  });
}

function extractKnowledgeSimple(question, answer, language) {
  const knowledge = [];
  
  const codeBlocks = answer.match(/```(\w+)?\n([\s\S]*?)```/g);
  
  if (codeBlocks && codeBlocks.length > 0) {
    codeBlocks.forEach((block, i) => {
      const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
      const lang = match[1] || 'code';
      const code = match[2];
      
      const beforeCode = answer.substring(0, answer.indexOf(block));
      const lines = beforeCode.split('\n');
      const topic = lines[lines.length - 1].trim() || 
                    lines[lines.length - 2]?.trim() || 
                    question.substring(0, 50);
      
      knowledge.push({
        topic: topic.replace(/[#*`]/g, '').trim(),
        language: lang,
        summary: `Code example for: ${question}`,
        code: code.trim(),
        tags: extractTags(question + ' ' + answer)
      });
    });
  }
  
  if (!codeBlocks && answer.length > 1000) {
    knowledge.push({
      topic: question.substring(0, 100),
      language: 'general',
      summary: answer.substring(0, 1000),
      code: null,
      tags: extractTags(question + ' ' + answer)
    });
  }
  
  return knowledge;
}

function extractTags(text) {
  const keywords = text.toLowerCase().match(/\b(react|vue|angular|node|python|javascript|typescript|java|php|ruby|go|rust|api|database|mongodb|sql|postgresql|mysql|redis|authentication|security|performance|optimization|tutorial|guide|example|component|function|class|hook|state|props|async|await|promise|fetch|axios|express|fastapi|django|flask|spring|laravel)\b/g);
  return keywords ? [...new Set(keywords)].slice(0, 8) : [];
}
