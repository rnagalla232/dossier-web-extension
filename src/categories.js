// ============================================
// Configuration
// ============================================
const API_BASE_URL = 'http://localhost:8000';
const USER_ID = 'user123'; // In a real app, this would come from authentication

// ============================================
// State Management
// ============================================
let categories = [];
let currentCategoryId = null;
let editingCategoryId = null;
let deleteCategoryId = null;
let isInitialLoad = true;

// Pagination
let currentPage = 1;
let itemsPerPage = calculateItemsPerPage();

function calculateItemsPerPage() {
    // Fixed page size for consistent experience
    return 3;
}

// ============================================
// API Functions - Categories
// ============================================
async function fetchCategories(silent = false) {
    try {
        if (!silent && isInitialLoad) {
            showLoading(true);
        }
        
        const response = await fetch(`${API_BASE_URL}/categories?user_id=${USER_ID}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        const newCategories = await response.json();
        
        if (isInitialLoad) {
            categories = newCategories;
            renderCategories();
            showLoading(false);
            isInitialLoad = false;
        } else {
            updateCategoriesSmoothly(newCategories);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        showLoading(false);
        if (!silent) {
            showToast('Failed to load collections. Please check if the backend is running.', 'error');
            showEmptyState(true);
        }
    }
}

async function createCategory(name, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: USER_ID,
                name: name,
                description: description || null,
            }),
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('A collection with this name already exists');
            }
            throw new Error('Failed to create collection');
        }
        
        showToast('Collection created successfully!', 'success');
        await fetchCategories(true);
    } catch (error) {
        console.error('Error creating category:', error);
        showToast(error.message || 'Failed to create collection. Please try again.', 'error');
        throw error;
    }
}

async function updateCategory(categoryId, name, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}?user_id=${USER_ID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name || undefined,
                description: description !== undefined ? description : undefined,
            }),
        });
        
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('A collection with this name already exists');
            }
            throw new Error('Failed to update collection');
        }
        
        showToast('Collection updated successfully!', 'success');
        await fetchCategories(true);
    } catch (error) {
        console.error('Error updating category:', error);
        showToast(error.message || 'Failed to update collection. Please try again.', 'error');
        throw error;
    }
}

async function deleteCategory(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}?user_id=${USER_ID}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete collection');
        }
        
        showToast('Collection deleted successfully!', 'success');
        await fetchCategories(true);
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Failed to delete collection. Please try again.', 'error');
        throw error;
    }
}

async function getCategorySummary(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/summary?user_id=${USER_ID}&doc_limit=10`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch category summary');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching category summary:', error);
        showToast('Failed to load category details.', 'error');
        throw error;
    }
}

async function addBookmarksToCategory(categoryId, documentIds) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/documents?user_id=${USER_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                document_ids: documentIds,
            }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to add bookmarks to collection');
        }
        
        showToast('Bookmarks added to collection!', 'success');
        await fetchCategories(true);
        // Refresh the current category details if open
        if (currentCategoryId) {
            await openCategoryDetails(currentCategoryId);
        }
    } catch (error) {
        console.error('Error adding bookmarks to category:', error);
        showToast('Failed to add bookmarks. Please try again.', 'error');
        throw error;
    }
}

