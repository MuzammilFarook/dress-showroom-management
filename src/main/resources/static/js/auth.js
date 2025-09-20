// auth.js - Authentication functions
console.log('🚀 auth.js loaded');

let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Login function
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const loginButton = document.querySelector('#loginForm button[type="submit"]');

    errorDiv.classList.add('hidden');

    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password.';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Show spinner on login button and disable it
    const originalButtonText = loginButton.innerHTML;
    loginButton.innerHTML = '<span class="btn-spinner"></span>Logging in...';
    loginButton.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (!response.ok) {
            // Restore button state on error
            loginButton.innerHTML = originalButtonText;
            loginButton.disabled = false;

            errorDiv.textContent = result.message || 'Login failed';
            errorDiv.classList.remove('hidden');
            document.getElementById('loginPassword').value = '';
            return;
        }

        // Store auth token and user info
        authToken = result.token;
        currentUser = result.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Show main application
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        // Update UI with user info
        document.getElementById('currentUser').textContent = currentUser.fullName;
        document.getElementById('currentRole').textContent = currentUser.role.toUpperCase();
        document.getElementById('currentOutlet').textContent = currentUser.outlet;

        // Clear login form
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';

        // Setup UI and load data
        await setupUserInterface();

        showLoadingOverlay('Loading sales representatives...');
        await loadSalesRepDropdowns();

        showLoadingOverlay('Loading dashboard data...');
        // Show dashboard tab AFTER everything is set up
        showTab('dashboard');

        // Load initial data for other tabs if needed
        if (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') {
            showLoadingOverlay('Loading expense data...');
            await loadExpenseData();
        }
        if (currentUser.role === 'OWNER') {
            showLoadingOverlay('Loading user data...');
            await loadUserData();
        }

        // Hide loading overlay after everything is loaded
        hideLoadingOverlay();

        // Show success message
        showAlert(`Welcome back, ${currentUser.fullName}! 🎉`, 'success');

    } catch (error) {
        // Restore button state on error
        loginButton.innerHTML = originalButtonText;
        loginButton.disabled = false;

        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.classList.remove('hidden');
        console.error('Login error:', error);
    }
}

// Logout function
function logout() {
    // Clean up role restrictions before logout
    cleanupSalesRoleDateRestrictions();
    cleanupManagerRoleRestrictions();

    authToken = null;
    currentUser = null;
    ownerSelectedOutlet = 'All Outlets';
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');

    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');

    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').classList.add('hidden');

    // Reset login button to original state
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    if (loginButton) {
        loginButton.innerHTML = '🔐 Login';
        loginButton.disabled = false;
    }

    document.getElementById('loginUsername').focus();
}

// Check for existing session on page load
function checkExistingSession() {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');

    if (storedToken && storedUser) {
        console.log('🔍 Found existing session, restoring...');

        authToken = storedToken;
        currentUser = JSON.parse(storedUser);

        // Show loading while restoring session
        showLoadingOverlay('Restoring your session...');

        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        document.getElementById('currentUser').textContent = currentUser.fullName;
        document.getElementById('currentRole').textContent = currentUser.role.toUpperCase();
        document.getElementById('currentOutlet').textContent = currentUser.outlet;

        // Setup UI first, then show dashboard
        setupUserInterface().then(async () => {
            try {
                showLoadingOverlay('Loading sales representatives...');
                await loadSalesRepDropdowns();

                showLoadingOverlay('Loading dashboard...');
                showTab('dashboard');

                // Load other data
                if (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') {
                    showLoadingOverlay('Loading expense data...');
                    await loadExpenseData();
                }
                if (currentUser.role === 'OWNER') {
                    showLoadingOverlay('Loading user data...');
                    await loadUserData();
                }

                // Hide loading overlay after everything is loaded
                hideLoadingOverlay();

                console.log('✅ Session restored successfully');
                showAlert('Welcome back! Session restored successfully.', 'success');

            } catch (error) {
                console.error('❌ Error restoring session:', error);
                hideLoadingOverlay();
                showAlert('Error loading data. Please refresh the page.', 'error');
            }
        }).catch(error => {
            console.error('❌ Error setting up UI:', error);
            hideLoadingOverlay();
            // Fallback to login if session restore fails
            logout();
        });
    } else {
        // No existing session, make sure loading is hidden
        hideLoadingOverlay();
        console.log('👋 No existing session found');
    }
}

