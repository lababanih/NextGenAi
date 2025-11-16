// NextGenAI - Self-Learning System
// AI that learns before generating code

let messages = [];
let isLoading = false;
let aiSources = [];
let selectedModel = 'nefa';
let artifactCount = 0;

const MODEL_INFO = {
  nefa: {
    name: 'Nefa',
    description: 'Learns & adapts - Best for everything',
    icon: '🧠',
    learning: true
  },
  mou: {
    name: 'Mou',
    description: 'Web search, code, deep research',
    icon: '🔍',
    learning: true
  },
  nevi: {
    name: 'Nevi',
    description: 'Image generation',
    icon: '🎨'
  },
  vidi: {
    name: 'Vidi',
    description: 'Video generation',
    icon: '🎬',
    comingSoon: true
  }
};

function init() {
  loadSources();
  const savedModel = localStorage.getItem('selected_model') || 'nefa';
  selectedModel = savedModel;
  updateModelDisplay();
  
  if (aiSources.length === 0 || !aiSources.some(s => s.apiKey)) {
    showAdminWarning();
  }
}

function loadSources() {
  const saved = localStorage.getItem('ai_sources');
  if (saved) {
    aiSources = JSON.parse(saved).filter(s => s.enabled && s.apiKey);
  }
}

function showAdminWarning() {
  const banner = document.createElement('div');
  banner.className = 'bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4';
  banner.innerHTML = '<p class="text-sm text-amber-800"><strong>⚠️ Configuration Required:</strong> Please contact administrator.</p>';
  document.getElementById('messages').appendChild(banner);
}

function toggleModelSelector() {
  document.getElementById('modelSelector')?.classList.toggle('hidden');
}

function selectModel(model, event) {
  event.stopPropagation();
  
  if (MODEL_INFO[model].comingSoon) {
    alert('🎬 Vidi model coming soon!');
    return;
  }
  
  selectedModel = model;
  localStorage.setItem('selected_model', model);
  updateModelDisplay();
  
  document.querySelectorAll('.model-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  
  document.getElementById('modelSelector').classList.add('hidden');
  
  const modelInfo = MODEL_INFO[model];
  addMessage('system', `Switched to ${modelInfo.icon} ${modelInfo.name}: ${modelInfo.description}`);
}

function updateModelDisplay() {
  const modelInfo = MODEL_INFO[selectedModel];
  document.getElementById('currentModelName').textContent = modelInfo.name;
  document.getElementById('modelInfo').textContent = `Using: ${modelInfo.name}`;
}

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  setTimeout(() => container.scrollTop = container.scrollHeight, 100);
}

