// sales.js - Sales management functions

// Dashboard functions
async function updateDashboard() {
    try {
        const fromDate = document.getElementById('dashFromDate').value;
        const toDate = document.getElementById('dashToDate').value;

        let params = '';
        if (fromDate) params += `fromDate=${fromDate}T00:00:00`;
        if (toDate) params += `${params ? '&' : ''}toDate=${toDate}T23:59:59`;

        if (currentUser.role === 'OWNER' && ownerSelectedOutlet !== 'All Outlets') {
            params += `${params ? '&' : ''}outlet=${encodeURIComponent(ownerSelectedOutlet)}`;
        }

        const statsResponse = await apiCall(`/sales/dashboard-stats?${params}`);
        if (statsResponse) {
            const stats = statsResponse;
            document.getElementById('totalSalesDisplay').textContent = formatCurrency(stats.totalSales);
            document.getElementById('totalExpensesDisplay').textContent = formatCurrency(stats.totalExpenses);
            document.getElementById('netProfitDisplay').textContent = formatCurrency(stats.netProfit);
            document.getElementById('totalTransactionsDisplay').textContent = stats.totalTransactions || 0;
        }

        // Load recent sales for dashboard
        const salesParams = params + `${params ? '&' : ''}`;
        const salesResponse = await apiCall(`/sales?${salesParams}`);
        if (salesResponse) {
            const recentSales = salesResponse.slice(0, 10);
            const tbody = document.querySelector('#dashboardSalesTable tbody');
            tbody.innerHTML = '';

            recentSales.forEach(sale => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${formatDate(sale.dateTime)}</td>
                    <td>${sale.salesRepName}</td>
                    <td>${sale.billNumber}</td>
                    <td>${formatCurrency(sale.amount)}</td>
                    <td>${sale.paymentType}</td>
                    <td><span class="outlet-indicator">${sale.outlet}</span></td>
                `;
            });
        }

    } catch (error) {
        console.error('Failed to update dashboard:', error);
        showAlert('Failed to update dashboard', 'error');
    }
}

// Sales entry functions
async function addSalesEntry(event) {
    event.preventDefault();

    // Validate form before submission
    if (!validateSalesForm()) {
        return;
    }

    try {
        const salesData = {
            salesRepUsername: document.getElementById('newSalesRep').value,
            dateTime: document.getElementById('newSalesDateTime').value,
            billNumber: document.getElementById('newBillNumber').value,
            amount: parseFloat(document.getElementById('newSalesAmount').value),
            paymentType: document.getElementById('newPaymentType').value
        };

        const response = await apiCall('/sales', 'POST', salesData);

        if (response && response.success) {
            clearSalesForm();
            showAlert('Sales entry added successfully!', 'success');
            await loadSalesData();
            await updateDashboard();
        }

    } catch (error) {
        console.error('Failed to add sales entry:', error);
        showAlert(error.message || 'Failed to add sales entry', 'error');
    }
}

// Clear sales form
function clearSalesForm() {
    document.getElementById('newSalesRep').value = '';
    document.getElementById('newSalesDateTime').value = '';
    document.getElementById('newBillNumber').value = '';
    document.getElementById('newSalesAmount').value = '';
    document.getElementById('newPaymentType').value = '';

    // Reset styling
    const inputs = ['newBillNumber', 'newSalesAmount'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.borderColor = '#e0e6ed';
            element.style.backgroundColor = 'white';
        }
    });
}

// Validate sales form
function validateSalesForm() {
    const billNumber = document.getElementById('newBillNumber').value;
    const amount = parseFloat(document.getElementById('newSalesAmount').value);

    if (!validateBillNumber(billNumber)) {
        showAlert('Bill number should contain only letters and numbers', 'error');
        return false;
    }

    if (!validateAmount(amount)) {
        showAlert('Amount should be between ₹1 and ₹10,00,000', 'error');
        return false;
    }

    return true;
}

// Load sales data
async function loadSalesData() {
    try {
        const fromDate = document.getElementById('salesFilterFromDate').value;
        const toDate = document.getElementById('salesFilterToDate').value;
        const salesRepFilter = document.getElementById('salesRepFilterSelect')?.value || '';
        const paymentTypeFilter = document.getElementById('paymentTypeFilterSelect')?.value || '';

        let params = [];
        if (fromDate) params.push(`fromDate=${fromDate}T00:00:00`);
        if (toDate) params.push(`toDate=${toDate}T23:59:59`);
        if (salesRepFilter) params.push(`salesRepUsername=${encodeURIComponent(salesRepFilter)}`);
        if (paymentTypeFilter) params.push(`paymentType=${paymentTypeFilter}`);

        if (currentUser.role === 'OWNER' && ownerSelectedOutlet !== 'All Outlets') {
            params.push(`outlet=${encodeURIComponent(ownerSelectedOutlet)}`);
        }

        const response = await apiCall(`/sales?${params.join('&')}`);

        if (response) {
            const sales = response;
            const tbody = document.querySelector('#salesRecordsTable tbody');
            tbody.innerHTML = '';

            sales.forEach(sale => {
                const row = tbody.insertRow();
                const createdByCell = currentUser.role === 'OWNER' ?
                    `<td class="audit-info">${sale.createdBy || 'Unknown'}</td>` : '';

                row.innerHTML = `
                    <td>${formatDateTime(sale.dateTime)}</td>
                    <td>${sale.salesRepName}</td>
                    <td>${sale.billNumber}</td>
                    <td>${formatCurrency(sale.amount)}</td>
                    <td>${sale.paymentType}</td>
                    <td><span class="outlet-indicator">${sale.outlet}</span></td>
                    ${createdByCell}
                `;
            });
        }

    } catch (error) {
        console.error('Failed to load sales data:', error);
        showAlert('Failed to load sales data', 'error');
    }
}

// Export sales data
async function exportSalesData() {
    try {
        const fromDate = document.getElementById('salesFilterFromDate').value;
        const toDate = document.getElementById('salesFilterToDate').value;
        const salesRepFilter = document.getElementById('salesRepFilterSelect')?.value || '';
        const paymentTypeFilter = document.getElementById('paymentTypeFilterSelect')?.value || '';

        let params = [];
        if (fromDate) params.push(`fromDate=${fromDate}T00:00:00`);
        if (toDate) params.push(`toDate=${toDate}T23:59:59`);
        if (salesRepFilter) params.push(`salesRepUsername=${encodeURIComponent(salesRepFilter)}`);
        if (paymentTypeFilter) params.push(`paymentType=${paymentTypeFilter}`);

        if (currentUser.role === 'OWNER' && ownerSelectedOutlet !== 'All Outlets') {
            params.push(`outlet=${encodeURIComponent(ownerSelectedOutlet)}`);
        }

        const response = await apiCall(`/sales?${params.join('&')}`);

        if (response) {
            const sales = response;

            // Create CSV content
            let csvContent = "Date,Sales Rep,Bill Number,Amount,Payment Type,Outlet\n";
            sales.forEach(sale => {
                csvContent += `${formatDate(sale.dateTime)},${sale.salesRepName},${sale.billNumber},${sale.amount},${sale.paymentType},${sale.outlet}\n`;
            });

            // Download CSV
            downloadCSV(csvContent, `sales_data_${new Date().toISOString().split('T')[0]}.csv`);
            showAlert('Sales data exported successfully!', 'success');
        }

    } catch (error) {
        console.error('Failed to export sales data:', error);
        showAlert('Failed to export sales data', 'error');
    }
}

// Enhanced form validation with real-time feedback
document.addEventListener('DOMContentLoaded', function() {
    // Bill number validation
    const billNumberInput = document.getElementById('newBillNumber');
    if (billNumberInput) {
        billNumberInput.addEventListener('input', function() {
            const billNumber = this.value;
            if (billNumber && !validateBillNumber(billNumber)) {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#fdf2f2';
            } else {
                this.style.borderColor = '#e0e6ed';
                this.style.backgroundColor = 'white';
            }
        });
    }

    // Amount validation
    const salesAmountInput = document.getElementById('newSalesAmount');
    if (salesAmountInput) {
        salesAmountInput.addEventListener('input', function() {
            const amount = parseFloat(this.value);
            if (amount && !validateAmount(amount)) {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#fdf2f2';
            } else {
                this.style.borderColor = '#e0e6ed';
                this.style.backgroundColor = 'white';
            }
        });
    }
});