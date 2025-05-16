// Store active charts
let activeCharts = {};

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
function initDashboardCharts() {
    const spendingCtx = document.getElementById('spendingTrendChart')?.getContext('2d');
    if (spendingCtx) {
        createChart(spendingCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Expenses',
                    data: [30000, 35000, 25000, 40000, 32000, 38000],
                    borderColor: '#e74c3c',
                    tension: 0.4
                }, {
                    label: 'Income',
                    data: [50000, 50000, 50000, 50000, 50000, 50000],
                    borderColor: '#2ecc71',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }, 'spendingTrend');
    }
    
    const categoryCtx = document.getElementById('categoryDistributionChart')?.getContext('2d');
    if (categoryCtx) {
        createChart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities'],
                datasets: [{
                    data: [30, 15, 15, 10, 10, 20],
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
                maintainAspectRatio: false
            }
        }, 'categoryDist');
    }
}

function initBudgetCharts() {
    const spendingTrendCtx = document.getElementById('spendingTrendChart')?.getContext('2d');
    if (spendingTrendCtx) {
        createChart(spendingTrendCtx, {
            type: 'bar',
            data: {
                labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities'],
                datasets: [{
                    label: 'Budget',
                    data: [15000, 7500, 7500, 5000, 5000, 5000],
                    backgroundColor: '#3498db'
                }, {
                    label: 'Spent',
                    data: [9000, 6375, 7125, 2000, 2500, 3750],
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
        createChart(categoryDistCtx, {
            type: 'doughnut',
            data: {
                labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities'],
                datasets: [{
                    data: [9000, 6375, 7125, 2000, 2500, 3750],
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