// NextGenAI - Main Application Logic
// Complete Tool Implementation

// State Management
let currentTab = 'chat';
let messages = [];
let isLoading = false;
let aiSources = [];
let enabledTools = {
  websearch: false,
  coderun: false,
  imagegen: false,
  imageanalyze: false,
  dataanalyze: false,
  docgen: false
};
let uploadedFile = null;
let uploadedFileData = null;

const defaultSources = [
  {
    id: 'groq-1',
    name: 'Primary Engine (Groq)',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: '',
    priority: 1,
    enabled: true,
    description: '✨ Main processing engine - FREE'
  }
];

// Initialize
function init() {
  loadSources();
  loadToolsState();
  renderConfigPanel();
  updateStats();
  updateActiveToolsDisplay();
}

// Load/Save Functions
function loadSources() {
  const saved = localStorage.getItem('ai_sources');
  aiSources = saved ? JSON.parse(saved) : [...defaultSources];
}

function loadToolsState() {
  const saved = localStorage.getItem('enabled_tools');
  if (saved) {
    enabledTools = JSON.parse(saved);
    Object.keys(enabledTools).forEach(tool => {
      const checkbox = document.getElementById(`tool-${tool}`);
      if (checkbox) checkbox.checked = enabledTools[tool];
    });
  }
}

function saveConfig() {
  localStorage.setItem('ai_sources', JSON.stringify(aiSources));
  localStorage.setItem('enabled_tools', JSON.stringify(enabledTools));
  alert('✅ Configuration saved!');
}

// Tab Management
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`content-${tab}`).classList.add('active');
  
  document.querySelectorAll('[id^="tab-"]').forEach(el => {
    el.className = 'px-6 py-3 font-medium border-b-2 border-transparent text-gray-600 hover:text-purple-600';
  });
  document.getElementById(`tab-${tab}`).className = 'px-6 py-3 font-medium border-b-2 border-purple-500 text-purple-600';
  
  if (tab === 'config') {
    renderConfigPanel();
    updateStats();
  }
}

// Tool Management
function toggleTool(toolId) {
  const checkbox = document.getElementById(`tool-${toolId}`);
  checkbox.checked = !checkbox.checked;
  updateToolStatus();
}

