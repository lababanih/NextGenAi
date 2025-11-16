// app.js - NextGenAI Frontend Logic
// Enhanced with Artifacts System & Multi-Language Learning

// ========================================
// STATE MANAGEMENT
// ========================================

let conversationHistory = [];
let currentModel = 'nefa';
let isProcessing = false;

// Load AI sources from localStorage
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
// CODE DETECTION & ARTIFACT SYSTEM
// ========================================

// Detect if response should create artifact
function shouldCreateArtifact(message, response) {
  // Keywords that suggest code/artifact creation
  const artifactKeywords = [
    'create', 'build', 'make', 'generate', 'buat', 'bikin',
    'code', 'script', 'program', 'kode', 'skrip',
    'website', 'app', 'aplikasi', 'game',
    'html', 'css', 'javascript', 'python', 'lua', 'roblox',
    'calculator', 'kalkulator', 'dashboard', 'panel', 'admin'
  ];

  const messageLower = message.toLowerCase();
  const hasKeyword = artifactKeywords.some(k => messageLower.includes(k));

  // Check if response contains code blocks
  const hasCodeBlock = response.includes('```');

  // Check if response is primarily code (more than 10 lines)
  const codeLines = (response.match(/\n/g) || []).length;
  const isPrimarilyCode = codeLines > 10 && hasCodeBlock;

  return (hasKeyword && hasCodeBlock) || isPrimarilyCode;
}

// Extract code from response
function extractCode(response) {
  // Try to extract code from markdown code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)\n```/g;
  const matches = [...response.matchAll(codeBlockRegex)];

  if (matches.length > 0) {
    return {
      language: matches[0][1] || 'text',
      code: matches[0][2],
      fullResponse: response
    };
  }

  // If no code blocks but looks like code, return as-is
  if (response.includes('function') || response.includes('local') || response.includes('def')) {
    return {
      language: detectLanguage(response),
      code: response,
      fullResponse: response
    };
  }

  return null;
}

// Detect programming language
function detectLanguage(code) {
  const patterns = {
    'javascript': /\b(function|const|let|var|=>|\{|\})\b/,
    'python': /\b(def|import|class|print|if __name__)\b/,
    'lua': /\b(local|function|end|then|do)\b/,
    'html': /<\/?[a-z][\s\S]*>/i,
    'css': /\{[\s\S]*:[^\}]*\}/,
    'java': /\b(public|private|class|static|void)\b/,
    'cpp': /\b(#include|int main|std::)\b/,
    'csharp': /\b(using|namespace|public class)\b/
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) return lang;
  }

  return 'text';
}

// Generate artifact title from user message
function generateArtifactTitle(message) {
  // Extract main topic from message
  const words = message.split(' ').slice(0, 5);
  return words.join(' ').replace(/[^\w\s]/g, '').substring(0, 40);
}

// ========================================
// UI FUNCTIONS
// ========================================

function toggleModelSelector() {
  const selector = document.getElementById('modelSelector');
  selector.classList.toggle('hidden');
}

