// NextGenAI - PERFECT VERSION
// No more errors, clean artifacts, multi-model support

let messages = [];
let isLoading = false;
let aiSources = [];
let selectedModel = 'sonnet'; // sonnet or haiku
let enabledTools = {
  artifacts: true,
  websearch: false
};
let artifactCount = 0;

// Initialize
function init() {
  loadSources();
  loadSettings();
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

function loadSettings() {
  const savedModel = localStorage.getItem('selected_model');
  if (savedModel) selectedModel = savedModel;
  
  const savedTools = localStorage.getItem('enabled_tools');
  if (savedTools) enabledTools = JSON.parse(savedTools);
}

function showAdminWarning() {
  const banner = document.createElement('div');
  banner.className = 'bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4';
  banner.innerHTML = '<p class="text-sm text-amber-800"><strong>⚠️ Configuration Required:</strong> Please contact administrator.</p>';
  document.getElementById('messages').appendChild(banner);
}

// UI Functions
function toggleTools() {
  const dropdown = document.getElementById('toolsDropdown');
  const modelDropdown = document.getElementById('modelDropdown');
  dropdown.classList.toggle('hidden');
  modelDropdown.classList.add('hidden');
}

function toggleModels() {
  const dropdown = document.getElementById('modelDropdown');
  const toolsDropdown = document.getElementById('toolsDropdown');
  dropdown.classList.toggle('hidden');
  toolsDropdown.classList.add('hidden');
}

function toggleTool(toolId, event) {
  event.stopPropagation();
  if (toolId === 'artifacts') return;
  
  enabledTools[toolId] = !enabledTools[toolId];
  document.getElementById(`tool-${toolId}`).checked = enabledTools[toolId];
  localStorage.setItem('enabled_tools', JSON.stringify(enabledTools));
}

function selectModel(model, event) {
  event.stopPropagation();
  selectedModel = model;
  localStorage.setItem('selected_model', model);
  
  document.getElementById('selectedModel').textContent = 
    model.charAt(0).toUpperCase() + model.slice(1);
  
  document.querySelectorAll('.model-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  
  document.getElementById('modelDropdown').classList.add('hidden');
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
  const container = document.getElementById('messages');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingIndicator';
  loadingDiv.className = 'flex gap-3';
  loadingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
      <span class="text-white">🧠</span>
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
  document.getElementById('statusText').textContent = 'Creating...';
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
            <p class="text-sm">Chat cleared! Ready to create something amazing? 🚀</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Message Functions
function addMessage(role, content, options = {}) {
  messages.push({ role, content });
  const container = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.className = `flex gap-3 ${role === 'user' ? 'flex-row-reverse' : ''}`;
  
  const avatar = role === 'user' 
    ? '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0"><span class="text-white">👤</span></div>'
    : '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0"><span class="text-white">🧠</span></div>';
  
  const bgColor = role === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-white border-purple-100';
  
  if (options.artifact) {
    msg.innerHTML = `${avatar}<div class="flex-1 min-w-0">${renderArtifact(options.artifact)}</div>`;
  } else {
    msg.innerHTML = `
      ${avatar}
      <div class="flex-1 min-w-0">
        <div class="px-4 py-3 rounded-2xl ${bgColor} shadow-sm border">
          <p class="text-sm message-content">${escapeHtml(content)}</p>
        </div>
      </div>
    `;
  }
  
  container.appendChild(msg);
  scrollToBottom();
}

function renderArtifact(artifact) {
  artifactCount++;
  const id = `artifact-${artifactCount}`;
  
  return `
    <div class="artifact-container">
      <div class="artifact-header">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎨</span>
          <div>
            <h3 class="text-white font-semibold text-sm">${artifact.title}</h3>
            <p class="text-purple-200 text-xs">${artifact.type.toUpperCase()}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="copyCode('${id}')" class="px-3 py-1.5 bg-white text-purple-600 rounded text-sm hover:bg-purple-50">
            📋 Copy
          </button>
          <button onclick="downloadCode('${id}', '${escapeHtml(artifact.title)}')" class="px-3 py-1.5 bg-white text-purple-600 rounded text-sm hover:bg-purple-50">
            💾 Download
          </button>
        </div>
      </div>
      
      <div class="artifact-tabs">
        <div class="artifact-tab active" onclick="switchTab('${id}', 'preview')">👁️ Preview</div>
        <div class="artifact-tab" onclick="switchTab('${id}', 'code')">💻 Code</div>
      </div>
      
      <div id="${id}-preview" class="artifact-preview">
        <iframe class="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms" srcdoc="${escapeHtml(artifact.code)}"></iframe>
      </div>
      <div id="${id}-code" class="hidden">
        <div class="artifact-code">${escapeHtml(artifact.code)}</div>
      </div>
    </div>
    <script>window['code_${id}'] = ${JSON.stringify(artifact.code)};</script>
  `;
}

function switchTab(id, tab) {
  document.querySelectorAll(`#${id}-preview, #${id}-code`).forEach(el => {
    el.classList.add('hidden');
  });
  document.getElementById(`${id}-${tab}`).classList.remove('hidden');
  
  const tabs = document.querySelectorAll(`#${id}-preview`).forEach((_, i, arr) => {
    const container = arr[0].closest('.artifact-container');
    container.querySelectorAll('.artifact-tab').forEach(t => t.classList.remove('active'));
  });
  
  event.currentTarget.classList.add('active');
}

function copyCode(id) {
  const code = window[`code_${id}`];
  navigator.clipboard.writeText(code).then(() => alert('✅ Copied!'));
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

    const wantsArtifact = /create|build|make|generate|buat|bikin/i.test(question);
    
    if (wantsArtifact) {
      const result = await generateArtifact(question);
      hideLoading();
      
      if (result.artifact) {
        if (result.explanation) {
          addMessage('assistant', result.explanation);
        }
        addMessage('assistant', '', { artifact: result.artifact });
      } else {
        addMessage('assistant', result.answer || 'Failed to generate. Please be more specific.');
      }
    } else {
      const result = await queryAI(question);
      hideLoading();
      addMessage('assistant', result.answer);
    }
  } catch (error) {
    hideLoading();
    console.error(error);
    addMessage('assistant', error.message === 'NO_CONFIG' 
      ? '🔧 System not configured. Contact administrator.'
      : '😔 Sorry, an error occurred. Please try again.');
  } finally {
    isLoading = false;
  }
}

// AI Functions
async function generateArtifact(prompt) {
  const source = getSource();
  if (!source) throw new Error('NO_CONFIG');

  const systemPrompt = `You are a code generator. Generate ONLY complete HTML code.

RULES:
1. Start immediately with <!DOCTYPE html>
2. NO explanations, NO JSON, NO markdown
3. Include Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
4. Make it beautiful and functional
5. All CSS/JS inline

Example for "create button":
<!DOCTYPE html>
<html>
<head>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex items-center justify-center min-h-screen bg-gray-100">
<button class="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Click Me</button>
</body>
</html>`;

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
    
    // Clean markdown if present
    code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract HTML if wrapped in text
    if (!code.startsWith('<!DOCTYPE')) {
      const match = code.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      if (match) code = match[0];
    }
    
    // Validate HTML
    if (!code.includes('<!DOCTYPE') && !code.includes('<html')) {
      return { answer: 'Failed to generate valid HTML. Please try again.' };
    }
    
    const titleMatch = code.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Generated Code';
    
    return {
      explanation: "I've created what you requested:",
      artifact: { title, type: 'html', code }
    };
    
  } catch (error) {
    console.error(error);
    return { answer: 'Failed to generate. Please try again with more details.' };
  }
}

async function queryAI(question) {
  const source = getSource();
  if (!source) throw new Error('NO_CONFIG');

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
          { role: 'system', content: 'You are NextGenAI, a helpful assistant. Be concise.' },
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
  // Prioritize based on selected model
  if (selectedModel === 'haiku') {
    // Use fastest available model
    return aiSources.find(s => s.model.includes('llama-3.1')) || aiSources[0];
  }
  // Sonnet: use best available
  return aiSources.find(s => s.model.includes('3.3') || s.model.includes('3.2')) || aiSources[0];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
window.addEventListener('DOMContentLoaded', init);
