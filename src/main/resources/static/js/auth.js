// auth.js - Authentication functions

let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Login function
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.add('hidden');

    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password.';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Show loading overlay during login
    showLoadingOverlay('Logging in...');

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
            hideLoadingOverlay(); // Hide loading on error
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

        // Update loading message
        showLoadingOverlay('Setting up your dashboard...');

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
        hideLoadingOverlay(); // Make sure to hide on error
        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.classList.remove('hidden');
        console.error('Login error:', error);
    }
}

// Logout function
function logout() {
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
    const role = currentUser.role;

    // UPDATED: Use new tab button IDs
    // Show/hide tabs based on role
    if (role === 'OWNER') {
        document.getElementById('tabExpenses').classList.remove('hidden');
        document.getElementById('tabUsers').classList.remove('hidden');
        document.getElementById('tabSalary').classList.remove('hidden');
        document.getElementById('salesEntryForm').classList.remove('hidden');
        document.getElementById('createdByHeader').classList.remove('hidden');
        document.getElementById('salesRepFilterRow').classList.remove('hidden');

        initOwnerOutletSelector();
    } else if (role === 'MANAGER') {
        document.getElementById('tabExpenses').classList.remove('hidden');
        document.getElementById('salesEntryForm').classList.remove('hidden');
        document.getElementById('tabUsers').classList.add('hidden');
        document.getElementById('tabSalary').classList.add('hidden');
        document.getElementById('createdByHeader').classList.add('hidden');
        document.getElementById('salesRepFilterRow').classList.remove('hidden');

        document.getElementById('ownerOutletSelectorHolder').classList.add('hidden');
    } else {
        // Sales role
        document.getElementById('tabExpenses').classList.add('hidden');
        document.getElementById('tabUsers').classList.add('hidden');
        document.getElementById('tabSalary').classList.add('hidden');
        document.getElementById('salesEntryForm').classList.add('hidden');
        document.getElementById('createdByHeader').classList.add('hidden');
        document.getElementById('salesRepFilterRow').classList.add('hidden');

        document.getElementById('ownerOutletSelectorHolder').classList.add('hidden');
    }
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