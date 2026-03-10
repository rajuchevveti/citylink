/**
 * Business Analytics Logic - Robust Version
 */

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('citylinkUser'));
    
    if (user && user.serviceId) {
        console.log("Fetching analytics for Service ID:", user.serviceId);
        fetchAnalyticsData(user.serviceId);
    } else {
        console.warn("No Service ID found, defaulting to demo view.");
        fetchAnalyticsData(7); 
    }
});

let mainChartInstance = null;
let funnelChartInstance = null;

function fetchAnalyticsData(serviceId) {
    fetch(`/api/business/analytics-data?serviceId=${serviceId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Analytics Data Received:", data); // Debug Log

            if (data.success) {
                updateKPIs(data.kpi);
                renderCharts(data.charts);
                renderReviews(data.recent_reviews);
            }
        })
        .catch(err => console.error("Error loading analytics:", err));
}

function updateKPIs(kpi) {
    if(document.getElementById('kpi-inquiries')) animateValue("kpi-inquiries", 0, kpi.inquiries, 1000);
    if(document.getElementById('kpi-conversion')) animateValue("kpi-conversion", 0, kpi.conversion, 1000);
    if(document.getElementById('kpi-revenue')) animateValue("kpi-revenue", 0, kpi.revenue, 1000);
    
    if(document.getElementById('kpi-rating')) document.getElementById('kpi-rating').innerText = kpi.rating;
    if(document.getElementById('kpi-review-count')) document.getElementById('kpi-review-count').innerText = kpi.review_count;
}

function renderCharts(chartData) {
    // --- REVENUE CHART ---
    const ctxMain = document.getElementById('mainChart');
    if (ctxMain) {
        if (mainChartInstance) mainChartInstance.destroy();
        
        // Show chart if ANY data point > 0 OR if total > 0
        const hasRevenue = chartData.revenue_data.some(val => val > 0);
        
        if (!hasRevenue) {
            showChartEmptyState(ctxMain.parentElement, "No revenue data yet.");
        } else {
            // Remove empty state overlay if present
            const msg = ctxMain.parentElement.querySelector('.empty-state-msg');
            if(msg) msg.remove();
            ctxMain.style.display = 'block'; 
            
            mainChartInstance = new Chart(ctxMain.getContext('2d'), {
                type: 'line',
                data: {
                    labels: chartData.revenue_labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: chartData.revenue_data,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#4f46e5',
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // --- FUNNEL CHART ---
    const ctxFunnel = document.getElementById('funnelChart');
    if (ctxFunnel) {
        if (funnelChartInstance) funnelChartInstance.destroy();

        const totalLeads = chartData.funnel_data.reduce((a, b) => a + b, 0);
        
        // If empty, show a gray placeholder circle instead of nothing
        const dataValues = totalLeads === 0 ? [1] : chartData.funnel_data;
        const bgColors = totalLeads === 0 
            ? ['#f3f4f6'] 
            : ['#94a3b8', '#f59e0b', '#3b82f6', '#22c55e'];
        const labels = totalLeads === 0 ? ["No Data"] : chartData.funnel_labels;

        funnelChartInstance = new Chart(ctxFunnel.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: bgColors,
                    borderWidth: 0,
                    hoverOffset: totalLeads === 0 ? 0 : 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        display: totalLeads > 0, // Hide legend if empty
                        labels: { usePointStyle: true, padding: 20 }
                    },
                    tooltip: { enabled: totalLeads > 0 }
                }
            }
        });
    }
}

function showChartEmptyState(container, msg) {
    const canvas = container.querySelector('canvas');
    if(canvas) canvas.style.display = 'none';
    
    let msgDiv = container.querySelector('.empty-state-msg');
    if(!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.className = 'empty-state-msg flex flex-col items-center justify-center h-full text-gray-400 absolute inset-0';
        msgDiv.innerHTML = `
            <i data-lucide="bar-chart-2" class="w-10 h-10 mb-2 opacity-50"></i>
            <p class="text-sm">${msg}</p>
        `;
        container.appendChild(msgDiv);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    
    container.innerHTML = ''; 

    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <i data-lucide="message-square" class="w-8 h-8 mb-2 opacity-50"></i>
                <p class="text-sm">No reviews received yet.</p>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    reviews.forEach(review => {
        const isPositive = review.rating >= 4;
        const bgClass = isPositive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100';
        const textClass = isPositive ? 'text-green-700' : 'text-red-700';

        const html = `
            <div class="p-5 rounded-xl border ${bgClass} transition hover:shadow-sm bg-white">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-sm ${textClass}">${review.rating}.0</span>
                        <div class="flex text-yellow-400">
                             ${Array(review.rating).fill('<i data-lucide="star" class="w-3 h-3 fill-current"></i>').join('')}
                        </div>
                    </div>
                    <span class="text-[10px] text-gray-400 uppercase font-bold tracking-wider">${new Date(review.timestamp).toLocaleDateString()}</span>
                </div>
                <p class="text-sm text-gray-600 italic mb-3">"${review.comment}"</p>
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        ${review.customer_name.charAt(0)}
                    </div>
                    <span class="text-xs font-bold text-gray-700">${review.customer_name}</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const isFloat = obj.innerText.includes('.');
        const val = progress * (end - start) + start;
        obj.innerHTML = isFloat ? val.toFixed(1) : Math.floor(val);
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = end;
    };
    window.requestAnimationFrame(step);
}