// utils.js - Utility functions for the application

// Configuration
const API_BASE_URL = (() => {
    const isLocal = window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:8080/api' : '/api';
})();

const OUTLETS = ['SKY_BLUE_WOMEN'];
let ownerSelectedOutlet = 'All Outlets';

// Utility function to make authenticated API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return null;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API call failed');
        }

        return result;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Show alert messages
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    // Insert at the top of the current tab content
    const activeTab = document.querySelector('.tab-content:not(.hidden)');
    if (activeTab) {
        activeTab.insertBefore(alertDiv, activeTab.firstChild);

        // Remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }
}

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Content').classList.remove('hidden');
    document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active');

    // Load data for specific tabs
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'sales') {
        loadSalesData();
    } else if (tabName === 'expenses') {
        loadExpenseData();
    } else if (tabName === 'users') {
        loadUserData();
    }
}

// Form clearing functions
function clearSalesForm() {
    document.getElementById('newSalesRep').value = '';
    document.getElementById('newSalesDateTime').value = new Date().toISOString().slice(0, 16);
    document.getElementById('newBillNumber').value = '';
    document.getElementById('newSalesAmount').value = '';
    document.getElementById('newPaymentType').value = '';
}

function clearExpenseForm() {
    document.getElementById('newExpenseType').value = '';
    document.getElementById('newExpenseAmount').value = '';
    document.getElementById('newExpenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('newExpenseDescription').value = '';
    document.getElementById('newAdvanceTo').value = '';
    handleExpenseTypeChange();
}

function clearUserForm() {
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserFullName').value = '';
    document.getElementById('newUserRole').value = '';
    document.getElementById('newUserOutlet').value = '';
}

function clearSalaryForm() {
    document.getElementById('salaryEmployeeSelect').value = '';
    document.getElementById('salaryIncentivePercentage').value = '';
    document.getElementById('salaryPeriodFromDate').value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('salaryPeriodToDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('salaryBaseSalary').value = '';
    document.getElementById('salaryStatementResult').classList.add('hidden');
}

// Handle expense type change
function handleExpenseTypeChange() {
    const expenseType = document.getElementById('newExpenseType').value;
    const advanceGroup = document.getElementById('advanceToGroup');

    if (expenseType === 'ADVANCE') {
        advanceGroup.classList.remove('hidden');
        document.getElementById('newAdvanceTo').required = true;
    } else {
        advanceGroup.classList.add('hidden');
        document.getElementById('newAdvanceTo').required = false;
        document.getElementById('newAdvanceTo').value = '';
    }
}

// Validation functions
function validateBillNumber(billNumber) {
    const regex = /^[A-Za-z0-9]+$/;
    return regex.test(billNumber);
}

function validateAmount(amount) {
    return amount > 0 && amount < 1000000; // Max 10 lakh
}

function validateDate(date) {
    const inputDate = new Date(date);
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return inputDate >= monthAgo && inputDate <= today;
}

// Auto-generate bill number
function generateBillNumber() {
    const today = new Date();
    const dateStr = today.getFullYear().toString().slice(-2) +
                   (today.getMonth() + 1).toString().padStart(2, '0') +
                   today.getDate().toString().padStart(2, '0');
    const timeStr = today.getHours().toString().padStart(2, '0') +
                   today.getMinutes().toString().padStart(2, '0');
    return `BILL${dateStr}${timeStr}`;
}

// Get dropdown placeholder text
function getDropdownPlaceholder(dropdownId) {
    const placeholders = {
        'newSalesRep': 'Select Sales Rep',
        'salesRepFilterSelect': 'All Sales Representatives',
        'newAdvanceTo': 'Select Sales Rep',
        'advanceToFilterSelect': 'All Employees',
        'salaryEmployeeSelect': 'Select Employee'
    };
    return placeholders[dropdownId] || 'Select Option';
}

// Get default password based on role
function getDefaultPassword(role) {
    const passwords = {
        'OWNER': 'admin123',
        'MANAGER': 'manager123',
        'SALES': 'sales123'
    };
    return passwords[role] || 'password123';
}

// Download CSV utility
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Format currency
function formatCurrency(amount) {
    return `₹${parseInt(amount || 0).toLocaleString()}`;
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Format datetime
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString();
}

// Loading state management
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"></div>';
    }
}

