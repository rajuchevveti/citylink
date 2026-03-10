/**
 * Resident Dashboard Controller
 * Fetches live stats (Spent, Active Jobs) and Activity Feed.
 */

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('citylinkUser'));
    if (!user) {
        window.location.href = '/login';
        return;
    }

    // Set Name
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = user.name.split(' ')[0];

    // Initial Load
    fetchStats(user.userId);

    // Auto-Refresh (Polling)
    setInterval(() => {
        fetchStats(user.userId);
    }, 3000);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

async function fetchStats(userId) {
    try {
        const response = await fetch(`/api/resident/dashboard-stats?customerId=${userId}`);
        const data = await response.json();

        if (data.success) {
            // 1. Update Counters
            animateValue("upcoming-count", parseInt(document.getElementById('upcoming-count').innerText) || 0, data.active_count, 1000);
            animateValue("completed-count", parseInt(document.getElementById('completed-count').innerText) || 0, data.completed_count, 1000);
            
            // Total Spent (Handle Euro/Rupee symbol in HTML, here just number)
            const spentEl = document.getElementById('total-spent');
            const currentSpent = parseInt(spentEl.innerText.replace(/[^0-9]/g, '')) || 0;
            if (currentSpent !== data.total_spent) {
                animateValue("total-spent", currentSpent, data.total_spent, 1000);
            }

            // 2. Update Activity Feed
            renderActivityFeed(data.recent_activity);
        }
    } catch (error) {
        console.error("Dashboard sync failed:", error);
    }
}

function renderActivityFeed(activities) {
    const list = document.getElementById('recent-activity-list');
    if (!list) return;

    if (activities.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <p>No recent activity.</p>
                <a href="/" class="text-xs text-indigo-600 font-bold hover:underline">Book your first service</a>
            </div>`;
        return;
    }

    // Only update if content changed (simple check)
    const newHTML = activities.map(act => {
        let icon = 'activity';
        let color = 'bg-gray-100 text-gray-600';

        if (act.type === 'Booked') { icon = 'check-circle'; color = 'bg-green-100 text-green-600'; }
        if (act.type === 'Quoted') { icon = 'file-text'; color = 'bg-yellow-100 text-yellow-600'; }
        if (act.type === 'Completed') { icon = 'award'; color = 'bg-indigo-100 text-indigo-600'; }

        return `
            <div class="flex items-start gap-4 group">
                <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}">
                    <i data-lucide="${icon}" class="w-5 h-5"></i>
                </div>
                <div class="flex-grow min-w-0">
                    <h4 class="text-sm font-bold text-gray-900">${act.title}</h4>
                    <p class="text-xs text-gray-500 truncate">${act.description}</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">${act.time}</p>
                </div>
            </div>
        `;
    }).join('');

    if (list.innerHTML !== newHTML) {
        list.innerHTML = newHTML;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj || start === end) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerText = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerText = end;
        }
    };
    window.requestAnimationFrame(step);
}