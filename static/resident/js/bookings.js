/**
 * Resident Bookings & Review Logic (Premium UI + Dispute Handling)
 */

document.addEventListener('DOMContentLoaded', () => {
    loadBookings();
    setupReviewModal();
});

const API_BOOKINGS_URL = '/api/resident/my-bookings';
const API_REVIEW_URL = '/api/review/create';
const API_REPORT_URL = '/api/booking/report';

// --- Core Data Loading ---
async function loadBookings() {
    const user = JSON.parse(localStorage.getItem('citylinkUser'));
    if (!user) { window.location.href = '/login'; return; }

    const upcomingList = document.getElementById('upcoming-bookings-list');
    const historyList = document.getElementById('past-history-list');
    const upcomingLoader = document.getElementById('upcoming-loading');
    const historyLoader = document.getElementById('history-loading');
    const upcomingEmpty = document.getElementById('upcoming-empty');
    const historyEmpty = document.getElementById('history-empty');

    try {
        const response = await fetch(`${API_BOOKINGS_URL}?customerId=${user.userId}`);
        const data = await response.json();

        if(upcomingLoader) upcomingLoader.classList.add('hidden');
        if(historyLoader) historyLoader.classList.add('hidden');

        if (data.success && data.bookings.length > 0) {
            const upcoming = [];
            const history = [];
            data.bookings.forEach(b => {
                if (['Completed', 'Cancelled', 'Declined', 'Disputed', 'Refunded'].includes(b.status)) { history.push(b); } 
                else { upcoming.push(b); }
            });

            // Render Upcoming
            if (upcoming.length > 0) {
                upcomingList.innerHTML = upcoming.map(b => createUpcomingCard(b)).join('');
                if(upcomingEmpty) upcomingEmpty.classList.add('hidden');
            } else {
                upcomingList.innerHTML = '';
                if(upcomingEmpty) upcomingEmpty.classList.remove('hidden');
            }

            // Render History
            if (history.length > 0) {
                historyList.innerHTML = history.map(b => createHistoryRow(b)).join('');
                if(historyEmpty) historyEmpty.classList.add('hidden');
            } else {
                historyList.innerHTML = '';
                if(historyEmpty) historyEmpty.classList.remove('hidden');
            }
        } else {
            if(upcomingEmpty) upcomingEmpty.classList.remove('hidden');
            if(historyEmpty) historyEmpty.classList.remove('hidden');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) { console.error(error); }
}

function createUpcomingCard(b) {
    let statusColor = 'bg-gray-100 text-gray-600';
    if (b.status === 'Booked') statusColor = 'bg-green-100 text-green-700';
    else if (b.status === 'Quoted') statusColor = 'bg-yellow-100 text-yellow-700';
    else if (b.status === 'Awaiting Quote') statusColor = 'bg-blue-100 text-blue-700';

    const priceDisplay = b.quote_amount ? `<span class="font-bold text-indigo-600">₹${b.quote_amount}</span>` : `<span class="text-gray-400 italic">Pending</span>`;

    return `
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between h-full group">
            <div>
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">${b.provider_name.charAt(0)}</div>
                        <div><h3 class="font-bold text-gray-900">${b.provider_name}</h3><p class="text-xs text-gray-500">#${b.booking_id.slice(-6)}</p></div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColor}">${b.status}</span>
                </div>
                <div class="space-y-3 mb-6 pl-1">
                    <p class="text-sm text-gray-600 line-clamp-2 italic">"${b.description}"</p>
                    <div class="flex justify-between text-sm pt-2 border-t border-gray-50">
                        <span class="text-gray-500">${b.preferred_time}</span>
                        ${priceDisplay}
                    </div>
                </div>
            </div>
            <div class="pt-4 border-t border-gray-50">
                <a href="/chat/booking/${b.booking_id}" class="w-full flex items-center justify-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm">Chat & Manage</a>
            </div>
        </div>
    `;
}

function createHistoryRow(b) {
    let actionArea = '';
    let statusBadge = `<span class="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">${b.status}</span>`;

    if (b.status === 'Completed') {
        if (!b.reviewed) {
            actionArea = `
                <div class="flex items-center gap-2">
                    <button onclick="openReviewModal('${b.booking_id}', '${b.service_id}')" class="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition">Review</button>
                    <button onclick="reportIssue('${b.booking_id}')" class="px-3 py-2 text-red-500 hover:text-red-700 border border-transparent hover:border-red-100 rounded-lg transition text-xs font-bold">Report</button>
                </div>`;
        } else {
            actionArea = `
                <div class="flex items-center gap-3">
                     <span class="text-xs font-bold text-green-600 flex items-center"><i data-lucide="check" class="w-3 h-3 mr-1"></i> Reviewed</span>
                     <button onclick="reportIssue('${b.booking_id}')" class="text-xs text-red-400 hover:text-red-600 hover:underline font-medium">Report Issue</button>
                </div>`;
        }
    } else if (b.status === 'Disputed') {
        statusBadge = `<span class="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">Dispute Open</span>`;
        actionArea = `<span class="text-xs text-gray-400 italic">Under Review</span>`;
    } else if (b.status === 'Refunded') {
        statusBadge = `<span class="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold border border-red-200">Refunded</span>`;
        actionArea = `<span class="text-xs text-green-600 font-bold">Money Returned</span>`;
    }

    return `
        <div class="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-gray-50 transition">
            <div class="flex items-center gap-4 w-full sm:w-auto">
                <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"><i data-lucide="archive" class="w-5 h-5"></i></div>
                <div>
                    <h4 class="font-bold text-gray-900">${b.provider_name}</h4>
                    <p class="text-xs text-gray-500 flex items-center gap-2"><span>${new Date(b.timestamp).toLocaleDateString()}</span><span>•</span><span>₹${b.quote_amount || 0}</span></p>
                </div>
            </div>
            <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">${statusBadge} ${actionArea}</div>
        </div>
    `;
}

// --- Actions ---
window.reportIssue = async function(bookingId) {
    const reason = prompt("Please describe the issue to alert Admin:");
    if(!reason) return;
    try {
        const res = await fetch(API_REPORT_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ booking_id: bookingId, issue: reason }) });
        if((await res.json()).success) { alert("Issue Reported. Admin notified."); loadBookings(); }
    } catch(e) { alert("Connection error."); }
};

