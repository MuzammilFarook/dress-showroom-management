// app.js - Main application logic and initialization

// ===== UTILITY FUNCTIONS (Define first) =====

// Set default dates for all date inputs
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];

    // Dashboard dates
    const dashboardFromDate = document.getElementById('dashFromDate');
    const dashboardToDate = document.getElementById('dashToDate');
    if (dashboardFromDate) dashboardFromDate.value = today;
    if (dashboardToDate) dashboardToDate.value = today;

    // Sales filter dates
    const salesFromDate = document.getElementById('salesFilterFromDate');
    const salesToDate = document.getElementById('salesFilterToDate');
    if (salesFromDate) salesFromDate.value = today;
    if (salesToDate) salesToDate.value = today;

    // Expense filter dates
    const expenseFromDate = document.getElementById('expenseFilterFromDate');
    const expenseToDate = document.getElementById('expenseFilterToDate');
    const expenseDate = document.getElementById('newExpenseDate');
    if (expenseFromDate) expenseFromDate.value = firstDayOfMonth;
    if (expenseToDate) expenseToDate.value = today;
    if (expenseDate) expenseDate.value = today;

    // Salary dates
    const salaryFromDate = document.getElementById('salaryPeriodFromDate');
    const salaryToDate = document.getElementById('salaryPeriodToDate');
    if (salaryFromDate) salaryFromDate.value = today;
    if (salaryToDate) salaryToDate.value = today;

    // Sales entry datetime
    const salesDateTime = document.getElementById('newSalesDateTime');
    if (salesDateTime) salesDateTime.value = new Date().toISOString().slice(0, 16);
}

// Setup form validation
function setupFormValidation() {
    // Override form submission to include validation
    const salesForm = document.querySelector('#salesEntryForm form');
    if (salesForm) {
        salesForm.addEventListener('submit', function(event) {
            if (!validateSalesForm()) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }

    // Salary form validation
    const salaryForm = document.querySelector('#salaryContent form');
    if (salaryForm) {
        salaryForm.addEventListener('submit', function(event) {
            if (!validateSalaryForm()) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }
}

// Setup auto-generate bill number functionality
function setupBillNumberGeneration() {
    const billNumberInput = document.getElementById('newBillNumber');
    if (billNumberInput && !billNumberInput.nextElementSibling?.classList.contains('btn')) {
        const autoFillBtn = document.createElement('button');
        autoFillBtn.type = 'button';
        autoFillBtn.className = 'btn btn-sm';
        autoFillBtn.textContent = '🔄 Auto-generate';
        autoFillBtn.style.marginTop = '5px';
        autoFillBtn.onclick = function() {
            billNumberInput.value = generateBillNumber();
            // Trigger validation
            billNumberInput.dispatchEvent(new Event('input'));
        };
        billNumberInput.parentNode.appendChild(autoFillBtn);
    }
}

// Enhanced showTab function with authentication check
function showTab(tabName) {
    // Don't proceed if user is not authenticated
    if (!isAuthenticated() || !currentUser) {
        console.warn('Cannot show tab: User not authenticated');
        return;
    }

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab using new content IDs
    const contentMap = {
        'dashboard': 'dashboardContent',
        'sales': 'salesContent',
        'expenses': 'expensesContent',
        'users': 'usersContent',
        'salary': 'salaryContent'
    };

    const contentId = contentMap[tabName];
    const tabButtonId = 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1);

    if (contentId) {
        const contentElement = document.getElementById(contentId);
        const tabButton = document.getElementById(tabButtonId);

        if (contentElement) contentElement.classList.remove('hidden');
        if (tabButton) tabButton.classList.add('active');
    }

    // Load data for specific tabs (only if authenticated)
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'sales') {
        loadSalesData();
    } else if (tabName === 'expenses' && (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER')) {
        loadExpenseData();
    } else if (tabName === 'users' && currentUser.role === 'OWNER') {
        loadUserData();
    }
}

// Keyboard shortcuts handler
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only trigger shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        // Alt + 1-5 for tab navigation
        if (e.altKey && !e.ctrlKey && !e.shiftKey && currentUser) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    showTab('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    showTab('sales');
                    break;
                case '3':
                    e.preventDefault();
                    if (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') {
                        showTab('expenses');
                    }
                    break;
                case '4':
                    e.preventDefault();
                    if (currentUser.role === 'OWNER') {
                        showTab('users');
                    }
                    break;
                case '5':
                    e.preventDefault();
                    if (currentUser.role === 'OWNER') {
                        showTab('salary');
                    }
                    break;
            }
        }

        // Ctrl + S to save current form
        if (e.ctrlKey && e.key === 's' && currentUser) {
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
        if (e.ctrlKey && e.key === 'n' && currentUser) {
            e.preventDefault();
            const activeTab = document.querySelector('.nav-tab.active')?.id;
            if (activeTab === 'tabSales') {
                clearSalesForm();
            } else if (activeTab === 'tabExpenses') {
                clearExpenseForm();
            }
        }

        // F5 or Ctrl+R for refresh
        if ((e.key === 'F5' || (e.ctrlKey && e.key === 'r')) && currentUser) {
            e.preventDefault();
            refreshAllData();
        }

        // Escape key to clear forms
        if (e.key === 'Escape' && currentUser) {
            const activeTab = document.querySelector('.nav-tab.active')?.id;
            if (activeTab === 'tabSales') {
                clearSalesForm();
            } else if (activeTab === 'tabExpenses') {
                clearExpenseForm();
            } else if (activeTab === 'tabUsers') {
                clearUserForm();
            } else if (activeTab === 'tabSalary') {
                clearSalaryForm();
            }
        }
    });
}

