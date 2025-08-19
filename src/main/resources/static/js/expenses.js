// expenses.js - Expense management functions

// Add expense entry
async function addExpense(event) {
    event.preventDefault();

    try {
        const expenseData = {
            // UPDATED: Use new form field IDs
            type: document.getElementById('newExpenseType').value,
            amount: parseFloat(document.getElementById('newExpenseAmount').value),
            date: document.getElementById('newExpenseDate').value,
            description: document.getElementById('newExpenseDescription').value,
            advanceToUsername: document.getElementById('newAdvanceTo').value || null
        };

        const response = await apiCall('/expenses', 'POST', expenseData);

        if (response && response.success) {
            clearExpenseForm();
            showAlert('Expense added successfully!', 'success');
            await loadExpenseData();
            await updateDashboard();
        }

    } catch (error) {
        console.error('Failed to add expense:', error);
        showAlert(error.message || 'Failed to add expense', 'error');
    }
}

// Load expense data
async function loadExpenseData() {
    try {
        // UPDATED: Use new filter field IDs
        const fromDate = document.getElementById('expenseFilterFromDate').value;
        const toDate = document.getElementById('expenseFilterToDate').value;
        const expenseTypeFilter = document.getElementById('expenseTypeFilterSelect')?.value || '';
        const advanceToFilter = document.getElementById('advanceToFilterSelect')?.value || '';

        let params = [];
        if (fromDate) params.push(`fromDate=${fromDate}`);
        if (toDate) params.push(`toDate=${toDate}`);
        if (expenseTypeFilter) params.push(`type=${expenseTypeFilter}`);
        if (advanceToFilter) params.push(`advanceToUsername=${encodeURIComponent(advanceToFilter)}`);

        if (currentUser.role === 'OWNER' && ownerSelectedOutlet !== 'All Outlets') {
            params.push(`outlet=${encodeURIComponent(ownerSelectedOutlet)}`);
        }

        const response = await apiCall(`/expenses?${params.join('&')}`);

        if (response) {
            const expenses = response;
            // UPDATED: Use new table ID
            const tbody = document.querySelector('#expenseRecordsTable tbody');
            tbody.innerHTML = '';

            expenses.forEach(expense => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${formatDate(expense.date)}</td>
                    <td>${expense.type.replace('_', ' ')}</td>
                    <td>${formatCurrency(expense.amount)}</td>
                    <td>${expense.description || ''}</td>
                    <td>${expense.advanceToName || '-'}</td>
                    <td><span class="outlet-indicator">${expense.outlet}</span></td>
                `;
            });
        }

    } catch (error) {
        console.error('Failed to load expense data:', error);
        showAlert('Failed to load expense data', 'error');
    }
}

// Export expense data
async function exportExpenseData() {
    try {
        // UPDATED: Use new filter field IDs
        const fromDate = document.getElementById('expenseFilterFromDate').value;
        const toDate = document.getElementById('expenseFilterToDate').value;
        const expenseTypeFilter = document.getElementById('expenseTypeFilterSelect')?.value || '';
        const advanceToFilter = document.getElementById('advanceToFilterSelect')?.value || '';

        let params = [];
        if (fromDate) params.push(`fromDate=${fromDate}`);
        if (toDate) params.push(`toDate=${toDate}`);
        if (expenseTypeFilter) params.push(`type=${expenseTypeFilter}`);
        if (advanceToFilter) params.push(`advanceToUsername=${encodeURIComponent(advanceToFilter)}`);

        if (currentUser.role === 'OWNER' && ownerSelectedOutlet !== 'All Outlets') {
            params.push(`outlet=${encodeURIComponent(ownerSelectedOutlet)}`);
        }

        const response = await apiCall(`/expenses?${params.join('&')}`);

        if (response) {
            const expenses = response;

            // Create CSV content
            let csvContent = "Date,Type,Amount,Description,Advance To,Outlet\n";
            expenses.forEach(expense => {
                csvContent += `${formatDate(expense.date)},${expense.type.replace('_', ' ')},${expense.amount},"${expense.description || ''}",${expense.advanceToName || '-'},${expense.outlet}\n`;
            });

            // Download CSV
            downloadCSV(csvContent, `expense_data_${new Date().toISOString().split('T')[0]}.csv`);
            showAlert('Expense data exported successfully!', 'success');
        }

    } catch (error) {
        console.error('Failed to export expense data:', error);
        showAlert('Failed to export expense data', 'error');
    }
}