async function getAllBookmarks() {
    try {
        const response = await fetch(`${API_BASE_URL}/documents?user_id=${USER_ID}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch bookmarks');
        }
        
        const allBookmarks = await response.json();
        return allBookmarks.filter(b => b.processing_status !== 'FAILED');
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        showToast('Failed to load bookmarks.', 'error');
        return [];
    }
}

// ============================================
// UI Rendering Functions
// ============================================
function createCategoryCard(category, isNew = false) {
    const card = document.createElement('div');
    card.className = `category-card ${isNew ? 'new-category' : ''}`;
    card.setAttribute('data-id', category._id);
    
    const bookmarkCount = category.document_ids ? category.document_ids.length : 0;
    const truncatedDescription = category.description 
        ? (category.description.length > 100 
            ? category.description.substring(0, 100) + '...' 
            : category.description)
        : 'No description';
    
    card.innerHTML = `
        <div class="category-card-header">
            <div class="category-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="category-actions">
                <button class="action-btn" onclick="openEditCategoryModal('${category._id}', event)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="openDeleteCategoryModal('${category._id}', event)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="category-card-body" onclick="openCategoryDetails('${category._id}')">
            <h3 class="category-name" title="${escapeHtml(category.name)}">${escapeHtml(category.name)}</h3>
            <p class="category-description" title="${escapeHtml(category.description || 'No description')}">${escapeHtml(truncatedDescription)}</p>
            <div class="category-card-footer">
                <div class="category-stat">
                    <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${bookmarkCount} ${bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}</span>
                </div>
                <span class="category-date">${formatDate(category.created_at)}</span>
            </div>
        </div>
    `;
    
    return card;
}

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    const section = document.getElementById('categoriesSection');
    
    if (categories.length === 0) {
        grid.innerHTML = '';
        section.style.display = 'none';
        showEmptyState(true);
        hideCategoryPagination();
        return;
    }
    
    showEmptyState(false);
    section.style.display = 'block';
    
    // Calculate pagination
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages); // Adjust if needed
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageCategories = categories.slice(startIdx, endIdx);
    
    // Render current page
    grid.innerHTML = '';
    pageCategories.forEach(category => {
        const card = createCategoryCard(category);
        grid.appendChild(card);
    });
    
    // Update pagination controls
    renderCategoryPagination(totalPages);
}

function renderCategoryPagination(totalPages) {
    const paginationContainer = document.getElementById('categoryPagination');
    
    if (totalPages <= 1) {
        hideCategoryPagination();
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Create dot-based pagination
    let dotsHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        dotsHTML += `
            <button 
                class="pagination-dot ${isActive ? 'active' : ''}" 
                onclick="goToCategoryPage(${i})"
                aria-label="Go to page ${i}"
                title="Page ${i}">
            </button>
        `;
    }
    
    paginationContainer.innerHTML = `
        <div class="pagination-dots-container">
            ${dotsHTML}
        </div>
    `;
}

function hideCategoryPagination() {
    const paginationContainer = document.getElementById('categoryPagination');
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

function goToCategoryPage(page) {
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderCategories();
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prependCategory(category) {
    const grid = document.getElementById('categoriesGrid');
    const section = document.getElementById('categoriesSection');
    
    showEmptyState(false);
    section.style.display = 'block';
    
    const card = createCategoryCard(category, true);
    grid.insertBefore(card, grid.firstChild);
    
    setTimeout(() => {
        card.classList.remove('new-category');
    }, 10);
}

function updateCategoriesSmoothly(newCategories) {
    const existingIds = new Set(categories.map(c => c._id));
    const addedCategories = newCategories.filter(c => !existingIds.has(c._id));
    
    const newIds = new Set(newCategories.map(c => c._id));
    const removedCategories = categories.filter(c => !newIds.has(c._id));
    
    categories = newCategories;
    
    // Remove deleted categories
    removedCategories.forEach(category => {
        const card = document.querySelector(`.category-card[data-id="${category._id}"]`);
        if (card) {
            card.classList.add('removing');
            setTimeout(() => {
                card.remove();
                if (categories.length === 0) {
                    showEmptyState(true);
                    document.getElementById('categoriesSection').style.display = 'none';
                }
            }, 300);
        }
    });
    
    // Add new categories
    if (addedCategories.length > 0) {
        addedCategories.reverse().forEach(category => {
            prependCategory(category);
        });
    }
    
    // Update existing categories
    updateExistingCategories(newCategories);
}

function updateExistingCategories(newCategories) {
    newCategories.forEach(category => {
        const card = document.querySelector(`.category-card[data-id="${category._id}"]`);
        if (card) {
            // Update category name
            const nameElement = card.querySelector('.category-name');
            if (nameElement && nameElement.textContent !== category.name) {
                nameElement.textContent = category.name;
            }
            
            // Update category description
            const descElement = card.querySelector('.category-description');
            if (descElement) {
                const truncatedDescription = category.description 
                    ? (category.description.length > 100 
                        ? category.description.substring(0, 100) + '...' 
                        : category.description)
                    : 'No description';
                descElement.textContent = truncatedDescription;
            }
            
            // Update bookmark count
            const bookmarkCount = category.document_ids ? category.document_ids.length : 0;
            const statElement = card.querySelector('.category-stat span');
            if (statElement) {
                statElement.textContent = `${bookmarkCount} ${bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}`;
            }
        }
    });
}

// ============================================
// Modal Functions
// ============================================
function openCreateCategoryModal() {
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = 'New Collection';
    document.getElementById('categoryModalBtn').textContent = 'Create';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    document.getElementById('categoryModal').classList.add('show');
    document.getElementById('categoryName').focus();
}

async function openEditCategoryModal(categoryId, event) {
    if (event) {
        event.stopPropagation();
    }
    editingCategoryId = categoryId;
    const category = categories.find(c => c._id === categoryId);
    
    if (!category) return;
    
    document.getElementById('categoryModalTitle').textContent = 'Edit Collection';
    document.getElementById('categoryModalBtn').textContent = 'Save';
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryModal').classList.add('show');
    document.getElementById('categoryName').focus();
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('show');
    editingCategoryId = null;
}

async function openCategoryDetails(categoryId) {
    currentCategoryId = categoryId;
    
    try {
        const summary = await getCategorySummary(categoryId);
        
        if (!summary) return;
        
        console.log('Category summary:', summary); // Debug log
        
        const category = summary.category;
        const representativeDocuments = summary.representative_documents || [];
        const totalDocs = summary.total_documents || 0;
        const categoryNews = summary.category_news || category.description || 'No description';
        
        document.getElementById('detailsCategoryName').textContent = category.name;
        document.getElementById('detailsCategoryDescription').textContent = categoryNews;
        document.getElementById('detailsBookmarkCount').textContent = `${totalDocs} ${totalDocs === 1 ? 'bookmark' : 'bookmarks'}`;
        
        const bookmarksContainer = document.getElementById('categoryBookmarks');
        
        // If we have document IDs but no representative documents in the response, fetch them manually
        if (representativeDocuments.length === 0 && category.document_ids && category.document_ids.length > 0) {
            // Fetch documents using the category documents endpoint
            const categoryDocs = await getCategoryDocuments(categoryId);
            if (categoryDocs && categoryDocs.length > 0) {
                renderCategoryBookmarks(bookmarksContainer, categoryDocs);
            } else {
                bookmarksContainer.innerHTML = `
                    <div class="empty-bookmarks">
                        <p>No bookmarks in this collection yet</p>
                    </div>
                `;
            }
        } else if (representativeDocuments.length === 0) {
            bookmarksContainer.innerHTML = `
                <div class="empty-bookmarks">
                    <p>No bookmarks in this collection yet</p>
                </div>
            `;
        } else {
            renderCategoryBookmarks(bookmarksContainer, representativeDocuments);
        }
        
        document.getElementById('categoryDetailsModal').classList.add('show');
    } catch (error) {
        console.error('Error opening category details:', error);
        showToast('Failed to load category details', 'error');
    }
}

async function getCategoryDocuments(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/documents?user_id=${USER_ID}&limit=10`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch category documents');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching category documents:', error);
        return [];
    }
}