function updateToolStatus() {
  Object.keys(enabledTools).forEach(tool => {
    const checkbox = document.getElementById(`tool-${tool}`);
    enabledTools[tool] = checkbox?.checked || false;
    
    const card = checkbox?.closest('.tool-card');
    if (card) {
      if (enabledTools[tool]) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
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
      websearch: '🔍 Search',
      coderun: '💻 Code',
      imagegen: '🎨 Generate',
      imageanalyze: '🖼️ Analyze',
      dataanalyze: '📊 Data',
      docgen: '📄 Docs'
    };
    
    container.innerHTML = '<span class="text-xs text-gray-600">Active:</span> ' +
      activeTools.map(([tool]) => 
        `<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">${toolNames[tool]}</span>`
      ).join(' ');
  } else {
    container.classList.add('hidden');
  }
}

// Config Panel
function renderConfigPanel() {
  const container = document.getElementById('configSources');
  container.innerHTML = aiSources.map(source => {
    const hasKey = source.apiKey && source.apiKey.length > 5;
    return `
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-start gap-4">
          <label class="relative inline-flex items-center cursor-pointer mt-1">
            <input type="checkbox" ${source.enabled ? 'checked' : ''} 
                   onchange="toggleSource('${source.id}')" 
                   ${!hasKey ? 'disabled' : ''}
                   class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <div class="flex-1">
            <h3 class="font-bold mb-2">${source.name}</h3>
            <p class="text-sm text-gray-600 mb-3">${source.description}</p>
            <input
              type="password"
              value="${source.apiKey || ''}"
              placeholder="API Key..."
              onchange="updateKey('${source.id}', this.value)"
              class="w-full px-3 py-2 text-sm border rounded-lg ${hasKey ? 'border-green-300 bg-green-50' : 'border-amber-300'}"
            />
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleSource(id) {
  const source = aiSources.find(s => s.id === id);
  if (source) {
    source.enabled = !source.enabled;
    renderConfigPanel();
    updateStats();
  }
}

function updateKey(id, key) {
  const source = aiSources.find(s => s.id === id);
  if (source) {
    source.apiKey = key.trim();
    renderConfigPanel();
    updateStats();
  }
}

function updateStats() {
  const active = aiSources.filter(s => s.enabled && s.apiKey).length;
  const pending = aiSources.filter(s => !s.apiKey).length;
  document.getElementById('statsTotal').textContent = aiSources.length;
  document.getElementById('statsActive').textContent = active;
  document.getElementById('statsPending').textContent = pending;
}

// File Upload
function showFileUpload() {
  document.getElementById('fileInput').click();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  uploadedFile = file;
  
  // Read file as base64
  const reader = new FileReader();
  reader.onload = async (e) => {
    uploadedFileData = e.target.result;
    addMessage('user', `📎 Uploaded: ${file.name}`);
    
    // Auto-process based on file type
    if (file.type.startsWith('image/') && enabledTools.imageanalyze) {
      await processImageAnalysis(file, uploadedFileData);
    } else if (file.name.endsWith('.csv') && enabledTools.dataanalyze) {
      await processCSVAnalysis(file);
    }
  };
  
  if (file.type.startsWith('image/')) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
}

// Message Management
function addMessage(role, content, html = false) {
  messages.push({ role, content });
  const container = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.className = `flex gap-3 ${role === 'user' ? 'flex-row-reverse' : ''}`;
  
  const avatar = role === 'user' 
    ? '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0"><span class="text-white">👤</span></div>'
    : '<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0"><span class="text-white">🧠</span></div>';
  
  const bgColor = role === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-white border-purple-100';
  
  if (html) {
    msg.innerHTML = `
      ${avatar}
      <div class="flex-1">
        <div class="px-4 py-3 rounded-2xl ${bgColor} shadow-sm border">
          <div class="message-content">${content}</div>
        </div>
      </div>
    `;
  } else {
    msg.innerHTML = `
      ${avatar}
      <div class="flex-1">
        <div class="px-4 py-3 rounded-2xl ${bgColor} text-gray-800 shadow-sm border">
          <p class="leading-relaxed message-content">${escapeHtml(content)}</p>
        </div>
      </div>
    `;
  }
  
  container.appendChild(msg);
  scrollToBottom();
}

function clearChat() {
  if (confirm('Clear all messages?')) {
    messages = [];
    const container = document.getElementById('messages');
    container.innerHTML = `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <span class="text-white">🧠</span>
        </div>
        <div class="flex-1">
          <div class="px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-purple-100">
            <p class="leading-relaxed">Chat cleared! How can I help you? 🚀</p>
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
  document.getElementById('statusText').textContent = 'Thinking...';
}

function hideLoading() {
  const loading = document.getElementById('loadingIndicator');
  if (loading) loading.remove();
  document.getElementById('statusText').textContent = 'Ready';
}

// Main Chat Function
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
    const enabledSources = aiSources.filter(s => s.enabled && s.apiKey);
    if (enabledSources.length === 0) {
      throw new Error('SERVICE_UNAVAILABLE');
    }

    // Check if tools should be used
    let response;
    
    // Web Search Tool
    if (enabledTools.websearch && shouldUseWebSearch(question)) {
      response = await handleWebSearch(question, enabledSources);
    }
    // Code Execution Tool
    else if (enabledTools.coderun && shouldRunCode(question)) {
      response = await handleCodeExecution(question);
    }
    // Image Generation Tool
    else if (enabledTools.imagegen && shouldGenerateImage(question)) {
      response = await handleImageGeneration(question);
    }
    // Image Analysis Tool (with uploaded image)
    else if (enabledTools.imageanalyze && uploadedFileData) {
      response = await handleImageAnalysis(question, uploadedFileData, enabledSources);
      uploadedFileData = null; // Reset after use
    }
    // Regular Chat
    else {
      response = await queryAI(enabledSources, question);
    }

    hideLoading();
    
    if (response.html) {
      addMessage('assistant', response.answer, true);
    } else {
      addMessage('assistant', response.answer);
    }
  } catch (error) {
    hideLoading();
    let errorMsg = '😔 Maaf, saya sedang mengalami gangguan. Silakan coba lagi.';
    if (error.message === 'SERVICE_UNAVAILABLE') {
      errorMsg = '🔧 Sistem perlu konfigurasi. Silakan setup di Configuration tab.';
    }
    addMessage('assistant', errorMsg);
  } finally {
    isLoading = false;
    document.getElementById('sendBtn').disabled = false;
  }
}

// AI Query Function
async function queryAI(sources, question) {
  const systemPrompt = {
    role: 'system',
    content: `You are NextGenAI, an advanced AI assistant with multiple capabilities.

IDENTITY: You are NextGenAI - never mention other AI names (Claude, GPT, etc).

ENABLED TOOLS: ${Object.entries(enabledTools).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'none'}

RESPONSE STYLE: Professional, helpful, concise but comprehensive.

If user asks about tools, explain what's available based on enabled tools above.`
  };

  for (const source of sources) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${source.apiKey}`
      };

      const response = await fetch(source.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: source.model,
          messages: [systemPrompt, ...messages.slice(-10).map(m => ({ role: m.role, content: m.content }))],
          max_tokens: 2048,
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('Failed');
      
      const data = await response.json();
      return { answer: data.choices[0].message.content };
    } catch (error) {
      console.error('Provider failed:', error);
      continue;
    }
  }
  throw new Error('All sources failed');
}

// Tool Detection
function shouldUseWebSearch(question) {
  const searchKeywords = ['search', 'cari', 'latest', 'terbaru', 'news', 'berita', 'current', 'sekarang', 'what is', 'siapa', 'dimana', 'kapan'];
  return searchKeywords.some(kw => question.toLowerCase().includes(kw));
}

function shouldRunCode(question) {
  const codeKeywords = ['run', 'execute', 'code', 'python', 'javascript', 'jalankan', 'eksekusi'];
  return codeKeywords.some(kw => question.toLowerCase().includes(kw));
}

function shouldGenerateImage(question) {
  const imageKeywords = ['generate image', 'create image', 'buat gambar', 'draw', 'gambar'];
  return imageKeywords.some(kw => question.toLowerCase().includes(kw));
}

// TOOL IMPLEMENTATIONS

// 1. Web Search Tool (Brave Search API)
async function handleWebSearch(query, aiSources) {
  try {
    // Using FREE Brave Search API
    const searchQuery = encodeURIComponent(query);
    const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${searchQuery}&count=5`;
    
    // Note: You need Brave API key (free tier available)
    // For now, using mock data
    const searchResults = await mockWebSearch(query);
    
    // Use AI to synthesize search results
    const synthesisPrompt = `Based on these search results, answer the question: "${query}"

Search Results:
${searchResults.map((r, i) => `${i+1}. ${r.title}\n${r.snippet}`).join('\n\n')}

Provide a comprehensive answer citing the sources.`;

    const aiResponse = await queryAI(aiSources, synthesisPrompt);
    
    return {
      answer: `🔍 **Search Results:**\n\n${aiResponse.answer}\n\n📚 Sources:\n${searchResults.map((r, i) => `${i+1}. [${r.title}](${r.url})`).join('\n')}`
    };
  } catch (error) {
    return { answer: '❌ Web search failed. Please check your Brave API key.' };
  }
}

