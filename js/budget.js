// Budget data structure
let budgetData = {
    totalBudget: 0,
    savingsGoal: 0,
    emergencyFund: 0,
    currentPeriod: 'monthly', // Track current view period
    categories: {
        housing: { budget: 0, spent: 0, quarterlySpent: [], yearlySpent: [] },
        food: { budget: 0, spent: 0, quarterlySpent: [], yearlySpent: [] },
        transportation: { budget: 0, spent: 0, quarterlySpent: [], yearlySpent: [] },
        entertainment: { budget: 0, spent: 0, quarterlySpent: [], yearlySpent: [] },
        shopping: { budget: 0, spent: 0, quarterlySpent: [], yearlySpent: [] },
        utilities: { budget: 0, spent: 0, quarterlySpent: [], yearlySpent: [] }
    }
};

// Category percentages of disposable income (after savings)
const categoryPercentages = {
    housing: 0.3,        // 30% for housing
    food: 0.15,          // 15% for food
    transportation: 0.15, // 15% for transportation
    entertainment: 0.1,   // 10% for entertainment
    shopping: 0.1,       // 10% for shopping
    utilities: 0.1       // 10% for utilities
    // Remaining 10% as buffer
};

// Initialize budget page
function initializeBudgetPage() {
    // Load user data
    const userData = localStorage.getItem('spendrUserData');
    if (userData) {
        const parsedUserData = JSON.parse(userData);
        calculateBudgets(parsedUserData);
    }
    
    updateBudgetOverview();
    updateCategoryCards();
    initBudgetCharts();
    setupBudgetFormListeners();
    setupPeriodSwitching();
}

// Setup period switching
function setupPeriodSwitching() {
    const periodButtons = document.querySelectorAll('.chart-filter');
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update period and refresh display
            const period = this.textContent.toLowerCase();
            switchPeriod(period);
        });
    });
}

// Switch between different periods
function switchPeriod(period) {
    budgetData.currentPeriod = period;
    updateBudgetOverview();
    updateCategoryCards();
    initBudgetCharts();
    saveBudgetData();
}

// Get multiplier for current period
function getPeriodMultiplier() {
    switch(budgetData.currentPeriod) {
        case 'yearly':
            return 12;
        case 'quarterly':
            return 3;
        default:
            return 1;
    }
}

// Format amount based on current period
function formatAmountForPeriod(amount) {
    const multiplier = getPeriodMultiplier();
    return amount * multiplier;
}

// Calculate budgets based on user's income
function calculateBudgets(userData) {
    const monthlyIncome = userData.monthlyIncome;
    const savingsPercentage = userData.savingsGoal;
    
    // Calculate disposable income after savings
    const savingsAmount = monthlyIncome * (savingsPercentage / 100);
    const disposableIncome = monthlyIncome - savingsAmount;
    
    // Update budget data
    budgetData.totalBudget = disposableIncome;
    budgetData.savingsGoal = savingsAmount;
    budgetData.emergencyFund = monthlyIncome * 6; // 6 months of income as emergency fund goal
    
    // Calculate category budgets
    Object.keys(budgetData.categories).forEach(category => {
        const percentage = categoryPercentages[category];
        budgetData.categories[category].budget = disposableIncome * percentage;
    });
    
    // Save to localStorage
    saveBudgetData();
}