function selectModel(model, event) {
  if (event) event.stopPropagation();
  
  currentModel = model;
  
  const modelNames = {
    'nefa': 'Nefa',
    'mou': 'Mou 🔍',
    'nevi': 'Nevi 🎨',
    'vidi': 'Vidi 🎬'
  };
  
  document.getElementById('currentModelName').textContent = modelNames[model] || 'Nefa';
  document.getElementById('modelInfo').textContent = `Using: ${modelNames[model] || 'Nefa'}`;
  
  document.querySelectorAll('.model-item').forEach(item => {
    item.classList.remove('active');
  });
  event?.target.closest('.model-item')?.classList.add('active');
  
  document.getElementById('modelSelector').classList.add('hidden');
  
  updateStatus(`Switched to ${modelNames[model]}`);
  setTimeout(() => updateStatus('Ready'), 2000);
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function updateStatus(text) {
  document.getElementById('statusText').textContent = text;
}

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

async function sendMessage() {
  if (isProcessing) return;
  
  const input = document.getElementById('userInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  input.value = '';
  input.style.height = 'auto';
  
  addMessage('user', message);
  
  conversationHistory.push({
    role: 'user',
    content: message
  });
  
  isProcessing = true;
  const typingId = addTypingIndicator();
  updateStatus('Thinking...');
  
  try {
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
    
    removeTypingIndicator(typingId);
    
    // Check if should create artifact
    if (response.text && shouldCreateArtifact(message, response.text)) {
      const extracted = extractCode(response.text);
      
      if (extracted) {
        // Add explanation text (without code)
        const explanation = response.text.replace(/```[\s\S]*?```/g, '').trim();
        if (explanation) {
          addMessage('assistant', explanation);
        }
        
        // Add artifact
        addArtifactMessage({
          title: generateArtifactTitle(message),
          language: extracted.language,
          code: extracted.code
        });
        
        conversationHistory.push({
          role: 'assistant',
          content: response.text
        });
      } else {
        // Normal message
        addMessage('assistant', response.text);
        conversationHistory.push({
          role: 'assistant',
          content: response.text
        });
      }
    } else {
      // Normal message
      if (response.text) {
        addMessage('assistant', response.text);
        conversationHistory.push({
          role: 'assistant',
          content: response.text
        });
      }
    }
    
    // Handle special responses
    if (response.imageUrl) {
      addImageMessage(response.imageUrl, response.prompt);
    }
    
    updateStatus('Ready');
    
  } catch (error) {
    console.error('Error:', error);
    removeTypingIndicator(typingId);
    addMessage('assistant', `❌ Error: ${error.message}\n\nPlease check:\n• API keys configured in admin panel\n• Internet connection\n• API rate limits`);
    updateStatus('Error occurred');
  } finally {
    isProcessing = false;
  }
}

// ========================================
// MODEL HANDLERS WITH MULTI-LANGUAGE LEARNING
// ========================================

async function handleNefaQuery(message) {
  const sources = getAISources();
  const enabledSources = sources.filter(s => s.enabled && s.apiKey);
  
  if (enabledSources.length === 0) {
    throw new Error('No AI sources configured. Please setup API keys in admin panel (/admin.html).');
  }
  
  // Enhance prompt for better code generation
  const enhancedMessage = enhancePromptForCodeGeneration(message);
  
  updateStatus('Learning from multiple AIs...');
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [...conversationHistory.slice(-5), { role: 'user', content: enhancedMessage }],
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

async function handleMouQuery(message) {
  let queryMessage = message;
  
  const needsSearch = detectSearchIntent(message);
  
  if (needsSearch) {
    updateStatus('Searching the web...');
    
    try {
      const searchResults = await performWebSearch(message);
      
      if (searchResults.length > 0) {
        queryMessage = `
${message}

Here are recent search results to help answer:
${searchResults.map((r, i) => `${i+1}. ${r.title}: ${r.snippet}`).join('\n')}

Please provide a comprehensive answer using these sources.
`;
      }
    } catch (error) {
      console.warn('Web search failed, continuing with normal query:', error);
    }
  }
  
  return await handleNefaQuery(queryMessage);
}

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
// PROMPT ENHANCEMENT FOR CODE GENERATION
// ========================================

function enhancePromptForCodeGeneration(message) {
  const codeKeywords = ['create', 'build', 'make', 'generate', 'buat', 'bikin', 'script', 'code', 'program'];
  const hasCodeKeyword = codeKeywords.some(k => message.toLowerCase().includes(k));
  
  if (!hasCodeKeyword) {
    return message;
  }
  
  // Add code generation guidelines
  return `${message}

IMPORTANT INSTRUCTIONS:
- Provide complete, working code that can be used immediately
- Include clear comments explaining each section
- Follow best practices and industry standards
- Make code clean, efficient, and well-structured
- If multiple files needed, organize them clearly
- Include example usage if applicable
- Wrap code in markdown code blocks with language identifier`;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function detectSearchIntent(message) {
  const searchKeywords = [
    'latest', 'recent', 'current', 'today', 'news', 'terbaru', 'sekarang',
    'what is happening', 'update', 'search', 'find', 'cari',
    'when did', 'who is', 'what happened', 'kapan', 'siapa'
  ];
  
  const lowerMessage = message.toLowerCase();
  return searchKeywords.some(keyword => lowerMessage.includes(keyword));
}

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
      console.warn('Web search failed');
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

function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) indicator.remove();
}

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

// ========================================
// ENHANCED ARTIFACT SYSTEM
// ========================================

function addArtifactMessage(artifact) {
  const messagesDiv = document.getElementById('messages');
  const artifactId = 'artifact-' + Date.now();
  
  // Create artifact container
  const artifactDiv = document.createElement('div');
  artifactDiv.className = 'artifact-container ml-11';
  
  // Determine if code can be previewed
  const canPreview = ['html', 'javascript', 'css'].includes(artifact.language.toLowerCase()) || 
                     artifact.code.includes('<html') || 
                     artifact.code.includes('<!DOCTYPE');
  
  // Map language names to Prism.js language classes
  const languageMap = {
    'javascript': 'javascript',
    'python': 'python',
    'lua': 'lua',
    'java': 'java',
    'cpp': 'cpp',
    'c++': 'cpp',
    'csharp': 'csharp',
    'c#': 'csharp',
    'go': 'go',
    'rust': 'rust',
    'typescript': 'typescript',
    'jsx': 'jsx',
    'html': 'markup',
    'css': 'css',
    'sql': 'sql',
    'text': 'text'
  };
  
  const prismLanguage = languageMap[artifact.language.toLowerCase()] || 'text';
  
  artifactDiv.innerHTML = `
    <div class="artifact-header">
      <div>
        <div class="text-white font-bold text-lg">✨ ${escapeHtml(artifact.title || 'Code')}</div>
        <div class="text-white/80 text-sm mt-1">
          <span class="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">${artifact.language}</span>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        ${canPreview ? `
        <button onclick="runArtifact('${artifactId}')" class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg text-sm text-white font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
          <span>▶️</span> Run Code
        </button>
        ` : ''}
        <button onclick="copyArtifact('${artifactId}')" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-medium transition-all flex items-center gap-2">
          <span>📋</span> Copy
        </button>
        <button onclick="downloadArtifact('${artifactId}', '${artifact.language}')" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-medium transition-all flex items-center gap-2">
          <span>💾</span> Download
        </button>
      </div>
    </div>
    ${canPreview ? `
    <div class="artifact-tabs">
      <div class="artifact-tab active" onclick="switchArtifactTab('${artifactId}', 'code')">
        💻 Code
      </div>
      <div class="artifact-tab" onclick="switchArtifactTab('${artifactId}', 'preview')">
        👁️ Live Preview
      </div>
    </div>
    ` : ''}
    <div id="${artifactId}-code" class="artifact-code-container" style="display: block;">
      <pre class="language-${prismLanguage} line-numbers"><code class="language-${prismLanguage}">${escapeHtml(artifact.code)}</code></pre>
    </div>
    ${canPreview ? `
    <div id="${artifactId}-preview" class="artifact-preview" style="display: none;">
      <iframe id="${artifactId}-iframe" class="w-full border-0" style="min-height: 500px; background: white;"></iframe>
    </div>
    ` : ''}
  `;
  
  // Store code in data attribute
  artifactDiv.dataset.code = artifact.code;
  artifactDiv.dataset.language = artifact.language;
  
  messagesDiv.appendChild(artifactDiv);
  
  // Apply Prism.js syntax highlighting
  setTimeout(() => {
    const codeBlock = artifactDiv.querySelector('code');
    if (codeBlock && window.Prism) {
      Prism.highlightElement(codeBlock);
    }
  }, 0);
  
  scrollToBottom();
}

function switchArtifactTab(artifactId, tab) {
  const codeDiv = document.getElementById(artifactId + '-code');
  const previewDiv = document.getElementById(artifactId + '-preview');
  
  if (!previewDiv) return;
  
  // Update tabs
  const container = codeDiv.parentElement;
  const tabs = container.querySelectorAll('.artifact-tab');
  tabs.forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  // Show/hide content
  if (tab === 'code') {
    codeDiv.style.display = 'block';
    previewDiv.style.display = 'none';
  } else {
    codeDiv.style.display = 'none';
    previewDiv.style.display = 'block';
    
    // Load preview if not already loaded
    const iframe = document.getElementById(artifactId + '-iframe');
    if (!iframe.src && !iframe.srcdoc) {
      const container = codeDiv.parentElement;
      const code = container.dataset.code;
      iframe.srcdoc = code;
    }
  }
}

function runArtifact(artifactId) {
  const container = document.getElementById(artifactId + '-code').parentElement;
  const code = container.dataset.code;
  const iframe = document.getElementById(artifactId + '-iframe');
  
  if (iframe) {
    iframe.srcdoc = code;
    switchArtifactTab(artifactId, 'preview');
    updateStatus('Code executed!');
    setTimeout(() => updateStatus('Ready'), 2000);
  }
}

function copyArtifact(artifactId) {
  const container = document.getElementById(artifactId + '-code').parentElement;
  const code = container.dataset.code;
  
  navigator.clipboard.writeText(code).then(() => {
    // Show beautiful notification
    showNotification('✅ Code copied to clipboard!', 'success');
    
    // Animate button
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    button.innerHTML = '<span>✓</span> Copied!';
    button.classList.add('bg-green-500');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('bg-green-500');
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    showNotification('❌ Copy failed', 'error');
  });
}

function downloadArtifact(artifactId, language) {
  const container = document.getElementById(artifactId + '-code').parentElement;
  const code = container.dataset.code;
  
  const extensions = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'lua': 'lua',
    'html': 'html',
    'css': 'css',
    'java': 'java',
    'cpp': 'cpp',
    'c++': 'cpp',
    'csharp': 'cs',
    'c#': 'cs',
    'go': 'go',
    'rust': 'rs',
    'sql': 'sql'
  };
  
  const ext = extensions[language.toLowerCase()] || 'txt';
  const filename = `code-${Date.now()}.${ext}`;
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification(`✅ Downloaded as ${filename}`, 'success');
}

function showNotification(message, type = 'success') {
  // Remove existing notification
  const existing = document.querySelector('.copy-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.style.background = type === 'success' ? '#10b981' : '#ef4444';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function scrollToBottom() {
  const container = document.getElementById('messagesContainer');
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 100);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function parseMarkdown(text) {
  let html = escapeHtml(text);
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
  
  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc ml-5 my-2">$&</ul>');
  
  // Line breaks to paragraphs
  html = html.split('\n\n').map(p => p.trim() ? `<p class="my-2">${p}</p>` : '').join('');
  
  return html;
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('✨ NextGenAI Enhanced Edition initialized');
  console.log('🎨 Artifact system enabled');
  console.log('🌍 Multi-language learning active');
  
  const sources = getAISources();
  if (sources.length === 0 || !sources.some(s => s.enabled && s.apiKey)) {
    console.warn('⚠️ No AI sources configured. Please setup in admin panel.');
  } else {
    console.log(`✅ ${sources.filter(s => s.enabled && s.apiKey).length} AI source(s) ready`);
  }
  
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
window.runArtifact = runArtifact;