// Setup user interface based on role
async function setupUserInterface() {
    console.log('🔧 setupUserInterface called for role:', currentUser?.role);

    // Clean up any existing role restrictions first
    cleanupSalesRoleDateRestrictions();
    cleanupManagerRoleRestrictions();

    const role = currentUser.role;

    // UPDATED: Use new tab button IDs
    // Show/hide tabs based on role
    if (role === 'OWNER') {
        document.getElementById('tabSales').classList.remove('hidden');
        document.getElementById('tabExpenses').classList.remove('hidden');
        document.getElementById('tabUsers').classList.remove('hidden');
        document.getElementById('tabSalary').classList.remove('hidden');
        document.getElementById('salesEntryForm').classList.remove('hidden');
        document.getElementById('createdByHeader').classList.remove('hidden');
        document.getElementById('salesRepFilterRow').classList.remove('hidden');

        initOwnerOutletSelector();
    } else if (role === 'MANAGER') {
        document.getElementById('tabSales').classList.remove('hidden');
        document.getElementById('tabExpenses').classList.remove('hidden');
        document.getElementById('salesEntryForm').classList.remove('hidden');
        document.getElementById('tabUsers').classList.add('hidden');
        document.getElementById('tabSalary').classList.add('hidden');
        document.getElementById('createdByHeader').classList.add('hidden');
        document.getElementById('salesRepFilterRow').classList.remove('hidden');

        document.getElementById('ownerOutletSelectorHolder').classList.add('hidden');

        // Setup restrictions for MANAGER role
        setupManagerRoleRestrictions();
    } else {
        // Sales role - tabs remain hidden by default
        document.getElementById('tabSales').classList.add('hidden');
        document.getElementById('tabExpenses').classList.add('hidden');
        document.getElementById('tabUsers').classList.add('hidden');
        document.getElementById('tabSalary').classList.add('hidden');
        document.getElementById('salesEntryForm').classList.add('hidden');
        document.getElementById('createdByHeader').classList.add('hidden');
        document.getElementById('salesRepFilterRow').classList.add('hidden');

        document.getElementById('ownerOutletSelectorHolder').classList.add('hidden');

        // Setup date restrictions for SALES role
        console.log('🔒 About to setup SALES role date restrictions');
        setupSalesRoleDateRestrictions();
    }
}

// Global references to validation functions for cleanup
let salesValidationFunctions = null;

