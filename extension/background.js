// Background Service Worker for Dossier Extension

// Track which tab has the side panel open
let activeSidePanelTabId = null;

// Set default behavior - panel opens on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {
        // Silently handle error
    });

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    try {
        chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'sidepanel.html',
            enabled: true
        });
        
        chrome.sidePanel.open({ tabId: tab.id }); 
        activeSidePanelTabId = tab.id;
    } catch (error) {
        // Silently handle error
    }
});

// Handle tab changes - hide side panel on other tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (activeSidePanelTabId && activeInfo.tabId !== activeSidePanelTabId) {
        try {
            await chrome.sidePanel.setOptions({
                tabId: activeInfo.tabId,
                enabled: false
            });
        } catch (error) {
            // Silently handle error
        }
    }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeSidePanelTabId) {
        activeSidePanelTabId = null;
    }
});

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sidePanelClosed') {
        activeSidePanelTabId = null;
    }
    return true;
});