// Update budget overview section
function updateBudgetOverview() {
    const multiplier = getPeriodMultiplier();
    const periodBudget = budgetData.totalBudget * multiplier;
    const periodSavings = budgetData.savingsGoal * multiplier;
    
    let totalSpent = 0;
    if (budgetData.currentPeriod === 'yearly') {
        totalSpent = Object.values(budgetData.categories)
            .reduce((sum, cat) => sum + cat.yearlySpent.reduce((a, b) => a + b, 0), 0);
    } else if (budgetData.currentPeriod === 'quarterly') {
        totalSpent = Object.values(budgetData.categories)
            .reduce((sum, cat) => sum + cat.quarterlySpent.slice(-3).reduce((a, b) => a + b, 0), 0);
    } else {
        totalSpent = Object.values(budgetData.categories)
            .reduce((sum, cat) => sum + cat.spent, 0);
    }
    
    const budgetUsedPercentage = (totalSpent / periodBudget) * 100;
    
    // Update Monthly/Quarterly/Yearly Budget card
    const periodText = budgetData.currentPeriod.charAt(0).toUpperCase() + budgetData.currentPeriod.slice(1);
    document.querySelector('.budget-overview .card:nth-child(1) .card-title').textContent = 
        `${periodText} Budget`;
    document.querySelector('.budget-overview .card:nth-child(1) .card-value').textContent = 
        `₹${periodBudget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    document.querySelector('.budget-overview .card:nth-child(1) .progress-bar').style.width = 
        `${budgetUsedPercentage}%`;
    document.querySelector('.budget-overview .card:nth-child(1) .card-info').textContent = 
        `${Math.round(budgetUsedPercentage)}% of budget used`;
    
    // Update Savings Goal card
    document.querySelector('.budget-overview .card:nth-child(2) .card-value').textContent = 
        `₹${periodSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    
    // Update progress bar class based on percentage
    const progressBar = document.querySelector('.budget-overview .card:nth-child(1) .progress-bar');
    progressBar.className = 'progress-bar ' + getProgressBarClass(budgetUsedPercentage);
}

// Update category cards
function updateCategoryCards() {
    const categoriesGrid = document.querySelector('.categories-grid');
    categoriesGrid.innerHTML = ''; // Clear existing cards
    const multiplier = getPeriodMultiplier();
    
    Object.entries(budgetData.categories).forEach(([category, data]) => {
        const periodBudget = data.budget * multiplier;
        let periodSpent = data.spent;
        
        if (budgetData.currentPeriod === 'yearly') {
            periodSpent = data.yearlySpent.reduce((a, b) => a + b, 0);
        } else if (budgetData.currentPeriod === 'quarterly') {
            periodSpent = data.quarterlySpent.slice(-3).reduce((a, b) => a + b, 0);
        }
        
        const spentPercentage = (periodSpent / periodBudget) * 100;
        const remaining = periodBudget - periodSpent;
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <div class="category-header">
                <span class="category-name">${formatCategoryName(category)}</span>
                <span class="category-budget">₹${periodBudget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div class="budget-progress">
                <div class="progress-bar ${getProgressBarClass(spentPercentage)}" 
                     style="width: ${spentPercentage}%;"></div>
            </div>
            <div class="category-details">
                <span>Spent: ₹${periodSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                <span>Remaining: ₹${remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div class="category-actions">
                <button onclick="openAddExpenseModal('${category}')" class="form-button">Add Expense</button>
            </div>
        `;
        
        categoriesGrid.appendChild(categoryCard);
    });
}

// Setup form listeners
function setupBudgetFormListeners() {
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const category = document.getElementById('budgetCategory').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);
            const period = document.getElementById('budgetPeriod').value;
            
            updateBudget(category, amount, period);
            closeAddBudgetModal();
        });
    }
}

// Update budget data
function updateBudget(category, amount, period) {
    // Adjust amount based on period
    const monthlyAmount = period === 'yearly' ? amount / 12 : 
                         period === 'quarterly' ? amount / 3 : amount;
    
    budgetData.categories[category].budget = monthlyAmount;
    
    // Update total budget
    budgetData.totalBudget = Object.values(budgetData.categories)
        .reduce((sum, cat) => sum + cat.budget, 0);
    
    // Update UI
    updateBudgetOverview();
    updateCategoryCards();
    initBudgetCharts();
    
    // Save to localStorage
    saveBudgetData();
}

// Add expense with period tracking
function addExpense(category, amount) {
    const categoryData = budgetData.categories[category];
    
    // Update monthly spent
    categoryData.spent = amount;
    
    // Update quarterly tracking
    if (!categoryData.quarterlySpent) categoryData.quarterlySpent = [];
    if (categoryData.quarterlySpent.length >= 3) {
        categoryData.quarterlySpent.shift();
    }
    categoryData.quarterlySpent.push(amount);
    
    // Update yearly tracking
    if (!categoryData.yearlySpent) categoryData.yearlySpent = [];
    if (categoryData.yearlySpent.length >= 12) {
        categoryData.yearlySpent.shift();
    }
    categoryData.yearlySpent.push(amount);
    
    // Update UI
    updateBudgetOverview();
    updateCategoryCards();
    initBudgetCharts();
    
    // Save to localStorage
    saveBudgetData();
}

// Helper function to format category names
function formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + 
           category.slice(1).replace(/([A-Z])/g, ' $1');
}

// Helper function to determine progress bar class
function getProgressBarClass(percentage) {
    if (percentage >= 90) return 'progress-danger';
    if (percentage >= 70) return 'progress-warning';
    return 'progress-safe';
}

// Save budget data to localStorage
function saveBudgetData() {
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
}

// Load budget data from localStorage
function loadBudgetData() {
    const saved = localStorage.getItem('budgetData');
    if (saved) {
        budgetData = JSON.parse(saved);
    }
}

// Add expense modal
function openAddExpenseModal(category) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'addExpenseModal';
    modal.innerHTML = `
        <div class="modal">
            <h2>Add Expense for ${formatCategoryName(category)}</h2>
            <form id="expenseForm">
                <div class="form-group">
                    <label for="expenseAmount" class="form-label">Amount</label>
                    <input type="number" id="expenseAmount" class="form-input" required min="0" step="100">
                </div>
                <div class="form-group">
                    <label for="expenseDescription" class="form-label">Description</label>
                    <input type="text" id="expenseDescription" class="form-input" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="form-button" onclick="closeAddExpenseModal()">Cancel</button>
                    <button type="submit" class="form-button">Add Expense</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const expenseForm = document.getElementById('expenseForm');
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        addExpense(category, amount);
        closeAddExpenseModal();
    });
}

function closeAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.remove();
    }
}

// Initialize budget charts
function initBudgetCharts() {
    const spendingTrendCtx = document.getElementById('spendingTrendChart')?.getContext('2d');
    if (spendingTrendCtx) {
        const multiplier = getPeriodMultiplier();
        const categories = Object.keys(budgetData.categories).map(formatCategoryName);
        const budgetAmounts = Object.values(budgetData.categories).map(cat => cat.budget * multiplier);
        let spentAmounts;
        
        if (budgetData.currentPeriod === 'yearly') {
            spentAmounts = Object.values(budgetData.categories)
                .map(cat => cat.yearlySpent.reduce((a, b) => a + b, 0));
        } else if (budgetData.currentPeriod === 'quarterly') {
            spentAmounts = Object.values(budgetData.categories)
                .map(cat => cat.quarterlySpent.slice(-3).reduce((a, b) => a + b, 0));
        } else {
            spentAmounts = Object.values(budgetData.categories).map(cat => cat.spent);
        }

        createChart(spendingTrendCtx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: `${budgetData.currentPeriod.charAt(0).toUpperCase() + budgetData.currentPeriod.slice(1)} Budget`,
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
        }, 'budgetTrend');
    }

    const categoryDistCtx = document.getElementById('categoryDistributionChart')?.getContext('2d');
    if (categoryDistCtx) {
        const categories = Object.keys(budgetData.categories).map(formatCategoryName);
        let spentAmounts;
        
        if (budgetData.currentPeriod === 'yearly') {
            spentAmounts = Object.values(budgetData.categories)
                .map(cat => cat.yearlySpent.reduce((a, b) => a + b, 0));
        } else if (budgetData.currentPeriod === 'quarterly') {
            spentAmounts = Object.values(budgetData.categories)
                .map(cat => cat.quarterlySpent.slice(-3).reduce((a, b) => a + b, 0));
        } else {
            spentAmounts = Object.values(budgetData.categories).map(cat => cat.spent);
        }

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
        }, 'budgetDist');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadBudgetData();
    if (document.querySelector('.budget-container')) {
        initializeBudgetPage();
    }
}); 