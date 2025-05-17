// Store active charts
let activeCharts = {};
let dashboardData = {
    currentPeriod: 'monthly',
    expenses: [],
    income: [],
    savingsHistory: [],
    investmentReturns: []
};

// Function to destroy active charts
function destroyActiveCharts() {
    Object.values(activeCharts).forEach(chart => {
        if (chart) {
            try {
                chart.destroy();
            } catch (e) {
                console.error('Error destroying chart:', e);
            }
        }
    });
    activeCharts = {};
}

// Function to create a new chart safely
function createChart(ctx, config, chartKey) {
    try {
        // Ensure any existing chart with this key is destroyed
        if (activeCharts[chartKey]) {
            activeCharts[chartKey].destroy();
        }
        // Create new chart
        activeCharts[chartKey] = new Chart(ctx, config);
        return activeCharts[chartKey];
    } catch (e) {
        console.error(`Error creating chart ${chartKey}:`, e);
        return null;
    }
}

// Initialize dashboard data based on user's salary
function initializeDashboardData(userData) {
    const monthlyIncome = userData.monthlyIncome;
    const savingsGoal = userData.savingsGoal;
    
    // Generate 12 months of data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    dashboardData.expenses = [];
    dashboardData.income = [];
    dashboardData.savingsHistory = [];
    dashboardData.investmentReturns = [];

    // Generate realistic variations in expenses (80-120% of expected expenses)
    const expectedMonthlyExpenses = monthlyIncome * (1 - savingsGoal / 100);
    
    months.forEach((month, index) => {
        // Random variation factor between 0.8 and 1.2
        const variationFactor = 0.8 + Math.random() * 0.4;
        const monthExpenses = expectedMonthlyExpenses * variationFactor;
        
        // Some months might have additional income (bonuses, etc.)
        const additionalIncome = Math.random() < 0.2 ? monthlyIncome * 0.1 : 0;
        const monthIncome = monthlyIncome + additionalIncome;
        
        // Calculate savings
        const monthSavings = monthIncome - monthExpenses;
        
        // Calculate investment returns (assuming 8-12% annual returns, distributed monthly)
        const annualReturn = 0.08 + Math.random() * 0.04;
        const monthlyReturn = Math.pow(1 + annualReturn, 1/12) - 1;
        const previousInvestments = index > 0 ? dashboardData.investmentReturns[index - 1] : monthSavings;
        const investmentReturn = previousInvestments * (1 + monthlyReturn) + monthSavings;
        
        dashboardData.expenses.push(monthExpenses);
        dashboardData.income.push(monthIncome);
        dashboardData.savingsHistory.push(monthSavings);
        dashboardData.investmentReturns.push(investmentReturn);
    });
}

// Get data for current period
function getPeriodData(data, period) {
    switch(period) {
        case 'yearly':
            return data;
        case 'quarterly':
            return data.slice(-3);
        default: // monthly
            return [data[data.length - 1]];
    }
}

// Get labels for current period
function getPeriodLabels(period) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    switch(period) {
        case 'yearly':
            return months;
        case 'quarterly':
            const quarterMonths = months.slice(currentMonth - 2, currentMonth + 1);
            return quarterMonths.length === 3 ? quarterMonths : months.slice(-3);
        default: // monthly
            return [months[currentMonth]];
    }
}

// Initialize dashboard charts
function initDashboardCharts() {
    const userData = localStorage.getItem('spendrUserData');
    if (!userData) return;
    
    const parsedUserData = JSON.parse(userData);
    if (!dashboardData.expenses.length) {
        initializeDashboardData(parsedUserData);
    }
    
    const spendingCtx = document.getElementById('spendingTrendChart')?.getContext('2d');
    if (spendingCtx) {
        const labels = getPeriodLabels(dashboardData.currentPeriod);
        const expenseData = getPeriodData(dashboardData.expenses, dashboardData.currentPeriod);
        const incomeData = getPeriodData(dashboardData.income, dashboardData.currentPeriod);
        
        createChart(spendingCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#e74c3c',
                    tension: 0.4
                }, {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#2ecc71',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return label + ': ₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                            }
                        }
                    }
                }
            }
        }, 'spendingTrend');
    }
    
    const categoryCtx = document.getElementById('categoryDistributionChart')?.getContext('2d');
    if (categoryCtx) {
        // Use the budget categories and their spent amounts
        const categories = Object.keys(budgetData.categories).map(formatCategoryName);
        let spentAmounts;
        
        if (dashboardData.currentPeriod === 'yearly') {
            spentAmounts = Object.values(budgetData.categories)
                .map(cat => cat.yearlySpent.reduce((a, b) => a + b, 0));
        } else if (dashboardData.currentPeriod === 'quarterly') {
            spentAmounts = Object.values(budgetData.categories)
                .map(cat => cat.quarterlySpent.slice(-3).reduce((a, b) => a + b, 0));
        } else {
            spentAmounts = Object.values(budgetData.categories).map(cat => cat.spent);
        }

        createChart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: spentAmounts,
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71',
                        '#e74c3c',
                        '#f39c12',
                        '#9b59b6',
                        '#1abc9c'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        }, 'categoryDist');
    }

    // Add Financial Health Score
    updateFinancialHealthScore(parsedUserData);
}

