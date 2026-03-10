/**
 * Real-Time Notification System
 * Polls the server every 5 seconds for updates.
 */

document.addEventListener('DOMContentLoaded', () => {
    startNotificationService();
    setupNotificationDropdown();
});

let notifInterval = null;

function startNotificationService() {
    if (notifInterval) clearInterval(notifInterval);
    
    // Initial check
    checkNotifications();
    
    // Poll every 5 seconds
    notifInterval = setInterval(checkNotifications, 5000);
}

async function checkNotifications() {
    const user = JSON.parse(localStorage.getItem('citylinkUser'));
    if (!user) return;

    try {
        // David's userId in the mock is often '7' (Service ID) or a string from login.
        // Ensure your Login logic sets the correct ID. 
        // For this demo, if user is business, we ensure ID is '7' for matching app.py logic.
        let userIdToCheck = user.userId;
        if(user.type === 'Business' && user.userId !== '7') {
             // Patch for demo consistency if needed
             // userIdToCheck = '7'; 
        }

        const response = await fetch(`/api/notifications/list?userId=${userIdToCheck}`);
        const data = await response.json();
        
        if (data.success) {
            renderNotifications(data.notifications);
        }
    } catch (e) {
        console.error("Notification poll failed", e);
    }
}

function renderNotifications(notifications) {
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');
    const emptyState = document.getElementById('notif-empty');
    
    // 1. Update Badge
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        badge.classList.remove('hidden');
        badge.classList.add('animate-pulse'); // Heartbeat effect
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('animate-pulse');
    }

    // 2. Update Dropdown List
    if (list) {
        list.innerHTML = '';
        
        if (notifications.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            notifications.forEach(n => {
                const isUnread = !n.read;
                const bgClass = isUnread ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'bg-white opacity-75';
                const iconColor = n.type === 'success' ? 'text-green-500' : 'text-blue-500';
                const icon = n.type === 'success' ? 'check-circle' : 'info';

                const item = `
                    <div onclick="handleNotificationClick('${n.id}', '${n.link}')" 
                         class="p-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 ${bgClass}">
                        <div class="flex items-start gap-3">
                            <div class="mt-1 ${iconColor}">
                                <i data-lucide="${icon}" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-800 ${isUnread ? 'font-bold' : ''}">${n.message}</p>
                                <p class="text-xs text-gray-400 mt-1">${timeAgo(n.timestamp)}</p>
                            </div>
                        </div>
                    </div>
                `;
                list.innerHTML += item;
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

async function handleNotificationClick(notifId, link) {
    const user = JSON.parse(localStorage.getItem('citylinkUser'));
    if(!user) return;

    // Mark as read
    await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ notification_id: notifId, user_id: user.userId })
    });

    // Navigate
    if (link && link !== '#') {
        window.location.href = link;
    } else {
        // Just refresh list visually
        checkNotifications(); 
    }
}

// UI Helper: Toggle Dropdown
function setupNotificationDropdown() {
    const btn = document.getElementById('notif-btn');
    const dropdown = document.getElementById('notif-dropdown');
    
    if(btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}