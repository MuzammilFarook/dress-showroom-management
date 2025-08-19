// salary.js - Salary management functions

// Generate salary statement
async function generateSalaryStatement(event) {
    event.preventDefault();

    try {
        const formData = {
            // UPDATED: Use new form field IDs
            employeeUsername: document.getElementById('salaryEmployeeSelect').value,
            incentivePercentage: parseFloat(document.getElementById('salaryIncentivePercentage').value),
            fromDate: document.getElementById('salaryPeriodFromDate').value,
            toDate: document.getElementById('salaryPeriodToDate').value,
            baseSalary: parseFloat(document.getElementById('salaryBaseSalary').value)
        };

        const params = new URLSearchParams(formData).toString();
        const response = await apiCall(`/salary/statement?${params}`, 'POST');

        if (response && response.success) {
            const statement = response.data;
            displaySalaryStatement(statement);
        }

    } catch (error) {
        console.error('Failed to generate salary statement:', error);
        showAlert(error.message || 'Failed to generate salary statement', 'error');
    }
}

// Display salary statement
function displaySalaryStatement(statement) {
    const statementHTML = `
        <div class="salary-statement">
            <div class="salary-header">
                <h2>Salary Statement</h2>
                <p><strong>Employee:</strong> ${statement.employeeName}</p>
                <p><strong>Employee ID:</strong> ${statement.employeeUsername}</p>
                <p><strong>Period:</strong> ${formatDate(statement.fromDate)} - ${formatDate(statement.toDate)}</p>
                <p><strong>Outlet:</strong> ${statement.outlet}</p>
                <p><strong>Generated On:</strong> ${formatDate(new Date().toISOString())}</p>
            </div>

            <div class="salary-details">
                <div>
                    <h4>Earnings</h4>
                    <p><strong>Base Salary:</strong> ${formatCurrency(statement.baseSalary)}</p>
                    <p><strong>Total Sales:</strong> ${formatCurrency(statement.totalSales)}</p>
                    <p><strong>Number of Transactions:</strong> ${statement.transactionCount}</p>
                    <p><strong>Incentive Rate:</strong> ${statement.incentivePercentage}%</p>
                    <p><strong>Incentive Amount:</strong> ${formatCurrency(statement.incentiveAmount)}</p>
                    <hr>
                    <p><strong>Gross Earnings:</strong> ${formatCurrency(parseFloat(statement.baseSalary) + parseFloat(statement.incentiveAmount))}</p>
                </div>

                <div>
                    <h4>Deductions</h4>
                    <p><strong>Total Advances:</strong> ${formatCurrency(statement.totalAdvances)}</p>
                    ${statement.advances && statement.advances.length > 0 ? '<div style="margin-top: 10px;"><strong>Advance Details:</strong></div>' : ''}
                    ${statement.advances ? statement.advances.map(advance =>
                        `<p style="font-size: 12px; color: #666; margin: 5px 0;">• ${formatDate(advance.date)}: ${formatCurrency(advance.amount)}</p>`
                    ).join('') : ''}
                </div>
            </div>

            <div class="total-section">
                <h3>Net Salary: ${formatCurrency(statement.netSalary)}</h3>
                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                    Calculation: Base Salary (${formatCurrency(statement.baseSalary)}) +
                    Incentive (${formatCurrency(statement.incentiveAmount)}) -
                    Advances (${formatCurrency(statement.totalAdvances)})
                </p>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <button class="btn print-keep" onclick="window.print()">Print Statement</button>
                <button class="btn btn-success" onclick="downloadStatement('${statement.employeeName}', '${statement.fromDate}', '${statement.toDate}')">Download PDF</button>
            </div>
        </div>
    `;

    document.getElementById('salaryStatementResult').innerHTML = statementHTML;
    document.getElementById('salaryStatementResult').classList.remove('hidden');
}

// Download statement (placeholder for PDF functionality)
function downloadStatement(employeeName, fromDate, toDate) {
    // In a real application, this would generate and download a PDF
    // For now, we'll create a simple text version

    const statementElement = document.querySelector('.salary-statement');
    const statementText = statementElement.innerText;

    const blob = new Blob([statementText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_statement_${employeeName.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    showAlert('Salary statement downloaded! (PDF functionality would be implemented with a library like jsPDF)', 'success');
}

// Validate salary form
function validateSalaryForm() {
    // UPDATED: Use new form field IDs
    const employeeUsername = document.getElementById('salaryEmployeeSelect').value;
    const incentivePercentage = parseFloat(document.getElementById('salaryIncentivePercentage').value);
    const fromDate = document.getElementById('salaryPeriodFromDate').value;
    const toDate = document.getElementById('salaryPeriodToDate').value;
    const baseSalary = parseFloat(document.getElementById('salaryBaseSalary').value);

    if (!employeeUsername) {
        showAlert('Please select an employee', 'error');
        return false;
    }

    if (isNaN(incentivePercentage) || incentivePercentage < 0 || incentivePercentage > 100) {
        showAlert('Incentive percentage must be between 0 and 100', 'error');
        return false;
    }

    if (!fromDate || !toDate) {
        showAlert('Please select both from and to dates', 'error');
        return false;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        showAlert('From date cannot be later than to date', 'error');
        return false;
    }

    if (isNaN(baseSalary) || baseSalary < 0) {
        showAlert('Base salary must be a positive number', 'error');
        return false;
    }

    return true;
}

// Enhanced form validation for salary
document.addEventListener('DOMContentLoaded', function() {
    // UPDATED: Use new form field IDs for validation
    // Incentive percentage validation
    const incentiveInput = document.getElementById('salaryIncentivePercentage');
    if (incentiveInput) {
        incentiveInput.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (value && (value < 0 || value > 100)) {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#fdf2f2';
            } else {
                this.style.borderColor = '#e0e6ed';
                this.style.backgroundColor = 'white';
            }
        });
    }

    // Base salary validation
    const baseSalaryInput = document.getElementById('salaryBaseSalary');
    if (baseSalaryInput) {
        baseSalaryInput.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (value && value < 0) {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#fdf2f2';
            } else {
                this.style.borderColor = '#e0e6ed';
                this.style.backgroundColor = 'white';
            }
        });
    }

    // Date validation
    const fromDateInput = document.getElementById('salaryPeriodFromDate');
    const toDateInput = document.getElementById('salaryPeriodToDate');

    if (fromDateInput && toDateInput) {
        function validateDates() {
            const fromDate = new Date(fromDateInput.value);
            const toDate = new Date(toDateInput.value);

            if (fromDateInput.value && toDateInput.value && fromDate > toDate) {
                fromDateInput.style.borderColor = '#e74c3c';
                toDateInput.style.borderColor = '#e74c3c';
                fromDateInput.style.backgroundColor = '#fdf2f2';
                toDateInput.style.backgroundColor = '#fdf2f2';
            } else {
                fromDateInput.style.borderColor = '#e0e6ed';
                toDateInput.style.borderColor = '#e0e6ed';
                fromDateInput.style.backgroundColor = 'white';
                toDateInput.style.backgroundColor = 'white';
            }
        }

        fromDateInput.addEventListener('change', validateDates);
        toDateInput.addEventListener('change', validateDates);
    }
});