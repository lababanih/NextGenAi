// NextGenAI - FIXED VERSION
// Proper artifact parsing, responsive design, hidden admin access

let currentTab = 'chat';
let messages = [];
let isLoading = false;
let aiSources = [];
let enabledTools = {
  artifacts: true,
  websearch: false,
  coderun: false,
  imagegen: false,
  imageanalyze: false,
  dataanalyze: false
};
let uploadedFile = null;
let uploadedFileData = null;
let artifactCount = 0;

function init() {
  loadSources();
  loadToolsState();
  updateActiveToolsDisplay();
  
  if (aiSources.length === 0 || !aiSources.some(s => s.apiKey)) {
    showAdminWarning();
  }
}

function showAdminWarning() {
  const banner = document.createElement('div');
  banner.className = 'bg-amber-50 border-l-4 border-amber-500 p-4 mx-auto max-w-4xl mt-4 rounded-lg';
  banner.innerHTML = `
    <p class="text-sm text-amber-800">
      <strong>⚠️ Configuration Required:</strong> No AI sources configured. 
      Please contact your administrator to setup the system.
    </p>
  `;
  document.getElementById('messages').appendChild(banner);
}

function loadSources() {
  const saved = localStorage.getItem('ai_sources');
  if (saved) {
    aiSources = JSON.parse(saved).filter(s => s.enabled && s.apiKey);
  }
}

function loadToolsState() {
  const saved = localStorage.getItem('enabled_tools');
  if (saved) {
    enabledTools = { ...enabledTools, ...JSON.parse(saved) };
    Object.keys(enabledTools).forEach(tool => {
      const checkbox = document.getElementById(`tool-${tool}`);
      if (checkbox) checkbox.checked = enabledTools[tool];
    });
  }
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`content-${tab}`).classList.add('active');
  
  document.querySelectorAll('[id^="tab-"]').forEach(el => {
    el.className = 'px-4 sm:px-6 py-3 text-sm sm:text-base font-medium border-b-2 border-transparent text-gray-600 hover:text-purple-600';
  });
  document.getElementById(`tab-${tab}`).className = 'px-4 sm:px-6 py-3 text-sm sm:text-base font-medium border-b-2 border-purple-500 text-purple-600';
}

function toggleTool(toolId) {
  if (toolId === 'artifacts') return;
  const checkbox = document.getElementById(`tool-${toolId}`);
  checkbox.checked = !checkbox.checked;
  updateToolStatus();
}

function updateToolStatus() {
  Object.keys(enabledTools).forEach(tool => {
    const checkbox = document.getElementById(`tool-${tool}`);
    if (checkbox) {
      enabledTools[tool] = checkbox.checked;
      const card = checkbox.closest('.tool-card');
      if (card) {
        card.classList.toggle('active', enabledTools[tool]);
      }
    }
  });
  
  updateActiveToolsDisplay();
  localStorage.setItem('enabled_tools', JSON.stringify(enabledTools));
}

function updateActiveToolsDisplay() {
  const container = document.getElementById('activeTools');
  const activeTools = Object.entries(enabledTools).filter(([_, enabled]) => enabled);
  
  if (activeTools.length > 0) {
    container.classList.remove('hidden');
    const toolNames = {
      artifacts: '🎨 Artifacts',
      websearch: '🔍 Search',
      coderun: '💻 Code',
      imagegen: '🖼️ Generate',
      imageanalyze: '👁️ Analyze',
      dataanalyze: '📊 Data'
    };
    
    container.innerHTML = '<span class="text-xs text-gray-600">Active:</span> ' +
      activeTools.map(([tool]) => 
        `<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">${toolNames[tool]}</span>`
      ).join(' ');
  } else {
    container.classList.add('hidden');
  }
}

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
    msg.innerHTML = `
      ${avatar}
      <div class="flex-1 min-w-0">
        ${renderArtifact(options.artifact)}
      </div>
    `;
  } else if (options.html) {
    msg.innerHTML = `
      ${avatar}
      <div class="flex-1 min-w-0">
        <div class="px-4 py-3 rounded-2xl ${bgColor} shadow-sm border">
          <div class="message-content text-sm sm:text-base">${content}</div>
        </div>
      </div>
    `;
  } else {
    msg.innerHTML = `
      ${avatar}
      <div class="flex-1 min-w-0">
        <div class="px-4 py-3 rounded-2xl ${bgColor} text-gray-800 shadow-sm border">
          <p class="leading-relaxed message-content text-sm sm:text-base">${escapeHtml(content)}</p>
        </div>
      </div>
    `;
  }
  
  container.appendChild(msg);
  scrollToBottom();
}

