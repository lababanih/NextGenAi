// NextGenAI - FINAL FIX
// Complete Claude-like artifact system

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
let artifactCount = 0;

function init() {
  loadSources();
  loadToolsState();
  
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
      Please contact your administrator.
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

function toggleToolsMenu() {
  const menu = document.getElementById('toolsMenu');
  menu.classList.toggle('hidden');
}

function toggleTool(toolId) {
  enabledTools[toolId] = !enabledTools[toolId];
  localStorage.setItem('enabled_tools', JSON.stringify(enabledTools));
  
  // Update checkbox
  const checkbox = document.getElementById(`tool-${toolId}`);
  if (checkbox) checkbox.checked = enabledTools[toolId];
  
  // Update button appearance
  updateToolButtons();
}

function updateToolButtons() {
  // Update tool menu checkboxes
  Object.keys(enabledTools).forEach(tool => {
    const item = document.getElementById(`tool-${tool}`);
    if (item) {
      item.checked = enabledTools[tool];
    }
  });
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
  
  if (artifact.type === 'html') {
    previewContent = `
      <iframe 
        id="${artifactId}-preview" 
        class="w-full h-full border-0" 
        sandbox="allow-scripts allow-same-origin allow-forms"
        srcdoc="${escapeHtml(artifact.code)}"
      ></iframe>
    `;
  } else {
    previewContent = `<div class="p-4 text-gray-600 text-sm">Preview not available</div>`;
  }
  
  return `
    <div class="artifact-container">
      <div class="artifact-header">
        <div class="artifact-header-left">
          <span class="text-2xl">🎨</span>
          <div>
            <h3 class="text-white font-semibold text-sm sm:text-base">${artifact.title}</h3>
            <p class="text-purple-200 text-xs">${artifact.type.toUpperCase()}</p>
          </div>
        </div>
        <div class="artifact-header-right">
          <button onclick="copyArtifactCode('${artifactId}')" class="artifact-button bg-white text-purple-600 hover:bg-purple-50">
            📋 Copy
          </button>
          <button onclick="downloadArtifactCode('${artifactId}', '${escapeHtml(artifact.title)}', '${artifact.type}')" class="artifact-button bg-white text-purple-600 hover:bg-purple-50">
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
          <div class="artifact-code">${escapeHtml(artifact.code)}</div>
        </div>
      </div>
    </div>
    
    <script>
      window['artifact_code_${artifactId}'] = ${JSON.stringify(artifact.code)};
    </script>
  `;
}

function switchArtifactTab(artifactId, tab) {
  const container = document.querySelector(`#${artifactId}-preview-tab`).parentElement.parentElement;
  container.querySelectorAll('.artifact-tab').forEach(t => t.classList.remove('active'));
  
  if (tab === 'preview') {
    container.querySelector('.artifact-tab:first-child').classList.add('active');
  } else {
    container.querySelector('.artifact-tab:last-child').classList.add('active');
  }
  
  document.getElementById(`${artifactId}-preview-tab`).classList.toggle('hidden', tab !== 'preview');
  document.getElementById(`${artifactId}-code-tab`).classList.toggle('hidden', tab !== 'code');
}

function copyArtifactCode(artifactId) {
  const code = window[`artifact_code_${artifactId}`];
  navigator.clipboard.writeText(code).then(() => {
    alert('✅ Code copied to clipboard!');
  }).catch(() => {
    alert('❌ Failed to copy code');
  });
}

function downloadArtifactCode(artifactId, title, type) {
  const code = window[`artifact_code_${artifactId}`];
  const extensions = { html: 'html', react: 'jsx', javascript: 'js', python: 'py' };
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
      const result = await generateArtifactWithAI(question, aiSources);
      hideLoading();
      
      if (result.artifact) {
        if (result.explanation) {
          addMessage('assistant', result.explanation);
        }
        addMessage('assistant', '', { artifact: result.artifact });
      } else {
        addMessage('assistant', result.answer || 'I apologize, but I was unable to generate the code. Please try with more specific instructions.');
      }
    } else {
      const result = await queryAI(aiSources, question);
      hideLoading();
      addMessage('assistant', result.answer);
    }
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
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
  const keywords = [
    'create', 'build', 'make', 'generate', 'buat', 'bikin',
    'website', 'app', 'calculator', 'game', 'form', 
    'dashboard', 'chart', 'timer', 'admin panel'
  ];
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw));
}

async function generateArtifactWithAI(prompt, sources) {
  // CRITICAL: System prompt yang memaksa AI generate code, bukan JSON
  const systemPrompt = `You are a code generator. When user asks to create something, you MUST:

1. Generate ONLY the complete HTML code
2. NO explanations before or after
3. NO JSON format
4. NO markdown code blocks
5. Start directly with <!DOCTYPE html>
6. Include Tailwind CSS via CDN
7. Make it beautiful and functional
8. All CSS and JS must be inline

Example - if user asks "create a button":
You respond with ONLY this (no extra text):

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Button</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex items-center justify-center min-h-screen bg-gray-100">
  <button class="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
    Click Me
  </button>
</body>
</html>

REMEMBER: NO text before or after the code. Start with <!DOCTYPE html> immediately.`;

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

      if (!response.ok) {
        console.error(`Source ${source.name} failed: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      let code = data.choices[0].message.content.trim();
      
      // Clean up the code
      // Remove markdown code blocks if present
      code = code.replace(/```html\n?/g, '').replace(/```\n?$/g, '');
      
      // If code doesn't start with <!DOCTYPE, it might be wrapped in text
      if (!code.startsWith('<!DOCTYPE') && !code.startsWith('<html')) {
        // Try to extract HTML from the response
        const htmlMatch = code.match(/<!DOCTYPE[\s\S]*<\/html>/i);
        if (htmlMatch) {
          code = htmlMatch[0];
        }
      }
      
      // Verify we have valid HTML
      if (code.includes('<!DOCTYPE') || code.includes('<html')) {
        // Extract title from code if possible
        const titleMatch = code.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'Generated Code';
        
        return {
          explanation: "I've created what you requested:",
          artifact: {
            title: title,
            type: 'html',
            code: code
          }
        };
      }
      
      console.error('Invalid HTML generated:', code.substring(0, 200));
      continue;
      
    } catch (error) {
      console.error(`Error with ${source.name}:`, error);
      continue;
    }
  }
  
  return { 
    answer: "I apologize, but I couldn't generate the code. Please try again with more specific details about what you want to create." 
  };
}

async function queryAI(sources, question) {
  const systemPrompt = `You are NextGenAI, a helpful AI assistant. Be concise and professional.`;

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

// Close tools menu when clicking outside
document.addEventListener('click', function(e) {
  const menu = document.getElementById('toolsMenu');
  const button = document.querySelector('[onclick="toggleToolsMenu()"]');
  if (menu && !menu.contains(e.target) && !button?.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

window.addEventListener('DOMContentLoaded', init);
