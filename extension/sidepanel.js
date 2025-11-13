// Side Panel Manager for Dossier Extension

class DossierSidePanel {
    constructor() {
        // Tab elements
        this.summaryTab = document.getElementById('summaryTab');
        this.chatTab = document.getElementById('chatTab');
        this.summaryPanel = document.getElementById('summaryPanel');
        this.chatPanel = document.getElementById('chatPanel');
        
        // Summary elements
        // this.summaryStatus = document.getElementById('summaryStatus');
        this.summaryContent = document.getElementById('summaryContent');
        
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        
        // Save button
        this.saveButton = document.getElementById('saveButton');
        
        this.currentUrl = null;
        this.currentPageContent = null;
        this.eventSource = null;
        this.currentTab = 'summary';
        
        this.initializeEventListeners();
        this.init();
    }

    initializeEventListeners() {
        // Tab switching
        if (this.summaryTab) {
            this.summaryTab.addEventListener('click', () => this.switchTab('summary'));
        }
        
        if (this.chatTab) {
            this.chatTab.addEventListener('click', () => this.switchTab('chat'));
        }
        
        // Chat input
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.autoResizeTextarea();
                this.updateSendButton();
            });
            
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // Send button
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Save button
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => this.saveToBackend());
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        if (this.summaryTab && this.chatTab) {
            this.summaryTab.classList.toggle('active', tabName === 'summary');
            this.chatTab.classList.toggle('active', tabName === 'chat');
        }
        
        // Update tab panels
        if (this.summaryPanel && this.chatPanel) {
            this.summaryPanel.classList.toggle('active', tabName === 'summary');
            this.chatPanel.classList.toggle('active', tabName === 'chat');
        }
        
        // Focus input if switching to chat
        if (tabName === 'chat' && this.messageInput) {
            this.messageInput.focus();
        }
    }

    autoResizeTextarea() {
        if (this.messageInput) {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        }
    }

    updateSendButton() {
        if (this.sendButton && this.messageInput) {
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendButton.disabled = !hasText;
        }
    }

    sendMessage() {
        if (!this.messageInput) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addChatMessage('user', message);
        
        // Clear input
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateSendButton();
        
        // TODO: Send to backend and get response
        // For now, just show a placeholder response
        setTimeout(() => {
            this.addChatMessage('assistant', 'Chat functionality coming soon!');
        }, 500);
    }

    addChatMessage(sender, content) {
        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async init() {
        console.log('Initializing Dossier side panel');
        
        try {
            // Get current tab URL
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0) {
                this.showError('No active tab found');
                return;
            }
            
            const tab = tabs[0];
            this.currentUrl = tab.url;
            console.log('Current URL:', this.currentUrl);
            
            // Check if summary exists in cache
            const cachedSummary = await this.getCachedSummary(this.currentUrl);
            
            if (cachedSummary) {
                console.log('Loading from cache');
                this.displayCachedSummary(cachedSummary);
            } else {
                console.log('No cache found, fetching new summary');
                await this.fetchAndStreamSummary(tab.id);
            }
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError(error.message);
        }
    }

    async getCachedSummary(url) {
        try {
            const result = await chrome.storage.local.get(['dossier_cache']);
            const cache = result.dossier_cache || {};
            
            if (cache[url]) {
                const cached = cache[url];
                const now = Date.now();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (now - cached.timestamp < maxAge) {
                    return cached.summary;
                } else {
                    console.log('Cache expired');
                    delete cache[url];
                    await chrome.storage.local.set({ dossier_cache: cache });
                }
            }
            return null;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    async saveSummaryToCache(url, summary) {
        try {
            const result = await chrome.storage.local.get(['dossier_cache']);
            const cache = result.dossier_cache || {};
            
            cache[url] = {
                summary: summary,
                timestamp: Date.now()
            };
            
            await chrome.storage.local.set({ dossier_cache: cache });
            console.log('Summary saved to cache for:', url);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    displayCachedSummary(summary) {
        // this.summaryStatus.style.color = '#66ff66';
        // Use innerHTML directly to render HTML tags properly (don't escape)
        this.summaryContent.innerHTML = `<div class="summary-text">${summary}</div>`;
    }

    async fetchAndStreamSummary(tabId) {
        try {
            // this.summaryStatus.textContent = 'Getting page content...';
            
            // Get DOM content from page with retry logic
            const pageContent = await this.getPageContentWithRetry(tabId, 3);
            
            if (!pageContent) {
                throw new Error('Failed to get page content after multiple attempts');
            }
            
            console.log('Got page content, length:', pageContent.html.length);
            
            // Store page content for later use (save button)
            this.currentPageContent = pageContent;
            
            // Start streaming
            await this.streamSummaryFromBackend(pageContent);
            
        } catch (error) {
            console.error('Error fetching summary:', error);
            this.showError(error.message);
        }
    }

    async getPageContentWithRetry(tabId, maxRetries = 3) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt} to get page content...`);
                
                // Try to send message to content script
                const response = await chrome.tabs.sendMessage(tabId, { action: 'GET_DOM' });
                
                console.log('Response from content script:', response);
                if (response && response.success) {
                    console.log('Successfully got page content');
                    return response.content;
                }
                
                throw new Error(response?.error || 'No response from content script');
                
            } catch (error) {
                console.warn(`Attempt ${attempt} failed:`, error.message);
                lastError = error;
                
                // If it's a connection error, try to inject the content script
                if (error.message.includes('Could not establish connection') || 
                    error.message.includes('Receiving end does not exist')) {
                    
                    if (attempt < maxRetries) {
                        console.log('Trying to inject content script...');
                        
                        try {
                            await chrome.scripting.executeScript({
                                target: { tabId: tabId },
                                files: ['content_script.js']
                            });
                            console.log('Content script injected, waiting before retry...');
                            
                            // Wait a bit for script to initialize
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (injectionError) {
                            console.error('Failed to inject content script:', injectionError);
                        }
                    }
                } else {
                    // Different error, wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }
        
        // All retries failed
        throw new Error(`Could not get page content: ${lastError?.message || 'Unknown error'}. Please refresh the page and try again.`);
    }

    async streamSummaryFromBackend(pageContent) {
        // this.summaryStatus.textContent = 'Connecting to backend...';
        this.summaryContent.innerHTML = '<div class="summary-text streaming" id="streamingText"></div>';
        
        const streamingText = document.getElementById('streamingText');
        let fullSummary = '';

        try {
            // Make POST request with fetch for streaming
            // Match backend WebResource model: user_id, access_token, web_url
            const response = await fetch('http://127.0.0.1:8000/summary/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: "ramnagalla",
                    access_token: null,
                    web_url: pageContent.url,
                    page_content: pageContent.text,
                })
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            // this.summaryStatus.textContent = 'Streaming summary...';
            // this.summaryStatus.style.color = '#ffff66';

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
                console.log('Received chunk:', chunk);
                
                // Handle SSE format (data: {...}\n\n)
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    console.log('Processing line:', line);
                    
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6); // Remove 'data: ' prefix
                        console.log('Data after removing prefix:', data);
                        
                        if (data === '[DONE]') {
                            console.log('Received [DONE] signal');
                            break;
                        }
                        
                        // Try to parse as JSON first
                        try {
                            const parsed = JSON.parse(data);
                            console.log('Parsed JSON:', parsed);
                            
                            if (parsed.content) {
                                fullSummary += parsed.content;
                                streamingText.innerHTML = fullSummary;  // Use innerHTML to render HTML
                                console.log('Added content, total length:', fullSummary.length);
                            } else if (parsed.token) {
                                // Handle if backend sends {token: "text"}
                                fullSummary += parsed.token;
                                streamingText.innerHTML = fullSummary;  // Use innerHTML to render HTML
                            } else if (parsed.text) {
                                // Handle if backend sends {text: "text"}
                                fullSummary += parsed.text;
                                streamingText.innerHTML = fullSummary;  // Use innerHTML to render HTML
                            }
                            
                            // Auto-scroll
                            this.summaryContent.scrollTop = this.summaryContent.scrollHeight;
                        } catch (e) {
                            // If not JSON, append as plain text
                            console.log('Not JSON, treating as plain text:', data);
                            if (data.trim()) {
                                fullSummary += data;
                                streamingText.innerHTML = fullSummary;  // Use innerHTML to render HTML
                                this.summaryContent.scrollTop = this.summaryContent.scrollHeight;
                            }
                        }
                    } else if (line.trim() && !line.startsWith(':')) {
                        // Handle raw text without 'data:' prefix
                        console.log('Raw line without data prefix:', line);
                        fullSummary += line;
                        streamingText.innerHTML = fullSummary;  // Use innerHTML to render HTML
                        this.summaryContent.scrollTop = this.summaryContent.scrollHeight;
                    }
                }
            }

            // Stream complete
            streamingText.classList.remove('streaming');
            // this.summaryStatus.textContent = 'Summary complete';
            // this.summaryStatus.style.color = '#66ff66';
            
            // Save to cache
            if (fullSummary) {
                await this.saveSummaryToCache(this.currentUrl, fullSummary);
            }

        } catch (error) {
            console.error('Streaming error:', error);
            this.showError(`Streaming failed: ${error.message}`);
        }
    }

    showError(message) {
        // this.summaryStatus.textContent = 'Error';
        // this.summaryStatus.style.color = '#ff6666';
        this.summaryContent.innerHTML = `<div class="error-message">❌ ${this.escapeHtml(message)}</div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async saveToBackend() {
        try {
            // Disable button while saving
            if (this.saveButton) {
                this.saveButton.disabled = true;
                this.saveButton.textContent = '💾 Saving...';
            }

            // Check if we have page content
            if (!this.currentPageContent) {
                // Try to get it now
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length === 0) {
                    throw new Error('No active tab found');
                }
                
                this.currentPageContent = await this.getPageContentWithRetry(tabs[0].id, 3);
            }

            if (!this.currentPageContent) {
                throw new Error('No page content available to save');
            }

            console.log('Saving to backend:', {
                url: this.currentPageContent.url,
                title: this.currentPageContent.title,
                domLength: this.currentPageContent.html.length
            });

            // Make POST request to save endpoint
            const response = await fetch('http://127.0.0.1:8000/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: 'user123',
                    url: this.currentPageContent.url,
                    dom: this.currentPageContent.text,
                    title: this.currentPageContent.title,
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Save failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Save successful:', result);

            // Show success message
            if (this.saveButton) {
                this.saveButton.textContent = '✅ Saved!';
                setTimeout(() => {
                    this.saveButton.textContent = '💾 Save';
                    this.saveButton.disabled = false;
                }, 2000);
            }

            // You can also show a notification in the UI
            this.showSuccessNotification('Page saved successfully!');

        } catch (error) {
            console.error('Error saving to backend:', error);
            
            // Show error
            if (this.saveButton) {
                this.saveButton.textContent = '❌ Failed';
                setTimeout(() => {
                    this.saveButton.textContent = '💾 Save';
                    this.saveButton.disabled = false;
                }, 2000);
            }
            
            alert(`Failed to save: ${error.message}`);
        }
    }

    showSuccessNotification(message) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: #1a2a1a;
            color: #66ff66;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid #336633;
            font-size: 14px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    cleanup() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dossierPanel = new DossierSidePanel();
    console.log('Dossier side panel initialized');
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (window.dossierPanel) {
        window.dossierPanel.cleanup();
    }
    
    // Notify background script
    chrome.runtime.sendMessage({ action: 'sidePanelClosed' }).catch(() => {});
});

console.log('Dossier side panel script loaded');
