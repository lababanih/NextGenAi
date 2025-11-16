// NextGenAI - ULTIMATE VERSION
// Model-specific capabilities, better formatting

let messages = [];
let isLoading = false;
let aiSources = [];
let selectedModel = 'sonnet';
let artifactCount = 0;

const MODEL_INFO = {
  sonnet: {
    name: 'Sonnet',
    description: 'General purpose, balanced & smart',
    capabilities: ['chat', 'code', 'analysis'],
    icon: '🧠'
  },
  mou: {
    name: 'Mou',
    description: 'Web search, code, deep research',
    capabilities: ['search', 'code', 'research'],
    icon: '🔍'
  },
  nevi: {
    name: 'Nevi',
    description: 'Image generation',
    capabilities: ['image_generation'],
    icon: '🎨'
  },
  vidi: {
    name: 'Vidi',
    description: 'Video generation',
    capabilities: ['video_generation'],
    icon: '🎬',
    comingSoon: true
  }
};

function init() {
  loadSources();
  const savedModel = localStorage.getItem('selected_model');
  if (savedModel) {
    selectedModel = savedModel;
    updateModelDisplay();
  }
  
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

// UI Functions
function toggleModelSelector() {
  const selector = document.getElementById('modelSelector');
  selector.classList.toggle('hidden');
}

function selectModel(model, event) {
  event.stopPropagation();
  
  if (MODEL_INFO[model].comingSoon) {
    alert('🎬 Vidi model coming soon! Stay tuned.');
    return;
  }
  
  selectedModel = model;
  localStorage.setItem('selected_model', model);
  updateModelDisplay();
  
  // Update active state
  document.querySelectorAll('.model-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  
  document.getElementById('modelSelector').classList.add('hidden');
  
  // Show model change message
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

function showLoading() {
  const modelInfo = MODEL_INFO[selectedModel];
  const container = document.getElementById('messages');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingIndicator';
  loadingDiv.className = 'flex gap-3';
  loadingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
      <span class="text-white">${modelInfo.icon}</span>
    </div>
    <div class="flex-1">
      <div class="px-4 py-3 rounded-2xl bg-white shadow-sm border">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(loadingDiv);
  scrollToBottom();
  document.getElementById('statusText').textContent = `${modelInfo.name} is thinking...`;
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
            <p class="text-sm message-content">Chat cleared! Ready to create something amazing? 🚀</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Message Functions
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
    // Format content with markdown-like styling
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
  // Better formatting for AI responses
  let formatted = escapeHtml(text);
  
  // Bold text: **text** or __text__
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline code: `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Line breaks
  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Bullet points
  formatted = formatted.replace(/^[•\-\*]\s+(.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Numbered lists
  formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap in paragraphs if not already
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
  const code = window[`code_${id}`];
  navigator.clipboard.writeText(code).then(() => {
    alert('✅ Code copied to clipboard!');
  });
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

// Main Chat Function
async function sendMessage() {
  if (isLoading) return;
  
  const input = document.getElementById('userInput');
  const question = input.value.trim();
  if (!question) return;

  addMessage('user', question);
  input.value = '';
  input.style.height = 'auto';
  isLoading = true;
  showLoading();

  try {
    if (aiSources.length === 0) {
      throw new Error('NO_CONFIG');
    }

    const result = await processWithModel(question);
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

// Model-Specific Processing
async function processWithModel(question) {
  const modelInfo = MODEL_INFO[selectedModel];
  
  switch (selectedModel) {
    case 'mou':
      return await processMou(question);
    case 'nevi':
      return await processNevi(question);
    case 'vidi':
      return { answer: '🎬 Vidi model is coming soon! Please use another model for now.' };
    default:
      return await processSonnet(question);
  }
}

// Mou: Search, Code, Research
async function processMou(question) {
  const needsCode = /create|build|make|generate|buat|bikin|code|program/i.test(question);
  
  if (needsCode) {
    return await generateArtifact(question);
  } else {
    // Regular response with research capability
    return await queryAI(question, {
      systemPrompt: `You are Mou, an AI specialized in web search, coding, and deep research. 

Provide comprehensive, well-researched answers with:
- Clear structure with headings
- Bullet points for lists
- Code examples when relevant
- Citations when appropriate

Format your response using:
- **Bold** for emphasis
- \`code\` for inline code
- Bullet points with • or -
- Numbered lists when order matters

Be thorough but concise.`
    });
  }
}

// Nevi: Image Generation
async function processNevi(question) {
  // Extract image description
  const description = question.replace(/generate|create|make|buat|gambar|image/gi, '').trim();
  
  // Generate image URL (using Pollinations.ai - FREE)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(description)}?width=1024&height=1024&seed=${Date.now()}`;
  
  return {
    answer: `**🎨 Image Generated**\n\nPrompt: *${description}*\n\n![Generated Image](${imageUrl})\n\nCreated by Nevi AI`,
    artifact: null
  };
}

// Sonnet: General Purpose
async function processSonnet(question) {
  const needsCode = /create|build|make|generate|buat|bikin/i.test(question);
  
  if (needsCode) {
    return await generateArtifact(question);
  } else {
    return await queryAI(question, {
      systemPrompt: `You are Sonnet, a balanced and intelligent AI assistant.

Provide helpful, accurate responses with:
- Clear explanations
- Well-structured information
- Examples when helpful
- Professional tone

Format using:
- **Bold** for key points
- Bullet points for lists
- Clear paragraphs
- \`code\` when relevant`
    });
  }
}

// Generate Artifact (Code)
async function generateArtifact(prompt) {
  const source = getSource();
  if (!source) throw new Error('NO_CONFIG');

  const systemPrompt = `You are a code generator. Generate ONLY complete, working HTML code.

RULES:
1. Start immediately with <!DOCTYPE html>
2. NO explanations, NO JSON, NO markdown blocks
3. Include Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
4. Make it beautiful, modern, and fully functional
5. All CSS/JS must be inline
6. Production-ready quality

Generate ONLY the HTML code, nothing else.`;

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
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) throw new Error('API failed');
    
    const data = await response.json();
    let code = data.choices[0].message.content.trim();
    
    // Clean markdown
    code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract HTML
    if (!code.startsWith('<!DOCTYPE')) {
      const match = code.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      if (match) code = match[0];
    }
    
    // Validate
    if (!code.includes('<!DOCTYPE') && !code.includes('<html')) {
      return { answer: '❌ Failed to generate valid code. Please try with more specific details.' };
    }
    
    const titleMatch = code.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Generated App';
    
    return {
      explanation: "**✨ I've created what you requested:**",
      artifact: { title, type: 'html', code }
    };
    
  } catch (error) {
    console.error(error);
    return { answer: '❌ Failed to generate. Please try again.' };
  }
}

// Query AI (Regular chat)
async function queryAI(question, options = {}) {
  const source = getSource();
  if (!source) throw new Error('NO_CONFIG');

  const defaultPrompt = 'You are a helpful AI assistant. Be concise and professional.';
  const systemPrompt = options.systemPrompt || defaultPrompt;

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
  // Use best available source
  return aiSources.find(s => s.model.includes('3.3') || s.model.includes('3.2')) || aiSources[0];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
window.addEventListener('DOMContentLoaded', init);