function renderCategoryBookmarks(container, documents) {
    container.innerHTML = documents.map(doc => {
        let domain = '';
        try {
            const url = new URL(doc.url);
            domain = url.hostname.replace('www.', '');
        } catch (e) {
            domain = doc.url;
        }
        
        // Use description if available, otherwise use summary
        const noteContent = doc.description || doc.summary;
        
        return `
            <div class="detail-bookmark-item">
                <div class="detail-bookmark-header">
                    <span class="detail-bookmark-domain" title="${escapeHtml(domain)}">${escapeHtml(domain)}</span>
                    <a href="${escapeHtml(doc.url)}" target="_blank" class="detail-bookmark-link" title="Open ${escapeHtml(doc.url)}">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                </div>
                <div class="detail-bookmark-url" title="${escapeHtml(doc.url)}">${escapeHtml(doc.url)}</div>
                ${noteContent ? `<div class="detail-bookmark-notes" title="${escapeHtml(noteContent)}">${escapeHtml(noteContent)}</div>` : ''}
            </div>
        `;
    }).join('');
}

function closeCategoryDetailsModal() {
    document.getElementById('categoryDetailsModal').classList.remove('show');
    currentCategoryId = null;
}

function editCurrentCategory() {
    if (currentCategoryId) {
        closeCategoryDetailsModal();
        setTimeout(() => {
            openEditCategoryModal(currentCategoryId);
        }, 100);
    }
}

