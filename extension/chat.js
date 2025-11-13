// Chat functionality for Mage Chrome Extension
class MageChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.clearButton = document.getElementById('clearChat');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.charCount = document.getElementById('charCount');
        this.pageContentButton = document.getElementById('pageContentButton');
        this.pageContentDisplay = document.getElementById('pageContentDisplay');
        this.summaryDisplay = document.getElementById('summaryDisplay');
        this.summaryContent = document.getElementById('summaryContent');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyButton = document.getElementById('saveApiKey');
        this.apiKeyStatus = document.getElementById('apiKeyStatus');
        
        this.messages = [];
        this.isTyping = false;
        this.currentPageContent = null;
        this.geminiApiKey = null;
        
        this.initializeEventListeners();
        this.loadChatHistory();
        this.loadApiKey();
    }

    initializeEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key to send (Shift+Enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateCharCount();
            this.updateSendButton();
        });
        
        // Clear chat
        this.clearButton.addEventListener('click', () => this.clearChat());
        
        // Page content button
        if (this.pageContentButton) {
            this.pageContentButton.addEventListener('click', () => this.getPageContent());
        }
        
        // API key save button
        if (this.saveApiKeyButton) {
            this.saveApiKeyButton.addEventListener('click', () => this.saveApiKeyFromInput());
        }
        
        // Focus input on load
        this.messageInput.focus();
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = `${count}/1000`;
        
        if (count > 900) {
            this.charCount.style.color = '#e53e3e';
        } else if (count > 700) {
            this.charCount.style.color = '#dd6b20';
        } else {
            this.charCount.style.color = '#a0aec0';
        }
    }

    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isTyping;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateCharCount();
        this.updateSendButton();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Simulate AI response (replace with actual API call)
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage('assistant', response);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            console.error('Error getting AI response:', error);
        }

        this.saveChatHistory();
    }

    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store message
        this.messages.push({
            sender,
            content,
            timestamp: new Date().toISOString()
        });
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.style.display = 'flex';
        this.updateSendButton();
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
        this.updateSendButton();
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.messages = [];
            this.chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-content">
                        <div class="welcome-icon">👋</div>
                        <h3>Welcome to Mage!</h3>
                        <p>Your AI-powered QA assistant. Ask me anything!</p>
                    </div>
                </div>
            `;
            this.saveChatHistory();
        }
    }

    // Get AI response from Gemini 1.5 Flash API
    async getAIResponse(userMessage) {
        if (!this.geminiApiKey) {
            return "Please set your Gemini API key in the settings to use AI features.";
        }

        try {
            // Prepare the context with page content if available
            let context = "";
            if (this.currentPageContent) {
                context = `\n\nPage Context:\nTitle: ${this.currentPageContent.metadata.title}\nURL: ${this.currentPageContent.metadata.url}\nContent: ${this.currentPageContent.text.substring(0, 2000)}...`;
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are Mage, an AI assistant that helps users understand and interact with web page content. You can analyze the current page and answer questions about it.\n\nUser question: ${userMessage}${context}`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                        topP: 0.8,
                        topK: 10
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return `Sorry, I encountered an error: ${error.message}`;
        }
    }

    saveChatHistory() {
        try {
            localStorage.setItem('mage_chat_history', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('mage_chat_history');
            if (saved) {
                this.messages = JSON.parse(saved);
                this.renderChatHistory();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.messages = [];
        }
    }

    renderChatHistory() {
        if (this.messages.length === 0) return;
        
        // Clear welcome message
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        // Render all messages
        this.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender}`;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = message.content;
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(messageTime);
            this.chatMessages.appendChild(messageDiv);
        });
        
        this.scrollToBottom();
    }

    // Get page content from the current tab
    async getPageContent(retryCount = 0) {
        try {
            this.showTypingIndicator();
            
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                const response = await chrome.runtime.sendMessage({ action: 'getPageContent' });
                
                if (response && response.success) {
                    this.currentPageContent = response.content;
                    this.displayPageContent(response.content);
                    this.addMessage('system', `Page content loaded: ${response.content.metadata.title} (${response.content.wordCount} words)`);
                } else {
                    this.addMessage('system', 'Failed to load page content: ' + (response?.error || 'Unknown error'));
                }
            } else {
                this.addMessage('system', 'Chrome extension APIs not available');
            }
        } catch (error) {
            console.error('Error getting page content:', error);
            
            // Retry logic for certain errors
            if (retryCount < 2 && (
                error.message.includes('Page is still loading') ||
                error.message.includes('Page is navigating') ||
                error.message.includes('No URL found for the current tab')
            )) {
                this.addMessage('system', `Retrying... (${retryCount + 1}/2)`);
                setTimeout(() => {
                    this.getPageContent(retryCount + 1);
                }, 1000 * (retryCount + 1)); // Exponential backoff
                return;
            }
            
            // Provide helpful error messages
            if (error.message.includes('Content script not loaded') || 
                error.message.includes('Content script not available')) {
                this.addMessage('system', 'Content script not loaded. Please refresh the current page and try again.');
            } else if (error.message.includes('Cannot extract content from browser internal pages')) {
                this.addMessage('system', 'Cannot extract content from browser internal pages. Please navigate to a regular website.');
            } else if (error.message.includes('No URL found for the current tab')) {
                this.addMessage('system', 'No URL found for the current tab. Please navigate to a website first, then try loading page content.');
            } else if (error.message.includes('Page is still loading')) {
                this.addMessage('system', 'Page is still loading. Please wait for it to finish loading and try again.');
            } else if (error.message.includes('Page is navigating')) {
                this.addMessage('system', 'Page is navigating. Please wait for navigation to complete and try again.');
            } else if (error.message.includes('Cannot extract content from new tab or blank page')) {
                this.addMessage('system', 'Please navigate to a website first, then try loading page content.');
            } else if (error.message.includes('Invalid tab URL format')) {
                this.addMessage('system', 'Invalid page format. Please refresh the page and try again.');
            } else if (error.message.includes('Cannot extract content from this type of page')) {
                this.addMessage('system', 'This page type is not supported. Please navigate to a regular website (http/https).');
            } else {
                this.addMessage('system', 'Error loading page content: ' + error.message);
            }
        } finally {
            this.hideTypingIndicator();
        }
    }

    // Display page content in the UI
    displayPageContent(content) {
        if (this.pageContentDisplay) {
            this.pageContentDisplay.innerHTML = `
                <div class="page-content-info">
                    <h4>📄 Current Page</h4>
                    <div class="page-meta">
                        <strong>Title:</strong> ${content.metadata.title}<br>
                        <strong>URL:</strong> <a href="${content.metadata.url}" target="_blank">${content.metadata.url}</a><br>
                        <strong>Words:</strong> ${content.wordCount}<br>
                        ${content.metadata.description ? `<strong>Description:</strong> ${content.metadata.description}<br>` : ''}
                    </div>
                    <div class="page-content-preview">
                        <strong>Content Preview:</strong><br>
                        <div class="content-text">${content.text.substring(0, 500)}${content.text.length > 500 ? '...' : ''}</div>
                    </div>
                </div>
            `;
            this.pageContentDisplay.style.display = 'block';
        }
    }

    // Load API key from storage
    async loadApiKey() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get(['geminiApiKey']);
                this.geminiApiKey = result.geminiApiKey || null;
            } else {
                // Fallback to localStorage
                this.geminiApiKey = localStorage.getItem('geminiApiKey');
            }
            
            // Update UI
            this.updateApiKeyUI();
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }

    // Save API key to storage
    async saveApiKey(apiKey) {
        try {
            this.geminiApiKey = apiKey;
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ geminiApiKey: apiKey });
            } else {
                // Fallback to localStorage
                localStorage.setItem('geminiApiKey', apiKey);
            }
        } catch (error) {
            console.error('Error saving API key:', error);
        }
    }

    // Set API key (can be called from external scripts)
    setApiKey(apiKey) {
        this.saveApiKey(apiKey);
        this.addMessage('system', 'Gemini API key updated successfully!');
    }

    // Save API key from input field
    async saveApiKeyFromInput() {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            this.updateApiKeyStatus('Please enter an API key', 'error');
            return;
        }
        
        await this.saveApiKey(apiKey);
        this.updateApiKeyStatus('API key saved successfully!', 'success');
        this.apiKeyInput.value = '';
    }

    // Update API key UI
    updateApiKeyUI() {
        if (this.apiKeyInput) {
            this.apiKeyInput.value = this.geminiApiKey ? '••••••••••••••••' : '';
        }
        
        if (this.apiKeyStatus) {
            if (this.geminiApiKey) {
                this.updateApiKeyStatus('API key is set', 'success');
            } else {
                this.updateApiKeyStatus('No API key set', 'warning');
            }
        }
    }

    // Update API key status message
    updateApiKeyStatus(message, type) {
        if (this.apiKeyStatus) {
            this.apiKeyStatus.textContent = message;
            this.apiKeyStatus.className = `api-key-status ${type}`;
        }
    }

    // Display summary from API response
    displaySummary(summary) {
        if (this.summaryDisplay && this.summaryContent) {
            this.summaryContent.innerHTML = `
                <div class="summary-text">${summary}</div>
            `;
            this.summaryDisplay.style.display = 'block';
            
            // Add a system message about the summary
            this.addMessage('system', 'Page summary loaded successfully!');
        }
    }

    // Display error message
    displayError(errorMessage) {
        if (this.summaryDisplay && this.summaryContent) {
            this.summaryContent.innerHTML = `
                <div class="error-message">❌ Error: ${errorMessage}</div>
            `;
            this.summaryDisplay.style.display = 'block';
            
            // Add a system message about the error
            this.addMessage('system', `Failed to load page summary: ${errorMessage}`);
        }
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mageChatInstance = new MageChat();
});

// Handle extension lifecycle
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'focusInput') {
            const input = document.getElementById('messageInput');
            if (input) {
                input.focus();
            }
        } else if (request.action === 'displaySummary') {
            // Get the chat instance and display the summary
            const chatInstance = window.mageChatInstance;
            if (chatInstance) {
                chatInstance.displaySummary(request.summary);
            } else {
                // If chat instance is not ready, wait a bit and try again
                console.log('Chat instance not ready, retrying in 500ms...');
                setTimeout(() => {
                    const retryInstance = window.mageChatInstance;
                    if (retryInstance) {
                        retryInstance.displaySummary(request.summary);
                    }
                }, 500);
            }
        } else if (request.action === 'displayError') {
            // Get the chat instance and display the error
            const chatInstance = window.mageChatInstance;
            if (chatInstance) {
                chatInstance.displayError(request.error);
            } else {
                // If chat instance is not ready, wait a bit and try again
                console.log('Chat instance not ready, retrying in 500ms...');
                setTimeout(() => {
                    const retryInstance = window.mageChatInstance;
                    if (retryInstance) {
                        retryInstance.displayError(request.error);
                    }
                }, 500);
            }
        }
    });
} else {
    console.warn('Chrome extension APIs not available in this context');
}
