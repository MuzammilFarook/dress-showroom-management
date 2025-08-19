// users.js - User management functions

// Add user function
async function addUser(event) {
    event.preventDefault();

    try {
        const userData = {
            // UPDATED: Use new form field IDs
            username: document.getElementById('newUserUsername').value.trim(),
            fullName: document.getElementById('newUserFullName').value.trim(),
            role: document.getElementById('newUserRole').value,
            outlet: document.getElementById('newUserOutlet').value
        };

        const response = await apiCall('/users', 'POST', userData);

        if (response && response.success) {
            clearUserForm();
            showAlert(`User added successfully! Default password: ${getDefaultPassword(userData.role)}`, 'success');
            await loadUserData();
            await loadSalesRepDropdowns();
        }

    } catch (error) {
        console.error('Failed to add user:', error);
        showAlert(error.message || 'Failed to add user', 'error');
    }
}

// Load user data
async function loadUserData() {
    try {
        const response = await apiCall('/users');

        if (response) {
            const users = response;
            // UPDATED: Use new table ID
            const tbody = document.querySelector('#userManagementTable tbody');
            tbody.innerHTML = '';

            users.forEach(user => {
                const row = tbody.insertRow();
                const defaultPassword = getDefaultPassword(user.role);

                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.fullName}</td>
                    <td><span class="outlet-indicator">${user.role.toUpperCase()}</span></td>
                    <td><span class="outlet-indicator">${user.outlet}</span></td>
                    <td>
                        ${user.username !== 'admin' ?
                            `<button class="btn btn-danger btn-sm" onclick="removeUser(${user.id})" style="margin-right: 5px;">🗑️ Remove</button>
                             <small style="color: #666;">Default pwd: ${defaultPassword}</small>` :
                            '<span style="color: #28a745; font-weight: 600;">🔒 Protected</span>'
                        }
                    </td>
                `;
            });
        }

    } catch (error) {
        console.error('Failed to load user data:', error);
        showAlert('Failed to load user data', 'error');
    }
}

// Remove user function
async function removeUser(userId) {
    if (confirm('⚠️ Are you sure you want to remove this user?')) {
        try {
            const response = await apiCall(`/users/${userId}`, 'DELETE');

            if (response && response.success) {
                await loadUserData();
                await loadSalesRepDropdowns();
                showAlert('User removed successfully!', 'success');
            }

        } catch (error) {
            console.error('Failed to remove user:', error);
            showAlert(error.message || 'Failed to remove user', 'error');
        }
    }
}

// Enhanced user form validation
document.addEventListener('DOMContentLoaded', function() {
    // Username validation
    const usernameInput = document.getElementById('newUserUsername');
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            const username = this.value;
            const pattern = /^[a-zA-Z0-9_]+$/;

            if (username && !pattern.test(username)) {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#fdf2f2';
            } else {
                this.style.borderColor = '#e0e6ed';
                this.style.backgroundColor = 'white';
            }
        });
    }

    // Full name validation
    const fullNameInput = document.getElementById('newUserFullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('input', function() {
            const fullName = this.value.trim();

            if (fullName && fullName.length < 2) {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#fdf2f2';
            } else {
                this.style.borderColor = '#e0e6ed';
                this.style.backgroundColor = 'white';
            }
        });
    }
});

// === ADDITIONAL MISSING FUNCTION ===

// Clear expense form function (updated for new IDs)
function clearExpenseForm() {
    // UPDATED: Use new form field IDs
    document.getElementById('newExpenseType').value = '';
    document.getElementById('newExpenseAmount').value = '';
    document.getElementById('newExpenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('newExpenseDescription').value = '';
    document.getElementById('newAdvanceTo').value = '';

    // Reset styling
    const inputs = ['newExpenseAmount'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.borderColor = '#e0e6ed';
            element.style.backgroundColor = 'white';
        }
    });

    // Reset advance section visibility
    handleExpenseTypeChange();
}

// Enhanced loading overlay management
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Enhanced API call with loading overlay
async function apiCallWithLoading(endpoint, method = 'GET', data = null) {
    showLoadingOverlay();
    try {
        const result = await apiCall(endpoint, method, data);
        return result;
    } finally {
        hideLoadingOverlay();
    }
}

// Performance optimization: Batch API calls
async function refreshAllDataOptimized() {
    if (!isAuthenticated() || !currentUser) return;

    try {
        showLoadingOverlay();
        showAlert('🔄 Refreshing all data...', 'success');

        // Batch API calls for better performance
        const promises = [];

        // Always refresh basic data
        promises.push(updateDashboard());
        promises.push(loadSalesData());
        promises.push(loadSalesRepDropdowns());

        // Role-based data loading
        if (currentUser.role === 'OWNER' || currentUser.role === 'MANAGER') {
            promises.push(loadExpenseData());
        }

        if (currentUser.role === 'OWNER') {
            promises.push(loadUserData());
        }

        // Wait for all promises to complete
        await Promise.allSettled(promises);

        showAlert('✅ All data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Failed to refresh data:', error);
        showAlert('❌ Failed to refresh some data', 'error');
    } finally {
        hideLoadingOverlay();
    }
}