async function openAddBookmarksModal() {
    if (!currentCategoryId) return;
    
    const allBookmarks = await getAllBookmarks();
    const category = await getCategorySummary(currentCategoryId);
    const categoryDocIds = new Set(category.category.document_ids || []);
    
    // Filter out bookmarks already in this category
    const availableBookmarks = allBookmarks.filter(b => !categoryDocIds.has(b._id));
    
    if (availableBookmarks.length === 0) {
        showToast('All bookmarks are already in this collection!', 'error');
        return;
    }
    
    const bookmarksContainer = document.getElementById('addBookmarksList');
    bookmarksContainer.innerHTML = availableBookmarks.map(doc => {
        let domain = '';
        try {
            const url = new URL(doc.url);
            domain = url.hostname.replace('www.', '');
        } catch (e) {
            domain = doc.url;
        }
        
        // Use description if available, otherwise use summary
        const noteContent = doc.description || doc.summary;
        
        return `
            <label class="bookmark-checkbox-item" title="${escapeHtml(doc.url)}">
                <input type="checkbox" value="${doc._id}" class="bookmark-checkbox">
                <div class="bookmark-checkbox-content">
                    <div class="bookmark-checkbox-domain" title="${escapeHtml(domain)}">${escapeHtml(domain)}</div>
                    <div class="bookmark-checkbox-url" title="${escapeHtml(doc.url)}">${escapeHtml(doc.url)}</div>
                    ${noteContent ? `<div class="bookmark-checkbox-notes" title="${escapeHtml(noteContent)}">${escapeHtml(noteContent)}</div>` : ''}
                </div>
            </label>
        `;
    }).join('');
    
    document.getElementById('addBookmarksModal').classList.add('show');
}

function closeAddBookmarksModal() {
    document.getElementById('addBookmarksModal').classList.remove('show');
}

async function confirmAddBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
        showToast('Please select at least one bookmark', 'error');
        return;
    }
    
    await addBookmarksToCategory(currentCategoryId, selectedIds);
    closeAddBookmarksModal();
}

function openDeleteCategoryModal(categoryId, event) {
    if (event) {
        event.stopPropagation();
    }
    deleteCategoryId = categoryId;
    document.getElementById('deleteCategoryModal').classList.add('show');
}

function closeDeleteCategoryModal() {
    document.getElementById('deleteCategoryModal').classList.remove('show');
    deleteCategoryId = null;
}

async function confirmDeleteCategory() {
    if (deleteCategoryId) {
        await deleteCategory(deleteCategoryId);
        closeDeleteCategoryModal();
    }
}

// ============================================
// UI Helper Functions
// ============================================
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
// Utility Functions
// ============================================
function escapeHtml(text) {
    if (!text) return '';
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
    setUserInitials();
    fetchCategories();
    
    // Category form submission
    const form = document.getElementById('categoryForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value.trim();
        const description = document.getElementById('categoryDescription').value.trim();
        
        if (!name) {
            showToast('Please enter a collection name', 'error');
            return;
        }
        
        try {
            if (editingCategoryId) {
                await updateCategory(editingCategoryId, name, description);
            } else {
                await createCategory(name, description);
            }
            closeCategoryModal();
        } catch (error) {
            // Error already handled in create/update functions
        }
    });
    
    // Close modals on backdrop click
    document.getElementById('categoryModal').addEventListener('click', (e) => {
        if (e.target.id === 'categoryModal') {
            closeCategoryModal();
        }
    });
    
    document.getElementById('categoryDetailsModal').addEventListener('click', (e) => {
        if (e.target.id === 'categoryDetailsModal') {
            closeCategoryDetailsModal();
        }
    });
    
    document.getElementById('deleteCategoryModal').addEventListener('click', (e) => {
        if (e.target.id === 'deleteCategoryModal') {
            closeDeleteCategoryModal();
        }
    });
    
    document.getElementById('addBookmarksModal').addEventListener('click', (e) => {
        if (e.target.id === 'addBookmarksModal') {
            closeAddBookmarksModal();
        }
    });
    
    // Silent refresh every 10 seconds for smoother updates
    setInterval(() => {
        fetchCategories(true);
    }, 10000); // 10 seconds for streaming updates
    
    // No need for resize handler with fixed page size
});

// Make functions globally accessible
window.openCreateCategoryModal = openCreateCategoryModal;
window.openEditCategoryModal = openEditCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.openCategoryDetails = openCategoryDetails;
window.closeCategoryDetailsModal = closeCategoryDetailsModal;
window.editCurrentCategory = editCurrentCategory;
window.openAddBookmarksModal = openAddBookmarksModal;
window.closeAddBookmarksModal = closeAddBookmarksModal;
window.confirmAddBookmarks = confirmAddBookmarks;
window.openDeleteCategoryModal = openDeleteCategoryModal;
window.closeDeleteCategoryModal = closeDeleteCategoryModal;
window.confirmDeleteCategory = confirmDeleteCategory;
window.goToCategoryPage = goToCategoryPage;