function renderArtifact(artifact) {
  artifactCount++;
  const artifactId = `artifact-${artifactCount}`;
  
  let previewContent = '';
  let codeView = `<div class="artifact-code">${escapeHtml(artifact.code)}</div>`;
  
  if (artifact.type === 'html' || artifact.type === 'react') {
    previewContent = `
      <iframe 
        id="${artifactId}-preview" 
        class="w-full h-full border-0" 
        sandbox="allow-scripts allow-same-origin"
        srcdoc="${escapeHtml(artifact.code)}"
      ></iframe>
    `;
  } else if (artifact.type === 'svg') {
    previewContent = `<div class="p-4 flex items-center justify-center">${artifact.code}</div>`;
  } else if (artifact.type === 'markdown') {
    previewContent = `<div class="p-4 prose max-w-none">${marked.parse(artifact.code)}</div>`;
  } else {
    previewContent = `<div class="p-4 text-gray-600 text-sm">No preview available for ${artifact.type}</div>`;
  }
  
  return `
    <div class="artifact-container">
      <div class="artifact-header">
        <div class="artifact-header-left">
          <span class="text-2xl">🎨</span>
          <div>
            <h3 class="text-white font-semibold text-sm sm:text-base">${artifact.title}</h3>
            <p class="text-purple-200 text-xs">${artifact.type.toUpperCase()} • ${artifact.language || 'Mixed'}</p>
          </div>
        </div>
        <div class="artifact-header-right">
          <button onclick="copyArtifact('${artifactId}')" class="artifact-button bg-white text-purple-600 hover:bg-purple-50">
            📋 Copy
          </button>
          <button onclick="downloadArtifact('${artifactId}', '${artifact.title}', '${artifact.type}')" class="artifact-button bg-white text-purple-600 hover:bg-purple-50">
            💾 Download
          </button>
        </div>
      </div>
      
      <div class="artifact-tabs">
        <div class="artifact-tab active" onclick="switchArtifactTab('${artifactId}', 'preview')">
          👁️ Preview
        </div>
        <div class="artifact-tab" onclick="switchArtifactTab('${artifactId}', 'code')">
          💻 Code
        </div>
      </div>
      
      <div class="artifact-body">
        <div id="${artifactId}-preview-tab" class="artifact-preview">
          ${previewContent}
        </div>
        <div id="${artifactId}-code-tab" class="hidden">
          ${codeView}
        </div>
      </div>
    </div>
    
    <script>
      window['artifact_${artifactId}'] = ${JSON.stringify(artifact.code)};
    </script>
  `;
}

function switchArtifactTab(artifactId, tab) {
  const container = document.querySelector(`#${artifactId}-preview-tab`).parentElement.parentElement;
  container.querySelectorAll('.artifact-tab').forEach(t => t.classList.remove('active'));
  container.querySelector(`.artifact-tab:nth-child(${tab === 'preview' ? 1 : 2})`).classList.add('active');
  
  document.getElementById(`${artifactId}-preview-tab`).classList.toggle('hidden', tab !== 'preview');
  document.getElementById(`${artifactId}-code-tab`).classList.toggle('hidden', tab !== 'code');
}

function copyArtifact(artifactId) {
  const code = window[`artifact_${artifactId}`];
  navigator.clipboard.writeText(code).then(() => {
    alert('✅ Code copied to clipboard!');
  });
}