// Setup date restrictions for SALES role
function setupSalesRoleDateRestrictions() {
    console.log('🔒 setupSalesRoleDateRestrictions function called');

    const dashFromDate = document.getElementById('dashFromDate');
    const dashToDate = document.getElementById('dashToDate');

    console.log('📅 Date elements found:', !!dashFromDate, !!dashToDate);

    if (!dashFromDate || !dashToDate) {
        console.log('❌ Date elements not found, exiting');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Set max date for To date as today
    dashToDate.max = today;

    // Make To date non-editable for SALES role
    dashToDate.disabled = true;
    dashToDate.style.backgroundColor = '#f5f5f5';
    dashToDate.style.color = '#666';
    dashToDate.style.cursor = 'not-allowed';

    console.log('🔒 To date field disabled for SALES role');

    // Function to validate From date
    function validateFromDate() {
        const fromDateValue = dashFromDate.value;
        const toDateValue = dashToDate.value;

        if (!fromDateValue || !toDateValue) return;

        const fromDate = new Date(fromDateValue);
        const toDate = new Date(toDateValue);

        // Calculate 3 days before To date
        const minAllowedDate = new Date(toDate);
        minAllowedDate.setDate(minAllowedDate.getDate() - 3);

        // Check if From date is too old (more than 3 days before To date)
        if (fromDate < minAllowedDate) {
            const correctedDate = minAllowedDate.toISOString().split('T')[0];
            dashFromDate.value = correctedDate;
            alert('From date cannot be more than 3 days before To date.');
        }

        // Check if From date is after To date
        if (fromDate > toDate) {
            dashFromDate.value = toDateValue;
            alert('From date cannot be after To date.');
        }

        // Update min/max attributes
        const minAllowedDateStr = minAllowedDate.toISOString().split('T')[0];
        dashFromDate.min = minAllowedDateStr;
        dashFromDate.max = toDateValue;
    }

    // Function to validate To date
    function validateToDate() {
        const toDateValue = dashToDate.value;

        if (!toDateValue) return;

        // Check if To date is in the future
        if (toDateValue > today) {
            dashToDate.value = today;
            alert('To date cannot be in the future.');
        }

        // After correcting To date, validate From date
        validateFromDate();
    }

    // Store function references for cleanup
    salesValidationFunctions = {
        validateFromDate: validateFromDate,
        validateToDate: validateToDate
    };

    // Add event listeners
    dashFromDate.addEventListener('change', validateFromDate);
    dashFromDate.addEventListener('blur', validateFromDate);

    dashToDate.addEventListener('change', validateToDate);
    dashToDate.addEventListener('blur', validateToDate);

    // Initial validation
    setTimeout(validateFromDate, 100); // Delay to ensure defaults are set
}

// Clean up SALES role date restrictions
function cleanupSalesRoleDateRestrictions() {
    console.log('🧹 Attempting to clean up SALES role date restrictions');

    const dashFromDate = document.getElementById('dashFromDate');
    const dashToDate = document.getElementById('dashToDate');

    if (!dashFromDate || !dashToDate) {
        console.log('❌ Date elements not found during cleanup');
        return;
    }

    // More aggressive cleanup - clone elements to remove ALL event listeners
    const newFromDate = dashFromDate.cloneNode(true);
    const newToDate = dashToDate.cloneNode(true);

    dashFromDate.parentNode.replaceChild(newFromDate, dashFromDate);
    dashToDate.parentNode.replaceChild(newToDate, dashToDate);

    // Remove all date-related attributes and restore normal styling
    newFromDate.removeAttribute('min');
    newFromDate.removeAttribute('max');
    newToDate.removeAttribute('max');

    // Re-enable To date field and restore normal styling
    newToDate.disabled = false;
    newToDate.style.backgroundColor = '';
    newToDate.style.color = '';
    newToDate.style.cursor = '';

    // Clear function references
    salesValidationFunctions = null;

    console.log('✅ SALES role date restrictions cleaned up using element replacement');
}

// Setup restrictions for MANAGER role
function setupManagerRoleRestrictions() {
    console.log('🔒 Setting up MANAGER role restrictions');

    const salesDateTime = document.getElementById('newSalesDateTime');

    if (!salesDateTime) {
        console.log('❌ Sales datetime element not found');
        return;
    }

    // Set current datetime as default
    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    salesDateTime.value = currentDateTime;

    // Set max and min date to today (freezes date to today only)
    const today = now.toISOString().split('T')[0]; // Get just the date part
    salesDateTime.min = today + 'T00:00';
    salesDateTime.max = today + 'T23:59';

    // Add custom styling to indicate partial restriction
    salesDateTime.style.backgroundColor = '#f9f9f9';
    salesDateTime.title = 'Date is locked to today. You can only change the time.';

    // Add validation to prevent date changes
    salesDateTime.addEventListener('change', validateManagerDateTime);
    salesDateTime.addEventListener('input', validateManagerDateTime);

    function validateManagerDateTime() {
        const selectedDateTime = new Date(salesDateTime.value);
        const selectedDate = selectedDateTime.toISOString().split('T')[0];

        if (selectedDate !== today) {
            // Reset to today's date but keep the time
            const timepart = salesDateTime.value.split('T')[1] || '12:00';
            salesDateTime.value = today + 'T' + timepart;
            alert('Date is locked to today. You can only change the time.');
        }
    }

    console.log('🔒 Sales datetime date locked to today for MANAGER role (time editable)');
}

// Clean up MANAGER role restrictions
function cleanupManagerRoleRestrictions() {
    console.log('🧹 Cleaning up MANAGER role restrictions');

    const salesDateTime = document.getElementById('newSalesDateTime');

    if (!salesDateTime) {
        console.log('❌ Sales datetime element not found during cleanup');
        return;
    }

    // Clone element to remove all event listeners and restrictions
    const newSalesDateTime = salesDateTime.cloneNode(true);
    salesDateTime.parentNode.replaceChild(newSalesDateTime, salesDateTime);

    // Remove all restrictions and restore normal styling
    newSalesDateTime.removeAttribute('min');
    newSalesDateTime.removeAttribute('max');
    newSalesDateTime.style.backgroundColor = '';
    newSalesDateTime.style.color = '';
    newSalesDateTime.style.cursor = '';
    newSalesDateTime.title = '';

    console.log('✅ MANAGER role restrictions cleaned up');
}

// Initialize owner outlet selector
function initOwnerOutletSelector() {
    if (currentUser?.role !== 'OWNER') return;

    const holder = document.getElementById('ownerOutletSelectorHolder');
    const sel = document.getElementById('ownerOutletSelector');
    if (!holder || !sel) return;

    holder.classList.remove('hidden');

    sel.innerHTML = '';
    ['All Outlets', ...OUTLETS].forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        sel.appendChild(option);
    });

    sel.value = ownerSelectedOutlet;

    sel.onchange = async () => {
        ownerSelectedOutlet = sel.value;
        document.getElementById('currentOutlet').textContent = ownerSelectedOutlet;

        // Reload data with new outlet selection
        await loadSalesRepDropdowns();
        await updateDashboard();
        await loadSalesData();
        if (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') {
            await loadExpenseData();
        }
        if (currentUser.role === 'OWNER') {
            await loadUserData();
        }
    };
}