// Update Financial Health Score
function updateFinancialHealthScore(userData) {
    const monthlyIncome = userData.monthlyIncome;
    const savingsGoal = userData.savingsGoal;
    const lastMonthExpenses = dashboardData.expenses[dashboardData.expenses.length - 1];
    const lastMonthSavings = dashboardData.savingsHistory[dashboardData.savingsHistory.length - 1];
    
    let score = 0;
    
    // Savings Rate Score (40 points)
    const actualSavingsRate = (lastMonthSavings / monthlyIncome) * 100;
    score += Math.min(40, (actualSavingsRate / savingsGoal) * 40);
    
    // Expense Management Score (30 points)
    const expenseRatio = lastMonthExpenses / monthlyIncome;
    score += expenseRatio <= 0.7 ? 30 : (30 * (0.7 / expenseRatio));
    
    // Emergency Fund Score (30 points)
    const emergencyFund = dashboardData.investmentReturns[dashboardData.investmentReturns.length - 1];
    const monthsOfExpenses = emergencyFund / (monthlyIncome * 0.7);
    score += Math.min(30, (monthsOfExpenses / 6) * 30);
    
    // Update score display
    const scoreElement = document.querySelector('.financial-health-score');
    if (scoreElement) {
        const finalScore = Math.round(score);
        scoreElement.textContent = finalScore;
        
        // Update score color
        if (finalScore >= 80) {
            scoreElement.style.color = '#2ecc71';
        } else if (finalScore >= 60) {
            scoreElement.style.color = '#f39c12';
        } else {
            scoreElement.style.color = '#e74c3c';
        }
    }
}

// Setup dashboard period switching
function setupDashboardPeriodSwitching() {
    const periodButtons = document.querySelectorAll('.dashboard .chart-filter');
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update period and refresh display
            dashboardData.currentPeriod = this.textContent.toLowerCase();
            initDashboardCharts();
        });
    });
}

// Page Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize default page
    showPage('home');
    
    // Initialize charts if on dashboard
    if (document.getElementById('dashboard-page')) {
        initDashboardCharts();
    }
});

async function showPage(pageId) {
    try {
        // Scroll to top of the page
        window.scrollTo(0, 0);
        
        // Destroy existing charts
        destroyActiveCharts();
        
        // Hide all pages first
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
            if (page.id !== `${pageId}-page`) {
                page.innerHTML = '';
            }
        });
        
        const pageElement = document.getElementById(`${pageId}-page`);
        
        // Show loading indicator
        pageElement.innerHTML = '<div class="loading">Loading...</div>';
        pageElement.classList.remove('hidden');
        
        // Load the new page content
        await loadPageContent(pageId);
        
        // Update active menu item
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick').includes(pageId)) {
                link.classList.add('active');
            }
        });
        
        // Initialize page-specific functionality after a short delay
        setTimeout(() => {
            switch(pageId) {
                case 'dashboard':
                    if (typeof initDashboardCharts === 'function') {
                        initDashboardCharts();
                    }
                    break;
                case 'budget':
                    if (typeof initBudgetCharts === 'function') {
                        initBudgetCharts();
                    }
                    break;
                case 'investment':
                    if (typeof initInvestmentCharts === 'function') {
                        initInvestmentCharts();
                    }
                    break;
                case 'tax':
                    if (typeof initTaxCharts === 'function') {
                        initTaxCharts();
                    }
                    if (typeof initTaxDocumentActions === 'function') {
                        initTaxDocumentActions();
                    }
                    break;
            }
        }, 100); // Small delay to ensure DOM is ready
        
    } catch (error) {
        console.error('Error loading page:', error);
        const pageElement = document.getElementById(`${pageId}-page`);
        pageElement.innerHTML = `
            <div class="error-message">
                <h3>Error loading page content</h3>
                <p>Please try again.</p>
                <p>Technical details: ${error.message}</p>
                <button onclick="showPage('${pageId}')">Retry</button>
            </div>
        `;
    }
}

