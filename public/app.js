// app.js - NextGenAI Frontend Logic
// Fixed version with complete functionality

// ========================================
// STATE MANAGEMENT
// ========================================

let conversationHistory = [];
let currentModel = 'nefa';
let isProcessing = false;

// Load AI sources from localStorage (configured in admin panel)
function getAISources() {
  try {
    const sources = localStorage.getItem('ai_sources');
    return sources ? JSON.parse(sources) : [];
  } catch (error) {
    console.error('Failed to load AI sources:', error);
    return [];
  }
}

// ========================================
// UI FUNCTIONS
// ========================================

// Toggle model selector dropdown
function toggleModelSelector() {
  const selector = document.getElementById('modelSelector');
  selector.classList.toggle('hidden');
}

// Select model
function selectModel(model, event) {
  if (event) event.stopPropagation();
  
  currentModel = model;
  
  // Update UI
  const modelNames = {
    'nefa': 'Nefa',
    'mou': 'Mou 🔍',
    'nevi': 'Nevi 🎨',
    'vidi': 'Vidi 🎬'
  };
  
  document.getElementById('currentModelName').textContent = modelNames[model] || 'Nefa';
  document.getElementById('modelInfo').textContent = `Using: ${modelNames[model] || 'Nefa'}`;
  
  // Update active state
  document.querySelectorAll('.model-item').forEach(item => {
    item.classList.remove('active');
  });
  event?.target.closest('.model-item')?.classList.add('active');
  
  // Hide selector
  document.getElementById('modelSelector').classList.add('hidden');
  
  // Show notification
  updateStatus(`Switched to ${modelNames[model]}`);
  setTimeout(() => updateStatus('Ready'), 2000);
}

// Auto-resize textarea
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// Handle Enter key
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Update status text
function updateStatus(text) {
  document.getElementById('statusText').textContent = text;
}