function showLoading(phase = 'thinking') {
  const modelInfo = MODEL_INFO[selectedModel];
  const container = document.getElementById('messages');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingIndicator';
  loadingDiv.className = 'flex gap-3';
  
  let statusText = 'Thinking...';
  if (phase === 'learning') statusText = 'Learning & researching...';
  if (phase === 'analyzing') statusText = 'Analyzing requirements...';
  if (phase === 'generating') statusText = 'Generating code...';
  
  loadingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
      <span class="text-white">${modelInfo.icon}</span>
    </div>
    <div class="flex-1">
      <div class="px-4 py-3 rounded-2xl bg-white shadow-sm border">
        <div class="flex items-center gap-3">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <span class="text-sm text-gray-600">${statusText}</span>
        </div>
      </div>
    </div>
  `;
  
  const existing = document.getElementById('loadingIndicator');
  if (existing) existing.remove();
  
  container.appendChild(loadingDiv);
  scrollToBottom();
  document.getElementById('statusText').textContent = statusText;
}

function hideLoading() {
  const loading = document.getElementById('loadingIndicator');
  if (loading) loading.remove();
  document.getElementById('statusText').textContent = 'Ready';
}

function clearChat() {
  if (confirm('Clear all messages?')) {
    messages = [];
    artifactCount = 0;
    document.getElementById('messages').innerHTML = `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <span class="text-white">🧠</span>
        </div>
        <div class="flex-1">
          <div class="px-4 py-3 rounded-2xl bg-white shadow-sm border">
            <div class="message-content text-sm">
              <p><strong>Chat cleared!</strong></p>
              <p>I'm ${MODEL_INFO[selectedModel].name}, ready to learn and create amazing things for you! 🚀</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function addMessage(role, content, options = {}) {
  if (role !== 'system') {
    messages.push({ role, content });
  }
  
  const container = document.getElementById('messages');
  const msg = document.createElement('div');
  
  let avatar, bgColor, icon;
  
  if (role === 'user') {
    avatar = '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0"><span class="text-white">👤</span></div>';
    bgColor = 'bg-blue-50 border-blue-200';
    msg.className = 'flex gap-3 flex-row-reverse';
  } else if (role === 'system') {
    avatar = '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center flex-shrink-0"><span class="text-white">ℹ️</span></div>';
    bgColor = 'bg-gray-50 border-gray-200';
    msg.className = 'flex gap-3';
  } else {
    icon = MODEL_INFO[selectedModel]?.icon || '🧠';
    avatar = `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0"><span class="text-white">${icon}</span></div>`;
    bgColor = 'bg-white border-purple-100';
    msg.className = 'flex gap-3';
  }
  
  if (options.artifact) {
    msg.innerHTML = `${avatar}<div class="flex-1 min-w-0">${renderArtifact(options.artifact)}</div>`;
  } else {
    const formattedContent = formatResponse(content);
    msg.innerHTML = `
      ${avatar}
      <div class="flex-1 min-w-0">
        <div class="px-4 py-3 rounded-2xl ${bgColor} shadow-sm border">
          <div class="text-sm message-content">${formattedContent}</div>
        </div>
      </div>
    `;
  }
  
  container.appendChild(msg);
  scrollToBottom();
}