window.openReviewModal = function(bookingId, serviceId) {
    const modal = document.getElementById('review-modal');
    if(!modal) return;
    document.getElementById('review-booking-id').value = bookingId;
    document.getElementById('review-service-id').value = serviceId;
    // Reset form
    const stars = document.querySelectorAll('.star');
    stars.forEach(s => { s.classList.remove('fill-yellow-400', 'text-yellow-400'); s.classList.add('text-gray-300'); });
    document.getElementById('review-comment').value = '';
    document.querySelectorAll('input[name="vouch_skill"]').forEach(cb => cb.checked = false);
    modal.classList.remove('hidden');
};

function setupReviewModal() {
    const modal = document.getElementById('review-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('review-form');
    const starContainer = document.getElementById('star-rating-input');

    if(!modal) return;
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // Star Logic
    if (starContainer) {
        starContainer.addEventListener('click', function(e) {
            const star = e.target.closest('[data-rating]');
            if (star) {
                const rating = parseInt(star.dataset.rating);
                const stars = starContainer.querySelectorAll('[data-rating]');
                stars.forEach(s => {
                    const val = parseInt(s.dataset.rating);
                    if (val <= rating) { s.classList.remove('text-gray-300'); s.classList.add('fill-yellow-400', 'text-yellow-400'); }
                    else { s.classList.add('text-gray-300'); s.classList.remove('fill-yellow-400', 'text-yellow-400'); }
                });
                // Store rating in hidden input or global var. For simplicity, using global.
                window.currentReviewRating = rating;
            }
        });
    }

    // Submit
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!window.currentReviewRating) { alert("Select star rating."); return; }

            const bookingId = document.getElementById('review-booking-id').value;
            const serviceId = document.getElementById('review-service-id').value;
            const comment = document.getElementById('review-comment').value;
            const skills = Array.from(document.querySelectorAll('input[name="vouch_skill"]:checked')).map(cb => cb.value);
            const user = JSON.parse(localStorage.getItem('citylinkUser'));

            try {
                const res = await fetch(API_REVIEW_URL, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        booking_id: bookingId, service_id: parseInt(serviceId), rating: window.currentReviewRating,
                        comment: comment, customer_name: user.name, vouched_skills: skills
                    })
                });
                if((await res.json()).success) { alert("Review Sent!"); modal.classList.add('hidden'); loadBookings(); }
            } catch(err) { alert("Error sending review."); }
        });
    }
}