// Clear chat
function clearChat() {
  if (confirm('Clear all messages?')) {
    conversationHistory = [];
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <span class="text-white">🧠</span>
        </div>
        <div class="flex-1">
          <div class="px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-purple-100">
            <div class="message-content text-sm">
              <p><strong>👋 Hello! I'm NextGenAI with specialized models.</strong></p>
              <p><strong>Choose your model:</strong></p>
              <ul>
                <li><strong>Nefa</strong> - Learns & adapts - Best for everything</li>
                <li><strong>Mou</strong> - Web search, code generation, deep research</li>
                <li><strong>Nevi</strong> - Image generation from text</li>
                <li><strong>Vidi</strong> - Video generation (coming soon)</li>
              </ul>
              <p>🚀 Let's create something amazing!</p>
            </div>
          </div>
        </div>
      </div>
    `;
    updateStatus('Chat cleared');
  }
}

// ========================================
// MESSAGE HANDLING
// ========================================

// Send message
async function sendMessage() {
  if (isProcessing) return;
  
  const input = document.getElementById('userInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Clear input
  input.value = '';
  input.style.height = 'auto';
  
  // Add user message to UI
  addMessage('user', message);
  
  // Add to conversation history
  conversationHistory.push({
    role: 'user',
    content: message
  });
  
  // Show typing indicator
  isProcessing = true;
  const typingId = addTypingIndicator();
  updateStatus('Thinking...');
  
  try {
    // Route to appropriate handler based on model
    let response;
    
    switch (currentModel) {
      case 'nefa':
        response = await handleNefaQuery(message);
        break;
      case 'mou':
        response = await handleMouQuery(message);
        break;
      case 'nevi':
        response = await handleNeviQuery(message);
        break;
      case 'vidi':
        response = { text: '🎬 Vidi (video generation) is coming soon! Stay tuned.' };
        break;
      default:
        response = await handleNefaQuery(message);
    }
    
    // Remove typing indicator
    removeTypingIndicator(typingId);
    
    // Add AI response
    if (response.text) {
      addMessage('assistant', response.text);
      conversationHistory.push({
        role: 'assistant',
        content: response.text
      });
    }
    
    // Handle special responses (images, artifacts, etc)
    if (response.imageUrl) {
      addImageMessage(response.imageUrl, response.prompt);
    }
    
    if (response.artifact) {
      addArtifactMessage(response.artifact);
    }
    
    updateStatus('Ready');
    
  } catch (error) {
    console.error('Error:', error);
    removeTypingIndicator(typingId);
    addMessage('assistant', `❌ Error: ${error.message}\n\nPlease check:\n- API keys configured in admin panel\n- Internet connection\n- API rate limits`);
    updateStatus('Error occurred');
  } finally {
    isProcessing = false;
  }
}

// ========================================
// MODEL HANDLERS
// ========================================

// Nefa: Self-learning AI (Smart mode)
async function handleNefaQuery(message) {
  const sources = getAISources();
  const enabledSources = sources.filter(s => s.enabled && s.apiKey);
  
  if (enabledSources.length === 0) {
    throw new Error('No AI sources configured. Please setup API keys in admin panel (/admin.html).');
  }
  
  updateStatus('Querying AI sources...');
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: conversationHistory,
      aiSources: enabledSources,
      mode: enabledSources.length > 1 ? 'smart' : 'fast'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'AI request failed');
  }
  
  const data = await response.json();
  
  return {
    text: data.answer,
    confidence: data.confidence,
    sources: data.sources
  };
}

// Mou: Research AI with web search
async function handleMouQuery(message) {
  // Check if query needs web search
  const needsSearch = detectSearchIntent(message);
  
  if (needsSearch) {
    updateStatus('Searching the web...');
    
    // Perform web search
    const searchResults = await performWebSearch(message);
    
    // Enhance query with search results
    const enhancedMessage = `
${message}

Here are recent search results to help answer:
${searchResults.map((r, i) => `${i+1}. ${r.title}: ${r.snippet}`).join('\n')}

Please provide a comprehensive answer using these sources.
`;
    
    conversationHistory[conversationHistory.length - 1].content = enhancedMessage;
  }
  
  // Query AI with enhanced context
  return await handleNefaQuery(enhancedMessage || message);
}

// Nevi: Image generation
async function handleNeviQuery(message) {
  updateStatus('Generating image...');
  
  const response = await fetch('/api/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'imagegen',
      prompt: message,
      width: 1024,
      height: 1024
    })
  });
  
  if (!response.ok) {
    throw new Error('Image generation failed');
  }
  
  const data = await response.json();
  
  return {
    text: `✨ Generated image for: "${message}"`,
    imageUrl: data.imageUrl,
    prompt: message
  };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// Detect if query needs web search
function detectSearchIntent(message) {
  const searchKeywords = [
    'latest', 'recent', 'current', 'today', 'news',
    'what is happening', 'update', 'search', 'find',
    'when did', 'who is', 'what happened'
  ];
  
  const lowerMessage = message.toLowerCase();
  return searchKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Perform web search
async function performWebSearch(query) {
  try {
    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'websearch',
        query: query
      })
    });
    
    if (!response.ok) {
      console.warn('Web search failed, continuing without search results');
      return [];
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// ========================================
// UI MESSAGE FUNCTIONS
// ========================================

// Add message to UI
function addMessage(role, content) {
  const messagesDiv = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'flex gap-3';
  
  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
        <span class="text-white text-sm">👤</span>
      </div>
      <div class="flex-1">
        <div class="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm">
          <div class="text-sm whitespace-pre-wrap">${escapeHtml(content)}</div>
        </div>
      </div>
    `;
  } else {
    // Parse markdown for AI responses
    const formattedContent = parseMarkdown(content);
    
    messageDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
        <span class="text-white">🧠</span>
      </div>
      <div class="flex-1">
        <div class="px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-purple-100">
          <div class="message-content text-sm">${formattedContent}</div>
        </div>
      </div>
    `;
  }
  
  messagesDiv.appendChild(messageDiv);
  scrollToBottom();
}

// Add typing indicator
function addTypingIndicator() {
  const messagesDiv = document.getElementById('messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'flex gap-3';
  typingDiv.id = 'typing-indicator';
  
  typingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
      <span class="text-white">🧠</span>
    </div>
    <div class="flex-1">
      <div class="px-4 py-3 rounded-2xl bg-white shadow-sm border border-purple-100 inline-block">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  
  messagesDiv.appendChild(typingDiv);
  scrollToBottom();
  return 'typing-indicator';
}

// Remove typing indicator
function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) indicator.remove();
}

// Add image message
function addImageMessage(imageUrl, prompt) {
  const messagesDiv = document.getElementById('messages');
  const imageDiv = document.createElement('div');
  imageDiv.className = 'flex gap-3';
  
  imageDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
      <span class="text-white">🎨</span>
    </div>
    <div class="flex-1">
      <div class="rounded-2xl bg-white shadow-sm border border-purple-100 overflow-hidden">
        <img src="${imageUrl}" alt="${escapeHtml(prompt)}" class="w-full h-auto" onerror="this.parentElement.innerHTML='<p class=\\'p-4 text-red-500\\'>Failed to load image</p>'">
        <div class="p-3 bg-gray-50 text-xs text-gray-600">
          <strong>Prompt:</strong> ${escapeHtml(prompt)}
        </div>
      </div>
    </div>
  `;
  
  messagesDiv.appendChild(imageDiv);
  scrollToBottom();
}

// Add artifact message
function addArtifactMessage(artifact) {
  const messagesDiv = document.getElementById('messages');
  const artifactDiv = document.createElement('div');
  artifactDiv.className = 'artifact-container';
  
  const artifactId = 'artifact-' + Date.now();
  
  artifactDiv.innerHTML = `
    <div class="artifact-header">
      <div class="text-white font-bold">${escapeHtml(artifact.title || 'Code Artifact')}</div>
      <div class="flex gap-2">
        <button onclick="copyArtifact('${artifactId}')" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm text-white">
          📋 Copy
        </button>
        <button onclick="downloadArtifact('${artifactId}')" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm text-white">
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
    <div id="${artifactId}-preview" class="artifact-preview">
      <iframe srcdoc="${escapeHtml(artifact.code)}" class="w-full h-full min-h-[400px] border-0"></iframe>
    </div>
    <div id="${artifactId}-code" class="artifact-code hidden">
      ${escapeHtml(artifact.code)}
    </div>
  `;
  
  messagesDiv.appendChild(artifactDiv);
  scrollToBottom();
}

// Switch artifact tab
function switchArtifactTab(artifactId, tab) {
  // Update tab active state
  const container = document.getElementById(artifactId + '-preview').parentElement.parentElement;
  container.querySelectorAll('.artifact-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  // Show/hide content
  document.getElementById(artifactId + '-preview').classList.toggle('hidden', tab !== 'preview');
  document.getElementById(artifactId + '-code').classList.toggle('hidden', tab !== 'code');
}

// Copy artifact code
function copyArtifact(artifactId) {
  const codeElement = document.getElementById(artifactId + '-code');
  const code = codeElement.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    updateStatus('Code copied to clipboard!');
    setTimeout(() => updateStatus('Ready'), 2000);
  });
}