// Data refresh functionality
async function refreshAllData() {
    if (!isAuthenticated() || !currentUser) {
        console.warn('Cannot refresh data: User not authenticated');
        return;
    }

    try {
        showLoadingOverlay('Refreshing all data...');

        const promises = [
            updateDashboard(),
            loadSalesData(),
            loadSalesRepDropdowns()
        ];

        if (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') {
            promises.push(loadExpenseData());
        }

        if (currentUser.role === 'OWNER') {
            promises.push(loadUserData());
        }

        await Promise.allSettled(promises);

        hideLoadingOverlay();
        showAlert('✅ Data refreshed successfully!', 'success');

    } catch (error) {
        console.error('Failed to refresh data:', error);
        hideLoadingOverlay();
        showAlert('❌ Failed to refresh some data', 'error');
    }
}

// ===== INITIALIZATION FUNCTIONS =====

// Initialize application
function initializeApplication() {
    console.log('🚀 Initializing Dress Showroom Management System...');

     // FIRST PRIORITY: Force hide loading overlay immediately
     forceHideLoadingOverlay();

     // Add body class to help with CSS hiding
     document.body.classList.add('loaded');
     document.documentElement.classList.add('loaded');

    // Set default dates first
    setDefaultDates();

    // Check for existing session FIRST
    checkExistingSession();

    // Only show login form if user is NOT authenticated
    if (!isAuthenticated()) {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('loginUsername').focus();
        // Extra safety: ensure loading is hidden when showing login
        setTimeout(() => forceHideLoadingOverlay(), 100);
    }

    // Initialize responsive design
    checkMobileView();

    // Set up form validation
    setupFormValidation();

    // Set up auto-generate bill number functionality
    setupBillNumberGeneration();

    // Set up keyboard shortcuts
    setupKeyboardShortcuts();

    // Final safety check after everything is loaded
    setTimeout(() => {
        forceHideLoadingOverlay();
        console.log('🔒 Final loading overlay safety check completed');
    }, 2000);

    console.log('✅ Dress Showroom Management System initialized successfully!');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
});

// ===== EVENT HANDLERS =====

// Handle page visibility change (for security)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('📱 Page hidden - implementing security measures');
    } else {
        console.log('👁️ Page visible again');
        if (isAuthenticated() && currentUser) {
            // Optionally refresh data when page becomes visible
        }
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    showAlert('🌐 Connection restored', 'success');
    console.log('✅ Back online');
});

window.addEventListener('offline', function() {
    showAlert('❌ Connection lost. Please check your internet connection.', 'error');
    console.log('❌ Gone offline');
});

// Enhanced error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    showAlert('An unexpected error occurred. Please try refreshing the page.', 'error');
    event.preventDefault();
});

// Performance monitoring
function logPerformanceMetrics() {
    if ('performance' in window && 'timing' in window.performance) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`⚡ Page load time: ${loadTime}ms`);
    }
}

// Log performance metrics after page load
window.addEventListener('load', function() {
    setTimeout(logPerformanceMetrics, 0);
});

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        console.log('🔧 Service Worker support detected');
        // Could register service worker for offline functionality
    });
}

// Auto-save functionality for forms (draft mode)
function setupAutoSave() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(function() {
                // Could save draft data to localStorage
                // saveFormDraft(form.id, getFormData(form));
            }, 1000));
        });
    });
}

// Helper function to get form data
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

// Initialize auto-save functionality
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupAutoSave, 2000); // Delay to ensure all elements are loaded
});

// Application health check
async function performHealthCheck() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/actuator/health`);
        if (response.ok) {
            console.log('✅ Application health check: OK');
            return true;
        } else {
            console.warn('⚠️ Application health check: Failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Health check error:', error);
        return false;
    }
}

// Periodic health check (only when authenticated)
setInterval(async function() {
    if (isAuthenticated()) {
        const isHealthy = await performHealthCheck();
        if (!isHealthy) {
            showAlert('⚠️ Server connection issues detected', 'error');
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Export functions for global access
window.showroomApp = {
    refreshAllData,
    performHealthCheck,
    generateBillNumber,
    formatCurrency,
    formatDate,
    formatDateTime,
    isAuthenticated,
    getCurrentUser,
    showTab,
    setDefaultDates,
    showLoadingOverlay,
    hideLoadingOverlay,
    forceHideLoadingOverlay
};

console.log('🎉 Dress Showroom Management System - Frontend loaded successfully!');