function downloadArtifact(artifactId, title, type) {
  const code = window[`artifact_${artifactId}`];
  const extensions = {
    html: 'html',
    react: 'jsx',
    javascript: 'js',
    python: 'py',
    svg: 'svg',
    markdown: 'md'
  };
  
  const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extensions[type] || 'txt'}`;
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function clearChat() {
  if (confirm('Clear all messages?')) {
    messages = [];
    artifactCount = 0;
    const container = document.getElementById('messages');
    container.innerHTML = `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <span class="text-white">🧠</span>
        </div>
        <div class="flex-1">
          <div class="px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-purple-100">
            <p class="leading-relaxed text-sm sm:text-base">Chat cleared! Ready to create something amazing? 🚀</p>
          </div>
        </div>
      </div>
    `;
  }
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
      <div class="px-4 py-3 rounded-2xl bg-white shadow-sm border border-purple-100">
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

function showFileUpload() {
  document.getElementById('fileInput').click();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  uploadedFile = file;
  const reader = new FileReader();
  reader.onload = async (e) => {
    uploadedFileData = e.target.result;
    addMessage('user', `📎 Uploaded: ${file.name}`);
  };
  
  if (file.type.startsWith('image/')) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
}

async function sendMessage() {
  if (isLoading) return;
  const input = document.getElementById('userInput');
  const question = input.value.trim();
  if (!question) return;

  addMessage('user', question);
  input.value = '';
  isLoading = true;
  showLoading();

  try {
    if (aiSources.length === 0) {
      throw new Error('NO_AI_CONFIGURED');
    }

    const wantsArtifact = detectArtifactIntent(question);
    
    if (wantsArtifact) {
      const result = await generateArtifact(question, aiSources);
      hideLoading();
      
      if (result.artifact) {
        if (result.explanation) {
          addMessage('assistant', result.explanation);
        }
        addMessage('assistant', '', { artifact: result.artifact });
      } else {
        addMessage('assistant', result.answer || 'Failed to generate artifact. Please try again with more specific instructions.');
      }
    } else {
      const result = await queryAI(aiSources, question);
      hideLoading();
      addMessage('assistant', result.answer);
    }
  } catch (error) {
    hideLoading();
    let errorMsg = '😔 Sorry, I encountered an error. Please try again.';
    if (error.message === 'NO_AI_CONFIGURED') {
      errorMsg = '🔧 System not configured. Please contact administrator.';
    }
    addMessage('assistant', errorMsg);
  } finally {
    isLoading = false;
  }
}

function detectArtifactIntent(text) {
  const artifactKeywords = [
    'create', 'build', 'make', 'generate', 'buat', 'bikin',
    'website', 'app', 'application', 'component', 'page',
    'html', 'css', 'javascript', 'react', 'code',
    'calculator', 'game', 'form', 'dashboard', 'chart',
    'timer', 'clock', 'counter', 'animation', 'button'
  ];
  
  const lowerText = text.toLowerCase();
  return artifactKeywords.some(kw => lowerText.includes(kw));
}

async function generateArtifact(prompt, sources) {
  const systemPrompt = `You are an expert code generator. Generate COMPLETE, WORKING code based on user requests.

CRITICAL RULES:
1. ALWAYS respond with ONLY valid JSON in this exact format:
{
  "explanation": "Brief explanation of what you created",
  "artifact": {
    "title": "Project Name",
    "type": "html",
    "language": "html",
    "code": "COMPLETE WORKING CODE HERE"
  }
}

2. Code MUST be:
   - Complete and functional (no placeholders)
   - Self-contained (all CSS/JS inline for HTML)
   - Production-ready
   - Beautiful with modern design
   - Use Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>

3. NO markdown formatting, NO backticks, ONLY JSON

4. For HTML: Include <!DOCTYPE html>, complete structure, inline styles/scripts

Example response:
{"explanation":"Created a calculator","artifact":{"title":"Calculator","type":"html","language":"html","code":"<!DOCTYPE html><html>..."}}`;

  for (const source of sources) {
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

      if (!response.ok) continue;
      
      const data = await response.json();
      let content = data.choices[0].message.content.trim();
      
      // Clean up response
      content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      // Remove any leading/trailing text before/after JSON
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        content = content.substring(jsonStart, jsonEnd + 1);
      }
      
      try {
        const parsed = JSON.parse(content);
        if (parsed.artifact && parsed.artifact.code) {
          return parsed;
        }
      } catch (e) {
        console.error('JSON parse error:', e);
        // If not valid JSON, try to extract code and create artifact manually
        return {
          explanation: "I've created what you requested:",
          artifact: {
            title: "Generated Code",
            type: "html",
            language: "html",
            code: content
          }
        };
      }
    } catch (error) {
      console.error('Source failed:', error);
      continue;
    }
  }
  
  return { answer: "Failed to generate artifact. Please try again with clearer instructions." };
}

async function queryAI(sources, question) {
  const systemPrompt = `You are NextGenAI, a helpful AI assistant.

Be concise, professional, and helpful. If user wants to create something, suggest using phrases like "create", "build", or "make".`;

  for (const source of sources) {
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

      if (!response.ok) continue;
      
      const data = await response.json();
      return { answer: data.choices[0].message.content };
    } catch (error) {
      console.error('Source failed:', error);
      continue;
    }
  }
  
  throw new Error('All AI sources failed');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.addEventListener('DOMContentLoaded', init);
