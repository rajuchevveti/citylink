/**
 * Business Dashboard Logic (Dynamic ID)
 */

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('citylinkUser'));
    
    // 1. Security Check
    if (!user || user.type !== 'Business' || !user.serviceId) {
        console.error("No valid business session found.");
        window.location.href = '/login';
        return;
    }

    // 2. Set Name
    if (document.getElementById('dashboard-user-name')) {
        document.getElementById('dashboard-user-name').innerText = user.name.split(' ')[0];
    }

    // 3. Start Data Fetching with Dynamic ID
    fetchDashboardData(user.serviceId);
    fetchRecentLeads(user.serviceId);

    // 4. Polling
    setInterval(() => {
        fetchDashboardData(user.serviceId);
    }, 5000);
});

async function fetchDashboardData(serviceId) {
    try {
        // Pass serviceId to the API
        const response = await fetch(`/api/business/analytics-data?serviceId=${serviceId}`);
        const data = await response.json();

        if (data.success) {
            // Revenue
            const revenueEl = document.getElementById('dash-revenue');
            if (revenueEl) {
                const currentVal = parseInt(revenueEl.innerText.replace(/,/g, '')) || 0;
                if (currentVal !== data.kpi.revenue) {
                    animateValue("dash-revenue", currentVal, data.kpi.revenue, 1000);
                }
            }

            // Active Jobs
            const jobsEl = document.getElementById('dash-active-jobs');
            if(jobsEl) jobsEl.innerText = data.kpi.jobs;

            // Rating
            const ratingEl = document.getElementById('dash-rating');
            if(ratingEl) ratingEl.innerText = data.kpi.rating;

            // Skills
            renderSkills(data.charts.skill_labels, data.charts.skill_counts);
        }
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
    }
}

async function fetchRecentLeads(serviceId) {
    try {
        const response = await fetch(`/api/business/leads?serviceId=${serviceId}`);
        const data = await response.json();
        const list = document.getElementById('dash-leads-list');
        
        if (!list) return;

        if (data.success && data.leads.length > 0) {
            const newHTML = data.leads.slice(0, 4).map(lead => `
                <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer" onclick="window.location.href='/chat/booking/${lead.booking_id}'">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">
                            ${lead.customer_name.charAt(0)}
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-gray-900 text-sm truncate">${lead.customer_name}</p>
                            <p class="text-xs text-gray-500 truncate w-40 sm:w-auto">${lead.description}</p>
                        </div>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">${lead.status}</span>
                </div>
            `).join('');
            
            // Simple check to avoid repainting if identical
            if(list.innerHTML.length !== newHTML.length) list.innerHTML = newHTML;
            
        } else {
            list.innerHTML = '<div class="p-8 text-center text-gray-400 italic text-sm">No active inquiries yet.</div>';
        }
    } catch (e) {
        console.error(e);
    }
}

// ... (Keep renderSkills and animateValue functions from before) ...
function renderSkills(labels, counts) {
    const container = document.getElementById('dash-skills-container');
    if (!container) return;
    if (!labels || labels.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm italic text-center py-4">No skills vouched yet.</p>';
        return;
    }
    // Only update if changed logic omitted for brevity, simpler to overwrite for demo
    container.innerHTML = labels.map((label, index) => {
        const count = counts[index];
        const max = Math.max(...counts);
        const percent = (count / max) * 100;
        return `
            <div>
                <div class="flex justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>${label}</span><span class="text-indigo-600">${count}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5">
                    <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj || start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = end;
    };
    window.requestAnimationFrame(step);
}