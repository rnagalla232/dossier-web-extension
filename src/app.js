// ============================================
// Configuration
// ============================================
const API_BASE_URL = 'http://localhost:8000';
const USER_ID = 'user123'; // In a real app, this would come from authentication

// ============================================
// State Management
// ============================================
let bookmarks = [];
let filteredBookmarks = [];
let deleteTargetId = null;
let isInitialLoad = true;

// ============================================
// API Functions
// ============================================
async function fetchBookmarks(silent = false) {
    try {
        if (!silent && isInitialLoad) {
            showLoading(true);
        }
        
        const response = await fetch(`${API_BASE_URL}/documents?user_id=${USER_ID}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch bookmarks');
        }
        
        const allBookmarks = await response.json();
        // Filter out FAILED status bookmarks
        const newBookmarks = allBookmarks.filter(b => b.processing_status !== 'FAILED');
        
        if (isInitialLoad) {
            // First load - render everything normally
            bookmarks = newBookmarks;
            filteredBookmarks = bookmarks;
            renderBookmarks();
            updateBookmarkCount();
            showLoading(false);
            isInitialLoad = false;
        } else {
            // Subsequent loads - detect changes and update smoothly (never show loading)
            updateBookmarksSmoothly(newBookmarks);
        }
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        showLoading(false); // Always hide loading on error
        if (!silent) {
            showToast('Failed to load bookmarks. Please check if the backend is running.', 'error');
            showEmptyState(true);
        }
    }
}

function updateBookmarksSmoothly(newBookmarks) {
    // Find new bookmarks (ones that don't exist in current list)
    const existingIds = new Set(bookmarks.map(b => b._id));
    const addedBookmarks = newBookmarks.filter(b => !existingIds.has(b._id));
    
    // Find removed bookmarks
    const newIds = new Set(newBookmarks.map(b => b._id));
    const removedBookmarks = bookmarks.filter(b => !newIds.has(b._id));
    
    // Update bookmark list
    bookmarks = newBookmarks;
    
    // Remove deleted bookmarks with animation
    removedBookmarks.forEach(bookmark => {
        const card = document.querySelector(`[data-id="${bookmark._id}"]`);
        if (card) {
            card.classList.add('removing');
            setTimeout(() => {
                card.remove();
                // Re-apply search filter after removal
                applyCurrentSearch();
                updateBookmarkCount();
            }, 300);
        }
    });
    
    // Add new bookmarks at the top with animation
    if (addedBookmarks.length > 0) {
        addedBookmarks.reverse().forEach(bookmark => {
            prependBookmark(bookmark);
        });
        updateBookmarkCount();
    }
    
    // Update existing bookmarks (in case status changed)
    updateExistingBookmarks(newBookmarks);
}

async function createBookmark(url, notes) {
    try {
        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: USER_ID,
                url: url,
                description: notes || null,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to create bookmark');
        }
        
        const newBookmark = await response.json();
        const statusCode = response.status;
        
        if (statusCode === 201) {
            showToast('Bookmark saved successfully!', 'success');
        } else if (statusCode === 200) {
            showToast('This bookmark already exists!', 'success');
        }
        
        await fetchBookmarks(true); // Silent refresh - no loading spinner
        return newBookmark;
    } catch (error) {
        console.error('Error creating bookmark:', error);
        showToast('Failed to save bookmark. Please try again.', 'error');
        throw error;
    }
}

async function deleteBookmark(documentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete bookmark');
        }
        
        showToast('Bookmark deleted successfully!', 'success');
        await fetchBookmarks(true); // Silent refresh - no loading spinner
    } catch (error) {
        console.error('Error deleting bookmark:', error);
        showToast('Failed to delete bookmark. Please try again.', 'error');
        throw error;
    }
}

// ============================================
// UI Rendering Functions
// ============================================
function createBookmarkCard(bookmark, isNew = false) {
    // Extract domain from URL for display
    let domain = '';
    try {
        const url = new URL(bookmark.url);
        domain = url.hostname.replace('www.', '');
    } catch (e) {
        domain = bookmark.url;
    }
    
    const card = document.createElement('div');
    card.className = `bookmark-card ${isNew ? 'new-bookmark' : ''}`;
    card.setAttribute('data-id', bookmark._id);
    
    card.innerHTML = `
        <div class="bookmark-header">
            <div class="bookmark-domain">${escapeHtml(domain)}</div>
            <div class="bookmark-actions">
                <button class="action-btn" onclick="openBookmarkUrl('${escapeHtml(bookmark.url)}')" title="Open URL">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="openDeleteModal('${bookmark._id}')" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
        ${bookmark.description ? `<div class="bookmark-notes">${escapeHtml(bookmark.description)}</div>` : ''}
        <div class="bookmark-footer">
            <span class="bookmark-date">${formatDate(bookmark.created_at)}</span>
        </div>
    `;
    
    return card;
}

function renderBookmarks() {
    const grid = document.getElementById('bookmarksGrid');
    
    if (filteredBookmarks.length === 0) {
        grid.innerHTML = '';
        showEmptyState(true);
        return;
    }
    
    showEmptyState(false);
    
    // Clear and render all bookmarks
    grid.innerHTML = '';
    filteredBookmarks.forEach(bookmark => {
        const card = createBookmarkCard(bookmark);
        grid.appendChild(card);
    });
}

function prependBookmark(bookmark) {
    const grid = document.getElementById('bookmarksGrid');
    
    // Check if we should show this bookmark based on current search
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm) {
        const matches = (
            (bookmark.url && bookmark.url.toLowerCase().includes(searchTerm)) ||
            (bookmark.description && bookmark.description.toLowerCase().includes(searchTerm))
        );
        if (!matches) {
            return; // Don't show this bookmark if it doesn't match search
        }
    }
    
    showEmptyState(false);
    
    const card = createBookmarkCard(bookmark, true);
    grid.insertBefore(card, grid.firstChild);
    
    // Trigger animation by removing the class after a brief moment
    setTimeout(() => {
        card.classList.remove('new-bookmark');
    }, 10);
}

function updateExistingBookmarks(newBookmarks) {
    // Update status or other fields that might have changed
    newBookmarks.forEach(bookmark => {
        const card = document.querySelector(`[data-id="${bookmark._id}"]`);
        if (card) {
            // Update timestamp if it changed
            const dateElement = card.querySelector('.bookmark-date');
            const newDate = formatDate(bookmark.created_at);
            if (dateElement && dateElement.textContent !== newDate) {
                dateElement.textContent = newDate;
            }
        }
    });
}

function updateBookmarkCount() {
    const count = filteredBookmarks.length;
    document.getElementById('bookmarkCount').textContent = count;
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    loadingState.style.display = show ? 'flex' : 'none';
}

function showEmptyState(show) {
    const emptyState = document.getElementById('emptyState');
    emptyState.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Search Functions
// ============================================
function searchBookmarks(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredBookmarks = bookmarks;
    } else {
        filteredBookmarks = bookmarks.filter(bookmark => {
            return (
                (bookmark.url && bookmark.url.toLowerCase().includes(searchTerm)) ||
                (bookmark.description && bookmark.description.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    renderBookmarks();
    updateBookmarkCount();
}

function applyCurrentSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchBookmarks(searchInput.value);
    } else {
        filteredBookmarks = bookmarks;
        updateBookmarkCount();
    }
}

// ============================================
// Modal Functions
// ============================================
function openDeleteModal(documentId) {
    deleteTargetId = documentId;
    const modal = document.getElementById('deleteModal');
    modal.classList.add('show');
}

function closeDeleteModal() {
    deleteTargetId = null;
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
}

async function confirmDelete() {
    if (deleteTargetId) {
        await deleteBookmark(deleteTargetId);
        closeDeleteModal();
    }
}

// ============================================
// Utility Functions
// ============================================
function openBookmarkUrl(url) {
    window.open(url, '_blank');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
        }
        return `${diffHours}h ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

function setUserInitials() {
    const initials = USER_ID.substring(0, 2).toUpperCase();
    document.getElementById('userInitials').textContent = initials;
}

// ============================================
// Event Listeners
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Set user initials
    setUserInitials();
    
    // Fetch bookmarks on load
    fetchBookmarks();
    
    // Add bookmark form submission
    const form = document.getElementById('addBookmarkForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = document.getElementById('urlInput').value.trim();
        const notes = document.getElementById('notesInput').value.trim();
        
        if (!url) {
            showToast('Please enter a URL', 'error');
            return;
        }
        
        try {
            await createBookmark(url, notes);
            form.reset();
        } catch (error) {
            // Error already handled in createBookmark
        }
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchBookmarks(e.target.value);
        }, 300);
    });
    
    // Close modal on backdrop click
    document.getElementById('deleteModal').addEventListener('click', (e) => {
        if (e.target.id === 'deleteModal') {
            closeDeleteModal();
        }
    });
    
    // Silently refresh bookmarks every 30 seconds to check for new bookmarks and status updates
    setInterval(() => {
        fetchBookmarks(true); // silent = true, no loading spinner
    }, 30000);
});

// Make functions globally accessible for onclick handlers
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.openBookmarkUrl = openBookmarkUrl;