// Load sales representatives dropdown
async function loadSalesRepDropdowns() {
    try {
        const outlet = currentUser.role === 'OWNER' ? ownerSelectedOutlet : currentUser.outlet;
        const response = await apiCall(`/users/sales-reps?outlet=${encodeURIComponent(outlet)}`);

        if (!response) return;

        const salesReps = response;

        // UPDATED: Use new dropdown IDs that match the HTML
        const dropdownMappings = {
            // Sales form dropdown
            'newSalesRep': 'Select Sales Rep',
            // Sales filter dropdown
            'salesRepFilterSelect': 'All Sales Representatives',
            // Expense form dropdown
            'newAdvanceTo': 'Select Sales Rep',
            // Expense filter dropdown
            'advanceToFilterSelect': 'All Employees',
            // Salary form dropdown
            'salaryEmployeeSelect': 'Select Employee'
        };

        Object.keys(dropdownMappings).forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                const currentValue = dropdown.value;
                const placeholder = dropdownMappings[dropdownId];
                dropdown.innerHTML = `<option value="">${placeholder}</option>`;

                salesReps.forEach(rep => {
                    dropdown.innerHTML += `<option value="${rep.username}">${rep.fullName} (${rep.outlet})</option>`;
                });

                // Restore previous selection if still valid
                if (currentValue && salesReps.find(rep => rep.username === currentValue)) {
                    dropdown.value = currentValue;
                }
            }
        });

    } catch (error) {
        console.error('Failed to load sales representatives:', error);
        showAlert('Failed to load sales representatives', 'error');
    }
}