function hideLoading(elementId, content = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

// Enhanced error handling
function handleNetworkError(error) {
    if (error.message.includes('fetch')) {
        showAlert('Network error. Please check your connection and try again.', 'error');
    } else if (error.message.includes('401')) {
        showAlert('Session expired. Please login again.', 'error');
        setTimeout(() => logout(), 2000);
    } else {
        showAlert(error.message || 'An unexpected error occurred', 'error');
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add search functionality to tables
function addSearchToTable(tableId, searchFields) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search...';
    searchInput.className = 'form-control';
    searchInput.style.marginBottom = '10px';
    searchInput.style.maxWidth = '300px';

    table.parentNode.insertBefore(searchInput, table);

    const debouncedSearch = debounce(function(searchTerm) {
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }, 300);

    searchInput.addEventListener('input', function() {
        debouncedSearch(this.value);
    });
}

// Mobile responsiveness check
function checkMobileView() {
    const isMobile = window.innerWidth < 768;
    const navTabs = document.querySelector('.nav-tabs');

    if (isMobile && navTabs) {
        navTabs.style.flexDirection = 'column';
        document.querySelectorAll('.form-row').forEach(row => {
            row.style.gridTemplateColumns = '1fr';
        });
    } else if (navTabs) {
        navTabs.style.flexDirection = 'row';
        document.querySelectorAll('.form-row').forEach(row => {
            row.style.gridTemplateColumns = '1fr 1fr';
        });
    }
}

function showLoadingOverlay(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const loadingText = overlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }

        // Remove all hiding styles and classes
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';

        console.log('🔄 Loading overlay shown:', message);
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        // Apply multiple hiding methods for maximum compatibility
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        overlay.style.visibility = 'hidden';
        overlay.style.opacity = '0';

        console.log('✅ Loading overlay hidden');
    }
}

function forceHideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        // Nuclear option - multiple hiding approaches
        overlay.classList.add('hidden');
        overlay.style.display = 'none !important';
        overlay.style.visibility = 'hidden !important';
        overlay.style.opacity = '0 !important';
        overlay.style.zIndex = '-9999';
        overlay.style.pointerEvents = 'none';

        console.log('🔧 Loading overlay force hidden');
    }
}

// Enhanced API call with loading overlay
async function apiCallWithLoading(endpoint, method = 'GET', data = null, showLoading = false) {
    if (showLoading) {
        showLoadingOverlay('Connecting to server...');
    }

    try {
        const result = await apiCall(endpoint, method, data);
        return result;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    } finally {
        if (showLoading) {
            hideLoadingOverlay();
        }
    }
}

// Initialize responsive design
window.addEventListener('resize', checkMobileView);

// Make functions globally accessible
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.forceHideLoadingOverlay = forceHideLoadingOverlay;

// Auto-hide loading overlay on page load (safety net)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        forceHideLoadingOverlay();
        console.log('🔧 Auto-hide loading overlay on page load');
    }, 500);
});

// Also hide when window loads (backup safety net)
window.addEventListener('load', function() {
    setTimeout(() => {
        forceHideLoadingOverlay();
        console.log('🔧 Auto-hide loading overlay on window load');
    }, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + S to save current form
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const activeTab = document.querySelector('.nav-tab.active')?.id;
        if (activeTab === 'tabSales' && !document.getElementById('salesEntryForm').classList.contains('hidden')) {
            const form = document.querySelector('#salesEntryForm form');
            if (form) form.requestSubmit();
        } else if (activeTab === 'tabExpenses') {
            const form = document.querySelector('#expensesContent form');
            if (form) form.requestSubmit();
        }
    }

    // Ctrl + N for new entry
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const activeTab = document.querySelector('.nav-tab.active')?.id;
        if (activeTab === 'tabSales') {
            clearSalesForm();
        } else if (activeTab === 'tabExpenses') {
            clearExpenseForm();
        }
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showAlert('An unexpected error occurred. Please try again.', 'error');
});

// Initialize application utilities
document.addEventListener('DOMContentLoaded', function() {
    checkMobileView();

    // Add auto-generate bill number button
    const billNumberInput = document.getElementById('newBillNumber');
    if (billNumberInput) {
        const autoFillBtn = document.createElement('button');
        autoFillBtn.type = 'button';
        autoFillBtn.className = 'btn btn-sm';
        autoFillBtn.textContent = 'Auto-generate';
        autoFillBtn.style.marginTop = '5px';
        autoFillBtn.onclick = function() {
            billNumberInput.value = generateBillNumber();
        };
        billNumberInput.parentNode.appendChild(autoFillBtn);
    }

    // Initialize search for tables after a delay
    setTimeout(() => {
        addSearchToTable('salesRecordsTable', ['salesRepName', 'billNumber', 'paymentType']);
        addSearchToTable('expenseRecordsTable', ['type', 'description']);
        addSearchToTable('userManagementTable', ['username', 'fullName', 'role']);
    }, 1000);
});