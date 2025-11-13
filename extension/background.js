// Background Service Worker for Dossier Extension

// Track which tab has the side panel open
let activeSidePanelTabId = null;

// Set default behavior - panel opens on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => {
        console.log('Side panel behavior set');
    })
    .catch((error) => {
        console.error('Error setting panel behavior:', error);
    });

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    console.log('Extension icon clicked for tab:', tab.id);
    
    try {
        // Set the side panel for this tab
        chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'sidepanel.html',
            enabled: true
        });
        
        // // Open the side panel
        chrome.sidePanel.open({ tabId: tab.id }); 
        
        activeSidePanelTabId = tab.id;
        console.log('Side panel opened for tab:', tab.id);
    } catch (error) {
        console.error('Error opening side panel:', error);
    }
});

// Handle tab changes - hide side panel on other tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('Tab activated:', activeInfo.tabId);
    
    if (activeSidePanelTabId && activeInfo.tabId !== activeSidePanelTabId) {
        // Different tab activated - disable side panel
        try {
            await chrome.sidePanel.setOptions({
                tabId: activeInfo.tabId,
                enabled: false
            });
        } catch (error) {
            console.log('Side panel already disabled for this tab');
        }
    }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeSidePanelTabId) {
        activeSidePanelTabId = null;
        console.log('Active side panel tab closed');
    }
});

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sidePanelClosed') {
        activeSidePanelTabId = null;
        console.log('Side panel closed');
    }
    return true;
});

console.log('Dossier background service worker initialized');