async function mockWebSearch(query) {
  // Mock data - replace with real API call
  return [
    { title: 'Search Result 1', url: 'https://example.com/1', snippet: 'Relevant information about ' + query },
    { title: 'Search Result 2', url: 'https://example.com/2', snippet: 'More details on ' + query }
  ];
}

// 2. Code Execution Tool (Piston API - 100% FREE)
async function handleCodeExecution(question) {
  try {
    // Extract code from question
    const codeMatch = question.match(/```(\w+)?\n([\s\S]*?)```/);
    if (!codeMatch) {
      return { answer: '❌ Please provide code in markdown code blocks. Example:\n```python\nprint("Hello")\n```' };
    }
    
    const language = codeMatch[1] || 'python';
    const code = codeMatch[2];
    
    // Execute via Piston API (FREE)
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language,
        version: '*',
        files: [{ content: code }]
      })
    });
    
    const result = await response.json();
    
    if (result.run) {
      const output = result.run.output || result.run.stdout || 'No output';
      return {
        answer: `✅ **Code Executed Successfully**\n\nLanguage: ${language}\n\nOutput:\n\`\`\`\n${output}\n\`\`\``
      };
    } else {
      return { answer: `❌ Execution failed: ${result.message}` };
    }
  } catch (error) {
    return { answer: '❌ Code execution failed: ' + error.message };
  }
}

