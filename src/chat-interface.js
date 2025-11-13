/**
 * Chat Interface Manager
 * Handles AI chat functionality with streaming responses
 */

class ChatInterface {
    constructor() {
        // Elements
        this.chatFloatingButton = document.getElementById('chatFloatingButton');
        this.chatPanel = document.getElementById('chatPanel');
        this.closeChatPanel = document.getElementById('closeChatPanel');
        this.toggleSidebar = document.getElementById('toggleSidebar');
        this.chatSidebar = document.getElementById('chatSidebar');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.chatSendBtn = document.getElementById('chatSendBtn');
        this.collectionsTree = document.getElementById('collectionsTree');
        
        // State
        this.isStreaming = false;
        this.conversationHistory = [];
        this.collections = [];
        this.bookmarks = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSidebarData();
        this.setupCollapsible();
    }
    
    setupEventListeners() {
        // Open/close chat panel
        this.chatFloatingButton.addEventListener('click', () => this.openChat());
        this.closeChatPanel.addEventListener('click', () => this.closeChat());
        
        // Toggle sidebar
        this.toggleSidebar.addEventListener('click', () => this.toggleSidebarCollapse());
        
        // Send message
        this.chatSendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
        });
    }
    
    setupCollapsible() {
        // Setup collapsible sections
        document.querySelectorAll('.sidebar-section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.closest('.collapse-btn')) return;
                
                const section = header.closest('.sidebar-section');
                section.classList.toggle('collapsed');
            });
        });
        
        // Setup collapse button click
        document.querySelectorAll('.collapse-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const section = btn.closest('.sidebar-section');
                section.classList.toggle('collapsed');
            });
        });
    }
    
    openChat() {
        this.chatPanel.classList.add('active');
        this.chatFloatingButton.style.display = 'none';
        this.chatInput.focus();
    }
    
    closeChat() {
        this.chatPanel.classList.remove('active');
        this.chatFloatingButton.style.display = 'flex';
    }
    
    toggleSidebarCollapse() {
        this.chatSidebar.classList.toggle('collapsed');
    }
    
    async loadSidebarData() {
        try {
            // Load both categories and bookmarks
            await Promise.all([
                this.loadCollections(),
                this.loadAllBookmarks()
            ]);
            
            // Build and render tree
            this.renderCollectionsTree();
        } catch (error) {
            console.error('Error loading sidebar data:', error);
        }
    }
    
    async loadCollections() {
        try {
            const response = await fetch(`${API_BASE_URL}/categories?user_id=${USER_ID}`);
            
            if (!response.ok) {
                throw new Error('Failed to load collections');
            }
            
            this.collections = await response.json();
        } catch (error) {
            console.error('Error loading collections:', error);
            this.collections = [];
        }
    }
    
    async loadAllBookmarks() {
        try {
            const response = await fetch(`${API_BASE_URL}/documents?user_id=${USER_ID}`);
            
            if (!response.ok) {
                throw new Error('Failed to load bookmarks');
            }
            
            const data = await response.json();
            this.bookmarks = data.documents || data || [];
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            this.bookmarks = [];
        }
    }
    
    async getCollectionBookmarks(categoryId) {
        try {
            console.log('Fetching bookmarks for category ID:', categoryId);
            
            if (!categoryId || categoryId === 'undefined') {
                console.error('Invalid category ID:', categoryId);
                return [];
            }
            
            const url = `${API_BASE_URL}/categories/${categoryId}/documents?user_id=${USER_ID}`;
            console.log('Fetching from URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('Failed to fetch bookmarks:', response.status, response.statusText);
                return [];
            }
            
            const data = await response.json();
            console.log('Received bookmarks:', data);
            return data.documents || data || [];
        } catch (error) {
            console.error('Error loading collection bookmarks:', error);
            return [];
        }
    }
    
    renderCollectionsTree() {
        if (!this.collections || this.collections.length === 0) {
            this.collectionsTree.innerHTML = '<div class="sidebar-loading">No collections yet</div>';
            return;
        }
        
        console.log('Rendering collections:', this.collections);
        
        this.collectionsTree.innerHTML = this.collections.map(collection => {
            // Handle both 'id' and 'category_id' properties
            const collectionId = collection.id || collection.category_id || collection._id;
            
            // Handle different possible count property names
            const bookmarkCount = collection.bookmark_count || collection.document_count || collection.count || collection.bookmarks?.length || 0;
            
            console.log('Collection:', collection.name, 'ID:', collectionId, 'Count:', bookmarkCount, 'Raw collection:', collection);
            
            return `
                <div class="collection-item collapsed" data-collection-id="${collectionId}">
                    <div class="collection-header">
                        <div class="collection-toggle">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="collection-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                            </svg>
                        </div>
                        <div class="collection-info">
                            <div class="collection-name">${this.escapeHtml(collection.name)}</div>
                        </div>
                    </div>
                    <div class="collection-bookmarks">
                        <div class="sidebar-loading">Click to load bookmarks</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers for collections
        this.collectionsTree.querySelectorAll('.collection-header').forEach((header, index) => {
            const collectionItem = header.closest('.collection-item');
            const collectionId = collectionItem.dataset.collectionId;
            const bookmarksContainer = collectionItem.querySelector('.collection-bookmarks');
            let bookmarksLoaded = false;
            
            console.log('Setting up handler for collection ID:', collectionId);
            
            header.addEventListener('click', async (e) => {
                // Don't trigger if clicking on bookmark items
                if (e.target.closest('.bookmark-item')) return;
                
                console.log('Clicked collection, ID:', collectionId);
                
                // Toggle collapsed state
                collectionItem.classList.toggle('collapsed');
                
                // Load bookmarks if not loaded yet and expanding
                if (!bookmarksLoaded && !collectionItem.classList.contains('collapsed')) {
                    console.log('Loading bookmarks for collection:', collectionId);
                    const bookmarks = await this.getCollectionBookmarks(collectionId);
                    this.renderBookmarksForCollection(bookmarksContainer, bookmarks);
                    bookmarksLoaded = true;
                }
            });
        });
    }
    
    renderBookmarksForCollection(container, bookmarks) {
        if (!bookmarks || bookmarks.length === 0) {
            container.innerHTML = '<div class="sidebar-loading">No bookmarks</div>';
            return;
        }
        
        container.innerHTML = bookmarks.map(bookmark => {
            const domain = this.extractDomain(bookmark.url);
            const title = bookmark.title || bookmark.url;
            
            return `
                <div class="bookmark-item" data-bookmark-id="${bookmark.id}">
                    <div class="bookmark-title">${this.escapeHtml(title)}</div>
                    <div class="bookmark-domain">${this.escapeHtml(domain)}</div>
                </div>
            `;
        }).join('');
        
        // Add click handlers for bookmarks
        container.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const title = item.querySelector('.bookmark-title').textContent;
                this.insertContext(`Tell me about: ${title}`);
            });
        });
    }
    
    insertContext(text) {
        this.chatInput.value = text;
        this.chatInput.focus();
    }
    
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }
    
    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message || this.isStreaming) {
            return;
        }
        
        // Clear welcome message if present
        const welcomeMsg = this.chatMessages.querySelector('.chat-welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });
        
        // Stream AI response
        await this.streamAIResponse(message);
    }
    
    addMessage(content, type = 'assistant') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'chat-message-avatar';
        avatar.textContent = type === 'user' ? 'U' : 'AI';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'chat-message-text';
        textDiv.innerHTML = this.escapeHtml(content);
        
        contentDiv.appendChild(textDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    async streamAIResponse(userMessage) {
        this.isStreaming = true;
        this.chatSendBtn.disabled = true;
        
        // Create assistant message container
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message assistant';
        
        const avatar = document.createElement('div');
        avatar.className = 'chat-message-avatar';
        avatar.textContent = 'AI';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'chat-message-text';
        
        const streamingIndicator = document.createElement('span');
        streamingIndicator.className = 'chat-message-streaming';
        textDiv.appendChild(streamingIndicator);
        
        contentDiv.appendChild(textDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        let fullResponse = '';
        
        try {
            // Make streaming request to backend
            const response = await fetch('http://127.0.0.1:8000/summary/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: "user123",
                    access_token: null,
                    web_url: window.location.href,
                    page_content: userMessage,
                    isSummary: false,
                })
            });
            
            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }
            
            // Remove streaming indicator
            streamingIndicator.remove();
            
            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('Stream complete');
                    break;
                }
                
                // Decode the chunk
                const chunk = decoder.decode(value, { stream: true });
                
                // Handle SSE format (data: {...}\n\n)
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6); // Remove 'data: ' prefix
                        
                        if (data === '[DONE]') {
                            break;
                        }
                        
                        // Try to parse as JSON first
                        try {
                            const parsed = JSON.parse(data);
                            
                            if (parsed.content) {
                                fullResponse += parsed.content;
                                textDiv.innerHTML = fullResponse; // Render HTML directly
                            } else if (parsed.token) {
                                fullResponse += parsed.token;
                                textDiv.innerHTML = fullResponse; // Render HTML directly
                            } else if (parsed.text) {
                                fullResponse += parsed.text;
                                textDiv.innerHTML = fullResponse; // Render HTML directly
                            }
                            
                            this.scrollToBottom();
                        } catch (e) {
                            // If not JSON, append as plain text
                            if (data.trim()) {
                                fullResponse += data;
                                textDiv.innerHTML = fullResponse; // Render HTML directly
                                this.scrollToBottom();
                            }
                        }
                    } else if (line.trim() && !line.startsWith(':')) {
                        // Handle raw text without 'data:' prefix
                        fullResponse += line;
                        textDiv.innerHTML = fullResponse; // Render HTML directly
                        this.scrollToBottom();
                    }
                }
            }
            
            // Add to conversation history
            if (fullResponse) {
                this.conversationHistory.push({
                    role: 'assistant',
                    content: fullResponse
                });
            }
            
        } catch (error) {
            console.error('Streaming error:', error);
            streamingIndicator.remove();
            textDiv.innerHTML = `<span style="color: #F44336;">Error: ${this.escapeHtml(error.message)}</span>`;
        } finally {
            this.isStreaming = false;
            this.chatSendBtn.disabled = false;
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatMarkdown(text) {
        if (!text) return '';
        
        // Escape HTML first to prevent XSS
        let formatted = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Bold: **text** or __text__
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Italic: *text* or _text_
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
        
        // Code: `code`
        formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');
        
        // Line breaks: double newline = paragraph break
        formatted = formatted.replace(/\n\n/g, '</p><p>');
        
        // Single line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Wrap in paragraph if not already
        if (!formatted.startsWith('<p>')) {
            formatted = '<p>' + formatted + '</p>';
        }
        
        // Bullet points: lines starting with - or *
        formatted = formatted.replace(/<p>[-*]\s(.+?)<\/p>/g, '<ul><li>$1</li></ul>');
        formatted = formatted.replace(/<br>[-*]\s(.+?)<br>/g, '<li>$1</li>');
        
        // Numbered lists: lines starting with 1. 2. etc
        formatted = formatted.replace(/<p>\d+\.\s(.+?)<\/p>/g, '<ol><li>$1</li></ol>');
        formatted = formatted.replace(/<br>\d+\.\s(.+?)<br>/g, '<li>$1</li>');
        
        // Headers: # Header
        formatted = formatted.replace(/<p>###\s(.+?)<\/p>/g, '<h3>$1</h3>');
        formatted = formatted.replace(/<p>##\s(.+?)<\/p>/g, '<h2>$1</h2>');
        formatted = formatted.replace(/<p>#\s(.+?)<\/p>/g, '<h1>$1</h1>');
        
        return formatted;
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatInterface = new ChatInterface();
});

