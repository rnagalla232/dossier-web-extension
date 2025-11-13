// Content script to extract DOM content from web pages

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_DOM') {
        try {
            // Get the full page content
            const pageContent = {
                html: document.documentElement.innerHTML,
                text: document.body.innerText,
                title: document.title,
                url: window.location.href,
                domain: window.location.hostname
            };
            
            console.log('Sending DOM content, length:', pageContent.html.length);
            sendResponse({ success: true, content: pageContent });
        } catch (error) {
            console.error('Error extracting DOM:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep message channel open for async response
});

console.log('Dossier content script loaded');
