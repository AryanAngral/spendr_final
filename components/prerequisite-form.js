// Prerequisite Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user data exists
    if (!localStorage.getItem('spendrUserData')) {
        document.getElementById('prerequisiteModal').style.display = 'flex';
    } else {
        initializeApp(JSON.parse(localStorage.getItem('spendrUserData')));
    }
    
    // Handle form submission
    document.getElementById('prerequisiteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset error messages
        document.querySelectorAll('.error-message').forEach(msg => msg.style.display = 'none');
        
        // Validate form
        let isValid = true;
        const userData = {
            fullName: document.getElementById('fullName').value.trim(),
            monthlyIncome: parseFloat(document.getElementById('monthlyIncome').value),
            savingsGoal: parseFloat(document.getElementById('savingsGoal').value),
            riskTolerance: document.getElementById('riskTolerance').value
        };
        
        // Validation checks
        if (!userData.fullName) {
            document.getElementById('nameError').style.display = 'block';
            isValid = false;
        }
        
        if (isNaN(userData.monthlyIncome) || userData.monthlyIncome <= 0) {
            document.getElementById('incomeError').style.display = 'block';
            isValid = false;
        }
        
        if (isNaN(userData.savingsGoal) || userData.savingsGoal < 0 || userData.savingsGoal > 100) {
            document.getElementById('savingsError').style.display = 'block';
            isValid = false;
        }
        
        if (!userData.riskTolerance) {
            document.getElementById('riskError').style.display = 'block';
            isValid = false;
        }
        
        if (isValid) {
            // Save user data
            localStorage.setItem('spendrUserData', JSON.stringify(userData));
            
            // Hide modal
            document.getElementById('prerequisiteModal').style.display = 'none';
            
            // Initialize app with user data
            initializeApp(userData);
        }
    });
});

// Initialize app with user data
function initializeApp(userData) {
    // Update welcome message in all possible locations
    document.querySelectorAll('.welcome-text h1').forEach(welcomeText => {
        welcomeText.textContent = `Welcome back, ${userData.fullName}!`;
    });
    
    // Recalculate budgets if budget.js is loaded
    if (typeof calculateBudgets === 'function') {
        calculateBudgets(userData);
    }
    
    // Initialize investment recommendations based on risk tolerance
    initializeInvestmentRecommendations(userData.riskTolerance);
}

// Initialize investment recommendations based on risk tolerance
function initializeInvestmentRecommendations(riskTolerance) {
    let recommendations = {
        conservative: {
            stocks: 20,
            bonds: 50,
            fixedDeposits: 30
        },
        moderate: {
            stocks: 50,
            bonds: 30,
            fixedDeposits: 20
        },
        aggressive: {
            stocks: 70,
            bonds: 20,
            fixedDeposits: 10
        }
    };
    
    const allocation = recommendations[riskTolerance];
    
    // Update investment allocation chart if on investment page
    const allocationChart = document.getElementById('allocationChart');
    if (allocationChart && window.Chart) {
        new Chart(allocationChart.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Stocks', 'Bonds', 'Fixed Deposits'],
                datasets: [{
                    data: [allocation.stocks, allocation.bonds, allocation.fixedDeposits],
                    backgroundColor: ['#3498db', '#2ecc71', '#f39c12']
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
        });
    }
} 