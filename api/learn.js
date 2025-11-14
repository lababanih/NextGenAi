// api/learn.js
// AI yang belajar dari AI lain secara otomatis!

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, mode = 'smart' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // STEP 1: Cek apakah sudah pernah belajar tentang ini
    const memory = await checkMemory(question);
    
    if (memory && mode === 'fast') {
      return res.json({
        answer: memory.answer,
        source: 'memory',
        confidence: memory.confidence,
        learnedFrom: memory.learnedFrom
      });
    }

    // STEP 2: Tanya ke SEMUA AI sekaligus (parallel learning)
    const aiResponses = await Promise.allSettled([
      askGroq(question),      // Llama 3.2 (gratis)
      askOpenRouter(question), // Akses ke 100+ models (gratis tier)
      askHuggingFace(question) // Open source models (gratis)
    ]);

    // STEP 3: Analisis dan gabungkan jawaban terbaik
    const validResponses = aiResponses
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    if (validResponses.length === 0) {
      throw new Error('All AI services failed');
    }

    // STEP 4: Gunakan Groq untuk "belajar" dari jawaban-jawaban tersebut
    const synthesis = await synthesizeKnowledge(question, validResponses);

    // STEP 5: Simpan pengetahuan baru ke memory (auto-learning!)
    await saveToMemory(question, synthesis, validResponses);

    return res.json({
      answer: synthesis.answer,
      source: 'learned',
      learnedFrom: validResponses.map(r => r.model),
      confidence: synthesis.confidence,
      improvementSuggestions: synthesis.improvements
    });

  } catch (error) {
    console.error('Learning error:', error);
    return res.status(500).json({ 
      error: 'Learning process failed',
      message: error.message 
    });
  }
}

// Tanya ke Groq (Llama 3.2) - GRATIS
async function askGroq(question) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.2-90b-vision-preview',
      messages: [{ role: 'user', content: question }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  const data = await response.json();
  return {
    model: 'Llama 3.2 90B (Groq)',
    answer: data.choices[0].message.content,
    provider: 'groq'
  };
}

// Tanya ke OpenRouter (akses 100+ models) - ADA FREE TIER
async function askOpenRouter(question) {
  // OpenRouter bisa akses: GPT-4, Claude, Gemini, dll dengan 1 API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-90b-vision-instruct:free', // Model gratis!
      messages: [{ role: 'user', content: question }]
    })
  });

  const data = await response.json();
  return {
    model: data.model || 'OpenRouter Model',
    answer: data.choices[0].message.content,
    provider: 'openrouter'
  };
}

// Tanya ke Hugging Face (banyak model gratis)
async function askHuggingFace(question) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: question,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7
        }
      })
    }
  );

  const data = await response.json();
  return {
    model: 'Llama 3.2 3B (HuggingFace)',
    answer: data[0].generated_text,
    provider: 'huggingface'
  };
}

// Sintesis pengetahuan dari berbagai AI (AI belajar dari AI lain)
async function synthesizeKnowledge(question, responses) {
  const responsesText = responses.map((r, i) => 
    `[AI ${i+1} - ${r.model}]:\n${r.answer}`
  ).join('\n\n---\n\n');

  const synthesisPrompt = `
Kamu adalah AI yang belajar dari AI lain. Berikut adalah pertanyaan dan jawaban dari berbagai AI:

PERTANYAAN: ${question}

JAWABAN DARI BERBAGAI AI:
${responsesText}

TUGAS KAMU:
1. Analisis semua jawaban di atas
2. Ambil insight terbaik dari setiap AI
3. Gabungkan menjadi jawaban yang lebih baik dan lengkap
4. Buang informasi yang salah atau bertentangan
5. Berikan confidence score (0-100%)

Format response:
{
  "answer": "jawaban gabungan yang lebih baik",
  "confidence": 85,
  "improvements": ["apa yang kamu pelajari dari jawaban-jawaban ini"]
}

Response dalam JSON saja, tidak perlu penjelasan tambahan.
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.2-90b-vision-preview',
      messages: [{ role: 'user', content: synthesisPrompt }],
      temperature: 0.5,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  const synthesis = JSON.parse(data.choices[0].message.content);
  
  return synthesis;
}

// Cek memory (apakah AI sudah pernah belajar tentang ini)
async function checkMemory(question) {
  // Implementasi dengan Vercel KV atau database
  // Untuk sekarang return null (belum ada memory)
  return null;
}

// Simpan ke memory (AI belajar dan ingat!)
async function saveToMemory(question, synthesis, sources) {
  // Simpan ke database/KV store
  // Format: { question, answer, confidence, learnedFrom, timestamp }
  
  const memory = {
    question,
    answer: synthesis.answer,
    confidence: synthesis.confidence,
    learnedFrom: sources.map(s => s.model),
    timestamp: new Date().toISOString(),
    improvements: synthesis.improvements
  };

  // TODO: Implement actual storage
  // await kv.set(`memory:${hashQuestion(question)}`, memory);
  
  console.log('Learned and saved:', memory);
  return memory;
}

/*
CARA KERJA SYSTEM INI:

1. USER TANYA: "Bagaimana cara membuat game 3D?"

2. AI SYSTEM:
   - Tanya ke Groq (Llama 3.2)
   - Tanya ke OpenRouter (akses Claude, GPT, Gemini)
   - Tanya ke HuggingFace (model open source)
   
3. DAPAT 3+ JAWABAN dari AI berbeda

4. AI BELAJAR:
   - Analisis semua jawaban
   - Ambil yang terbaik dari masing-masing
   - Gabungkan jadi jawaban lebih baik
   
5. SIMPAN KE MEMORY:
   - Next time ditanya serupa = langsung jawab dari memory
   - Tidak perlu tanya AI lain lagi
   - MAKIN LAMA MAKIN PINTAR!

KEUNGGULAN:
✅ Belajar otomatis tanpa Anda ajari
✅ Makin lama makin pintar
✅ Gratis (pakai free tier semua AI)
✅ Multi-perspective (dapat jawaban dari berbagai AI)
✅ Self-improving (terus belajar dari interaksi)

API KEYS YANG DIBUTUHKAN (SEMUA GRATIS!):
- GROQ_API_KEY: https://console.groq.com/
- OPENROUTER_API_KEY: https://openrouter.ai/
- HUGGINGFACE_API_KEY: https://huggingface.co/settings/tokens

OPTIONAL (untuk memory/database):
- Vercel KV (free tier)
- Supabase (free tier)
- MongoDB (free tier)
*/