function formatResponse(text) {
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br>');
  formatted = formatted.replace(/^[•\-\*]\s+(.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  if (!formatted.startsWith('<')) {
    formatted = '<p>' + formatted + '</p>';
  }
  
  return formatted;
}

function renderArtifact(artifact) {
  artifactCount++;
  const id = `artifact-${artifactCount}`;
  const modelIcon = MODEL_INFO[selectedModel]?.icon || '🎨';
  
  return `
    <div class="artifact-container">
      <div class="artifact-header">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${modelIcon}</span>
          <div>
            <h3 class="text-white font-semibold text-sm">${artifact.title}</h3>
            <p class="text-purple-200 text-xs">${artifact.type.toUpperCase()} • Generated by ${MODEL_INFO[selectedModel].name}</p>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button onclick="copyCode('${id}')" class="px-3 py-1.5 bg-white text-purple-600 rounded text-sm hover:bg-purple-50 transition-colors">
            📋 Copy
          </button>
          <button onclick="downloadCode('${id}', '${escapeHtml(artifact.title)}')" class="px-3 py-1.5 bg-white text-purple-600 rounded text-sm hover:bg-purple-50 transition-colors">
            💾 Download
          </button>
        </div>
      </div>
      
      <div class="artifact-tabs">
        <div class="artifact-tab active" onclick="switchTab('${id}', 'preview', event)">👁️ Preview</div>
        <div class="artifact-tab" onclick="switchTab('${id}', 'code', event)">💻 Code</div>
      </div>
      
      <div id="${id}-preview" class="artifact-preview">
        <iframe class="w-full h-full border-0" style="min-height: 400px;" sandbox="allow-scripts allow-same-origin allow-forms" srcdoc="${escapeHtml(artifact.code)}"></iframe>
      </div>
      <div id="${id}-code" class="hidden">
        <div class="artifact-code">${escapeHtml(artifact.code)}</div>
      </div>
    </div>
    <script>window['code_${id}'] = ${JSON.stringify(artifact.code)};</script>
  `;
}

function switchTab(id, tab, event) {
  event.stopPropagation();
  document.getElementById(`${id}-preview`).classList.toggle('hidden', tab !== 'preview');
  document.getElementById(`${id}-code`).classList.toggle('hidden', tab !== 'code');
  const container = document.getElementById(`${id}-preview`).closest('.artifact-container');
  container.querySelectorAll('.artifact-tab').forEach(t => t.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function copyCode(id) {
  navigator.clipboard.writeText(window[`code_${id}`]).then(() => alert('✅ Copied!'));
}

function downloadCode(id, title) {
  const code = window[`code_${id}`];
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// MAIN CHAT FUNCTION
async function sendMessage() {
  if (isLoading) return;
  
  const input = document.getElementById('userInput');
  const question = input.value.trim();
  if (!question) return;

  addMessage('user', question);
  input.value = '';
  input.style.height = 'auto';
  isLoading = true;
  showLoading('thinking');

  try {
    if (aiSources.length === 0) throw new Error('NO_CONFIG');

    const result = await processWithLearning(question);
    hideLoading();
    
    if (result.artifact) {
      if (result.explanation) {
        addMessage('assistant', result.explanation);
      }
      addMessage('assistant', '', { artifact: result.artifact });
    } else {
      addMessage('assistant', result.answer);
    }
  } catch (error) {
    hideLoading();
    console.error(error);
    addMessage('assistant', error.message === 'NO_CONFIG' 
      ? '🔧 System not configured. Please contact administrator.'
      : '😔 Sorry, an error occurred. Please try again.');
  } finally {
    isLoading = false;
  }
}

// SELF-LEARNING SYSTEM
async function processWithLearning(question) {
  const modelInfo = MODEL_INFO[selectedModel];
  const needsCode = /create|build|make|generate|buat|bikin|admin panel|dashboard|app|website|game|calculator/i.test(question);
  
  if (needsCode && modelInfo.learning) {
    return await learnAndGenerate(question);
  } else if (selectedModel === 'nevi') {
    return await processNevi(question);
  } else {
    return await queryAI(question);
  }
}

// LEARNING & GENERATION PROCESS
async function learnAndGenerate(userRequest) {
  const source = getSource();
  if (!source) throw new Error('NO_CONFIG');
  
  // PHASE 1: ANALYZE & LEARN
  showLoading('learning');
  
  const learningPrompt = `You are ${MODEL_INFO[selectedModel].name}, an AI that LEARNS before creating.

User Request: "${userRequest}"

Your task:
1. Analyze what the user wants
2. Identify key requirements
3. Research best practices for this type of application
4. Plan the optimal solution

Respond with a JSON containing:
{
  "understanding": "What the user wants",
  "requirements": ["key requirement 1", "key requirement 2"],
  "bestPractices": ["best practice 1", "best practice 2"],
  "techStack": ["technology 1", "technology 2"],
  "approach": "How you'll build it"
}

Respond ONLY with valid JSON, no markdown.`;

  try {
    const learningResponse = await fetch(source.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${source.apiKey}`
      },
      body: JSON.stringify({
        model: source.model,
        messages: [
          { role: 'system', content: learningPrompt },
          { role: 'user', content: userRequest }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!learningResponse.ok) throw new Error('Learning phase failed');
    
    const learningData = await learningResponse.json();
    let learningResult = learningData.choices[0].message.content.trim();
    
    // Clean JSON
    learningResult = learningResult.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(learningResult);
    } catch (e) {
      console.log('Failed to parse learning result, using fallback');
      analysis = {
        understanding: userRequest,
        requirements: ['User interface', 'Functionality', 'Design'],
        bestPractices: ['Clean code', 'Responsive design', 'Modern UI'],
        techStack: ['HTML', 'Tailwind CSS', 'JavaScript'],
        approach: 'Build a complete, functional application'
      };
    }
    
    // Show learning process
    const learningMessage = `**🧠 Analysis Complete:**

**Understanding:** ${analysis.understanding}

**Key Requirements:**
${analysis.requirements.map(r => `• ${r}`).join('\n')}

**Best Practices Applied:**
${analysis.bestPractices.map(p => `• ${p}`).join('\n')}

**Tech Stack:** ${analysis.techStack.join(', ')}

**Approach:** ${analysis.approach}

Now generating optimized code...`;
    
    addMessage('assistant', learningMessage);
    
    // PHASE 2: GENERATE CODE
    showLoading('generating');
    
    const generationPrompt = `You are an expert code generator that has learned about the request.

Analysis:
${JSON.stringify(analysis, null, 2)}

Now generate COMPLETE, PRODUCTION-READY HTML code based on this analysis.

CRITICAL RULES:
1. Generate ONLY pure HTML code
2. Start with <!DOCTYPE html> IMMEDIATELY
3. NO explanations, NO JSON, NO markdown
4. Include <script src="https://cdn.tailwindcss.com"></script>
5. Make it BEAUTIFUL, MODERN, and FULLY FUNCTIONAL
6. Apply ALL best practices from analysis
7. Use modern design patterns
8. Add smooth animations and interactions
9. Make it responsive

Your ENTIRE response = ONLY the HTML code.
Start with <!DOCTYPE html> right now:`;

    const codeResponse = await fetch(source.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${source.apiKey}`
      },
      body: JSON.stringify({
        model: source.model,
        messages: [
          { role: 'system', content: generationPrompt },
          { role: 'user', content: userRequest }
        ],
        temperature: 0.6,
        max_tokens: 4096
      })
    });

    if (!codeResponse.ok) throw new Error('Code generation failed');
    
    const codeData = await codeResponse.json();
    let code = codeData.choices[0].message.content;
    
    // AGGRESSIVE CLEANING
    code = code.replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim();
    
    const doctypeIndex = code.indexOf('<!DOCTYPE');
    const htmlIndex = code.indexOf('<html');
    
    if (doctypeIndex !== -1) {
      code = code.substring(doctypeIndex);
    } else if (htmlIndex !== -1) {
      code = code.substring(htmlIndex);
    }
    
    const htmlEndIndex = code.lastIndexOf('</html>');
    if (htmlEndIndex !== -1) {
      code = code.substring(0, htmlEndIndex + 7);
    }
    
    if (!code.includes('<html') && !code.includes('<!DOCTYPE')) {
      return { answer: '❌ Failed to generate valid code. Please try again with more details.' };
    }
    
    const titleMatch = code.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : analysis.understanding || 'Generated Application';
    
    return {
      explanation: `**✨ Code Generated Successfully!**\n\nI've learned about your request and created an optimized solution based on best practices.`,
      artifact: { title, type: 'html', code }
    };
    
  } catch (error) {
    console.error('Learning/Generation error:', error);
    return { answer: `❌ Error: ${error.message}. Please try again.` };
  }
}

async function processNevi(question) {
  const description = question.replace(/generate|create|make|buat|gambar|image/gi, '').trim();
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(description)}?width=1024&height=1024&seed=${Date.now()}`;
  
  return {
    answer: `**🎨 Image Generated by Nevi**\n\nPrompt: *${description}*\n\n<img src="${imageUrl}" alt="Generated Image" style="max-width: 100%; border-radius: 8px; margin: 1rem 0;" />`,
    artifact: null
  };
}

async function queryAI(question) {
  const source = getSource();
  if (!source) throw new Error('NO_CONFIG');

  const systemPrompt = `You are ${MODEL_INFO[selectedModel].name}, a helpful AI assistant.

Provide clear, professional responses with:
- **Bold** for key points
- Bullet points for lists
- \`code\` when relevant

Be concise and helpful.`;

  try {
    const response = await fetch(source.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${source.apiKey}`
      },
      body: JSON.stringify({
        model: source.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) throw new Error('API failed');
    
    const data = await response.json();
    return { answer: data.choices[0].message.content };
    
  } catch (error) {
    throw new Error('Failed to get response');
  }
}

function getSource() {
  return aiSources.find(s => s.model.includes('3.3') || s.model.includes('3.2')) || aiSources[0];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('#modelBtn') && !e.target.closest('#modelSelector')) {
    document.getElementById('modelSelector')?.classList.add('hidden');
  }
});

window.addEventListener('DOMContentLoaded', init);
