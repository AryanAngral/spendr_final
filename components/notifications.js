// Notifications Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add notification bell to each page header
    document.querySelectorAll('.dashboard-header').forEach(header => {
        const notificationBell = createNotificationBell();
        header.appendChild(notificationBell);
        
        // Add notification bell functionality
        const bellIcon = notificationBell.querySelector('.bell-icon');
        const dropdown = notificationBell.querySelector('.notification-dropdown');
        
        bellIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            
            // Mark notifications as read and update badge
            if (dropdown.style.display === 'block') {
                notificationBell.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
                notificationBell.querySelector('.notification-badge').style.display = 'none';
            }
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function() {
            dropdown.style.display = 'none';
        });
    });
});

// Create notification bell element
function createNotificationBell() {
    const notificationBell = document.createElement('div');
    notificationBell.className = 'notification-bell';
    notificationBell.innerHTML = `
        <div class="bell-icon">🔔<span class="notification-badge">3</span></div>
        <div class="notification-dropdown">
            <div class="notification-item unread">
                <div class="notification-content">
                    <h4>Budget Alert</h4>
                    <p>You've exceeded your Transportation budget by 15%.</p>
                    <span class="notification-time">2 hours ago</span>
                </div>
            </div>
            <div class="notification-item unread">
                <div class="notification-content">
                    <h4>Investment Update</h4>
                    <p>HDFC Bank shares increased by 2.1% today.</p>
                    <span class="notification-time">5 hours ago</span>
                </div>
            </div>
            <div class="notification-item unread">
                <div class="notification-content">
                    <h4>Bill Due</h4>
                    <p>Your electricity bill is due in 3 days.</p>
                    <span class="notification-time">Yesterday</span>
                </div>
            </div>
            <div class="notification-item">
                <div class="notification-content">
                    <h4>Savings Goal</h4>
                    <p>You're halfway to your vacation savings goal!</p>
                    <span class="notification-time">2 days ago</span>
                </div>
            </div>
            <div class="view-all-link">
                <a href="#">View All Notifications</a>
            </div>
        </div>
    `;
    return notificationBell;
}

// Add a new notification
function addNotification(title, message, isUnread = true) {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item${isUnread ? ' unread' : ''}`;
    notificationItem.innerHTML = `
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
            <span class="notification-time">Just now</span>
        </div>
    `;
    
    document.querySelectorAll('.notification-dropdown').forEach(dropdown => {
        dropdown.insertBefore(notificationItem, dropdown.querySelector('.view-all-link'));
    });
    
    // Update notification badge
    document.querySelectorAll('.notification-badge').forEach(badge => {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    });
}

// Check for new notifications periodically
setInterval(() => {
    checkForNewNotifications();
}, 60000); // Check every minute

// Simulate checking for new notifications
function checkForNewNotifications() {
    // This is a mock function that would normally check with a server
    // For demo purposes, we'll randomly add notifications
    if (Math.random() < 0.3) { // 30% chance of new notification
        const notifications = [
            {
                title: 'Budget Alert',
                message: 'You\'re close to your Entertainment budget limit.'
            },
            {
                title: 'Investment Opportunity',
                message: 'New high-yield fixed deposit rates available.'
            },
            {
                title: 'Savings Milestone',
                message: 'Congratulations! You\'ve saved ₹10,000 this month.'
            }
        ];
        
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        addNotification(randomNotification.title, randomNotification.message);
    }
} 