// Load page content dynamically
async function loadPageContent(pageId) {
    try {
        const response = await fetch(`./pages/${pageId}.html`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();
        document.getElementById(`${pageId}-page`).innerHTML = content;
        
        // Reinitialize user data after loading page content
        const userData = localStorage.getItem('spendrUserData');
        if (userData) {
            initializeApp(JSON.parse(userData));
        }
    } catch (error) {
        console.error('Error loading page:', error);
        throw error;
    }
}

// Chart Initialization Functions
function initBudgetCharts() {
    const spendingTrendCtx = document.getElementById('spendingTrendChart')?.getContext('2d');
    if (spendingTrendCtx) {
        const categories = Object.keys(budgetData.categories).map(formatCategoryName);
        const budgetAmounts = Object.values(budgetData.categories).map(cat => cat.budget);
        const spentAmounts = Object.values(budgetData.categories).map(cat => cat.spent);

        createChart(spendingTrendCtx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Budget',
                    data: budgetAmounts,
                    backgroundColor: '#3498db'
                }, {
                    label: 'Spent',
                    data: spentAmounts,
                    backgroundColor: '#2ecc71'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }, 'budgetTrend');
    }

    const categoryDistCtx = document.getElementById('categoryDistributionChart')?.getContext('2d');
    if (categoryDistCtx) {
        const categories = Object.keys(budgetData.categories).map(formatCategoryName);
        const spentAmounts = Object.values(budgetData.categories).map(cat => cat.spent);

        createChart(categoryDistCtx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: spentAmounts,
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71',
                        '#e74c3c',
                        '#f39c12',
                        '#9b59b6',
                        '#1abc9c'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        }, 'budgetDist');
    }
}

function initInvestmentCharts() {
    const performanceCtx = document.getElementById('portfolioPerformanceChart')?.getContext('2d');
    if (performanceCtx) {
        createChart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [480000, 485000, 490000, 495000, 497500, 500000],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#2ecc71',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return '₹' + context.parsed.y.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        }, 'portfolioPerformance');
    }
    
    const allocationCtx = document.getElementById('allocationChart')?.getContext('2d');
    if (allocationCtx) {
        createChart(allocationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Stocks', 'Mutual Funds', 'Fixed Deposits'],
                datasets: [{
                    data: [40, 35, 25],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(243, 156, 18, 0.8)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(243, 156, 18, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 13
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        }, 'allocation');
    }
}

function initTaxCharts() {
    const incomeCtx = document.getElementById('incomeBreakdownChart')?.getContext('2d');
    if (incomeCtx) {
        createChart(incomeCtx, {
            type: 'pie',
            data: {
                labels: ['Salary', 'Investments', 'Other'],
                datasets: [{
                    data: [1000000, 150000, 50000],
                    backgroundColor: ['#3498db', '#2ecc71', '#f39c12']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }, 'incomeBreakdown');
    }
    
    const savingsCtx = document.getElementById('taxSavingsChart')?.getContext('2d');
    if (savingsCtx) {
        createChart(savingsCtx, {
            type: 'bar',
            data: {
                labels: ['80C', '80D', 'HRA', 'Other'],
                datasets: [{
                    label: 'Tax Savings',
                    data: [30000, 5000, 10000, 5000],
                    backgroundColor: '#2ecc71'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }, 'taxSavings');
    }
}

// Modal Functions
function openAddBudgetModal() {
    document.getElementById('addBudgetModal').style.display = 'flex';
}

function closeAddBudgetModal() {
    document.getElementById('addBudgetModal').style.display = 'none';
}

function openAddInvestmentModal() {
    document.getElementById('addInvestmentModal').style.display = 'flex';
}

function closeAddInvestmentModal() {
    document.getElementById('addInvestmentModal').style.display = 'none';
}

function openAddTaxModal() {
    document.getElementById('addTaxModal').style.display = 'flex';
}

function closeAddTaxModal() {
    document.getElementById('addTaxModal').style.display = 'none';
}

// Form Submission Handlers
document.addEventListener('DOMContentLoaded', function() {
    // Budget Form
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle budget form submission
            const formData = {
                category: document.getElementById('budgetCategory').value,
                amount: document.getElementById('budgetAmount').value,
                period: document.getElementById('budgetPeriod').value
            };
            console.log('Budget form submitted:', formData);
            closeAddBudgetModal();
        });
    }
    
    // Investment Form
    const investmentForm = document.getElementById('investmentForm');
    if (investmentForm) {
        investmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle investment form submission
            const formData = {
                type: document.getElementById('investmentType').value,
                name: document.getElementById('investmentName').value,
                amount: document.getElementById('investmentAmount').value,
                date: document.getElementById('investmentDate').value
            };
            console.log('Investment form submitted:', formData);
            closeAddInvestmentModal();
        });
    }
    
    // Tax Document Form
    const taxDocumentForm = document.getElementById('taxDocumentForm');
    if (taxDocumentForm) {
        taxDocumentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle tax document form submission
            const formData = {
                type: document.getElementById('documentType').value,
                date: document.getElementById('documentDate').value,
                amount: document.getElementById('documentAmount').value,
                file: document.getElementById('documentFile').files[0]
            };
            console.log('Tax document form submitted:', formData);
            closeAddTaxModal();
        });
    }
}); 