// 3. Image Generation Tool (Pollinations.ai - FREE)
async function handleImageGeneration(prompt) {
  try {
    // Extract image description
    const description = prompt.replace(/generate image|create image|buat gambar|draw|gambar/gi, '').trim();
    
    // Use Pollinations.ai (100% FREE)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(description)}?width=1024&height=1024`;
    
    return {
      html: true,
      answer: `
        <div>
          <p class="mb-3">🎨 <strong>Image Generated:</strong></p>
          <img src="${imageUrl}" alt="${description}" class="rounded-lg shadow-lg max-w-full" onload="this.style.opacity=1" style="opacity:0;transition:opacity 0.5s" />
          <p class="mt-2 text-sm text-gray-600">Prompt: ${description}</p>
        </div>
      `
    };
  } catch (error) {
    return { answer: '❌ Image generation failed: ' + error.message };
  }
}

// 4. Image Analysis Tool (Groq Vision - FREE)
async function handleImageAnalysis(question, imageData, aiSources) {
  try {
    const visionSource = aiSources.find(s => s.model.includes('vision') || s.model.includes('llama-3.2'));
    
    if (!visionSource) {
      return { answer: '❌ No vision-capable AI configured. Please add Llama 3.2 Vision to your sources.' };
    }
    
    const response = await fetch(visionSource.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${visionSource.apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: question || 'Describe this image in detail.' },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }],
        max_tokens: 1024
      })
    });
    
    const data = await response.json();
    return { answer: '🖼️ **Image Analysis:**\n\n' + data.choices[0].message.content };
  } catch (error) {
    return { answer: '❌ Image analysis failed: ' + error.message };
  }
}

async function processImageAnalysis(file, imageData) {
  const enabledSources = aiSources.filter(s => s.enabled && s.apiKey);
  showLoading();
  const result = await handleImageAnalysis('Analyze this image', imageData, enabledSources);
  hideLoading();
  if (result.html) {
    addMessage('assistant', result.answer, true);
  } else {
    addMessage('assistant', result.answer);
  }
}

// 5. CSV Data Analysis (Client-side with Chart.js)
async function processCSVAnalysis(file) {
  showLoading();
  
  Papa.parse(file, {
    complete: (results) => {
      hideLoading();
      
      const data = results.data;
      const headers = data[0];
      const rows = data.slice(1, 11); // First 10 rows
      
      // Create table
      let tableHtml = '<div class="overflow-x-auto"><table class="min-w-full border"><thead><tr>';
      headers.forEach(h => tableHtml += `<th class="border px-4 py-2 bg-gray-100">${h}</th>`);
      tableHtml += '</tr></thead><tbody>';
      rows.forEach(row => {
        tableHtml += '<tr>';
        row.forEach(cell => tableHtml += `<td class="border px-4 py-2">${cell}</td>`);
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></div>';
      
      addMessage('assistant', `
        <div>
          <p class="mb-3">📊 <strong>CSV Analysis:</strong></p>
          <p class="mb-2">Rows: ${data.length - 1} | Columns: ${headers.length}</p>
          ${tableHtml}
          <p class="mt-3 text-sm text-gray-600">Showing first 10 rows</p>
        </div>
      `, true);
    },
    header: false
  });
}

// Helper Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