// Download artifact
function downloadArtifact(artifactId) {
  const codeElement = document.getElementById(artifactId + '-code');
  const code = codeElement.textContent;
  
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `artifact-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
  
  updateStatus('Downloaded!');
  setTimeout(() => updateStatus('Ready'), 2000);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Scroll to bottom
function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 100);
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Simple markdown parser
function parseMarkdown(text) {
  let html = escapeHtml(text);
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]+?)\n```/g, '<pre class="bg-gray-100 p-3 rounded my-2 overflow-x-auto"><code>$2</code></pre>');
  
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc ml-5 my-2">$1</ul>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Remove empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('NextGenAI Frontend initialized');
  
  // Check if AI sources are configured
  const sources = getAISources();
  if (sources.length === 0 || !sources.some(s => s.enabled && s.apiKey)) {
    console.warn('No AI sources configured. User will be prompted.');
  }
  
  // Focus input
  document.getElementById('userInput')?.focus();
});

// Expose functions globally
window.sendMessage = sendMessage;
window.toggleModelSelector = toggleModelSelector;
window.selectModel = selectModel;
window.handleKeyPress = handleKeyPress;
window.autoResize = autoResize;
window.clearChat = clearChat;
window.switchArtifactTab = switchArtifactTab;
window.copyArtifact = copyArtifact;
window.downloadArtifact = downloadArtifact;
