/**
 * CityLink Frontend Logic - Upgrade 2.1
 * Search, Suggestions, Auth, Premium Cards, Reviews & Booking
 */

// --- Global state elements ---
let searchButton, serviceInput, locationInput, resultsContainer, loadingMessage, errorMessage, noResultsMessage, authStatusContainer;
let quoteModal, quoteForm, requestQuoteBtn, closeQuoteModalBtn, submitQuoteBtn, quoteStatusMessage;

// --- New: Suggestion Elements ---
let suggestionsBox, suggestionsList;

const API_URL = '/api/search';
const REVIEWS_API_URL = '/api/business/reviews';
const BOOKING_API_URL = '/api/booking/create';
const RENDER_TIMEOUT = 500; 
const MOCK_PUBLIC_DATA_KEY = 'MOCK_PUBLIC_BUSINESS_DATA';

// List of keywords for Autocomplete
const SUGGESTION_KEYWORDS = [
    "Plumber", "Electrician", "Healthcare", "Restaurant", "Locksmith", "Gardening", "Fashion", "Drone Repair",
    "Doctor", "Cafe", "Food", "Shopping", "Repairs", "Cleaning", "Maintenance", "Salon", "Gym", "Tutor"
];

// --- Helper Functions ---
function getPublicBusinessData() {
    try { return JSON.parse(localStorage.getItem(MOCK_PUBLIC_DATA_KEY)) || []; } catch (e) { return []; }
}

function getActiveUser() {
    try {
        const user = JSON.parse(localStorage.getItem('citylinkUser'));
        return (user && user.userId) ? user : null;
    } catch (e) { return null; }
}

// --- Service Card Generator (Premium) ---
function createServiceCard(service) {
    const generateStars = (rating) => {
        return `<div class="flex items-center text-yellow-400 text-xs font-bold"><i data-lucide="star" class="w-3 h-3 fill-current mr-1"></i> ${rating}</div>`;
    };
    
    const publicData = getPublicBusinessData();
    let displayService = { ...service }; 
    const dynamicRecord = publicData.find(d => d.serviceId === service.id);
    if (dynamicRecord) {
        displayService.name = dynamicRecord.name;
        displayService.provider_name = dynamicRecord.name;
        displayService.specialty = dynamicRecord.location || "Local Service Provider"; 
    }
    
    const categoryColor = {
        'Plumber': 'bg-blue-50 text-blue-600', 'Electrician': 'bg-yellow-50 text-yellow-700',
        'Restaurant': 'bg-orange-50 text-orange-600', 'Healthcare': 'bg-green-50 text-green-700',
        'Locksmith': 'bg-purple-50 text-purple-700', 'Fashion': 'bg-pink-50 text-pink-700',
        'Other': 'bg-gray-50 text-gray-600', 'All': 'bg-gray-50 text-gray-600'
    };
    const badgeClass = categoryColor[displayService.category] || categoryColor['Other'];
    
    const imgColorMap = { 'Plumber': '007bff', 'Electrician': 'fbbf24', 'Healthcare': '10b981' };
    const imgColor = imgColorMap[displayService.category] || '6366f1';
    const imageUrl = `https://placehold.co/400x300/${imgColor}/ffffff?text=${encodeURIComponent(displayService.category)}`;
    const profileUrl = `/profile/${service.id}`;

    return `
        <div class="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
            <div class="relative h-48 overflow-hidden">
                <a href="${profileUrl}">
                    <img src="${imageUrl}" alt="${displayService.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.onerror=null;this.src='${imageUrl}';">
                </a>
                <span class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg text-gray-800 shadow-sm">${displayService.priceRange}</span>
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <div class="flex justify-between items-start mb-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass} uppercase tracking-wide">${displayService.category}</span>
                    ${generateStars(displayService.rating)}
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors"><a href="${profileUrl}">${displayService.name}</a></h3>
                <p class="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">${displayService.specialty}</p>
                <div class="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                    <div class="flex items-center text-xs text-gray-500"><i data-lucide="map-pin" class="w-3 h-3 mr-1"></i> ${displayService.distance}</div>
                    ${displayService.isVerified ? `<span class="text-green-600 text-xs font-bold flex items-center"><i data-lucide="check-circle" class="w-3 h-3 mr-1"></i> Verified</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// --- Profile Reviews Logic ---
async function loadProfileReviews() {
    const container = document.getElementById('reviews-list-container');
    const dataContainer = document.getElementById('service-data-container');
    if (!container || !dataContainer) return; 
    
    const serviceId = dataContainer.dataset.serviceId;
    try {
        const response = await fetch(`${REVIEWS_API_URL}?serviceId=${serviceId}`);
        const data = await response.json();
        
        if (data.success && data.reviews.length > 0) {
            container.innerHTML = data.reviews.map(review => `
                <div class="border-b border-gray-100 last:border-0 pb-6 last:pb-0 mb-6 last:mb-0">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                ${review.customer_name.charAt(0)}
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-900">${review.customer_name}</h4>
                                <p class="text-xs text-gray-500">${new Date(review.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="flex items-center bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                            <i data-lucide="star" class="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1"></i>
                            <span class="text-xs font-bold text-gray-800">${review.rating}</span>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm leading-relaxed">"${review.comment}"</p>
                    ${review.vouched_skills && review.vouched_skills.length > 0 ? `
                        <div class="mt-3 flex flex-wrap gap-2">
                            ${review.vouched_skills.map(skill => `
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                                    <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i> ${skill}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
            const countEl = document.getElementById('review-count-main');
            if(countEl) countEl.innerText = data.reviews.length;
        } else {
            container.innerHTML = `<div class="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p class="text-gray-500 text-sm">No reviews yet.</p></div>`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        console.error("Failed to load reviews:", error);
    }
}

// --- Quote Logic ---
function openQuoteModal() {
    const user = getActiveUser();
    if (!user) { alert("Please log in to request a quote."); window.location.href = '/login'; return; }
    if (user.type !== 'Resident') { alert("Only Resident accounts can request quotes."); return; }
    if (quoteModal) quoteModal.classList.remove('hidden');
}

function closeQuoteModal() { 
    if (quoteModal) {
        quoteModal.classList.add('hidden');
        if (quoteStatusMessage) quoteStatusMessage.classList.add('hidden');
        if (quoteForm) quoteForm.reset();
        if (submitQuoteBtn) { submitQuoteBtn.disabled = false; submitQuoteBtn.textContent = 'Send Request'; }
    } 
}

function displayQuoteStatus(message, isError) {
    if (!quoteStatusMessage) return;
    quoteStatusMessage.textContent = message;
    quoteStatusMessage.classList.remove('hidden', 'bg-red-50', 'text-red-800', 'bg-green-50', 'text-green-800');
    quoteStatusMessage.classList.add(isError ? 'bg-red-50' : 'bg-green-50', isError ? 'text-red-800' : 'text-green-800');
    quoteStatusMessage.classList.remove('hidden');
}

async function handleQuoteRequest(event) {
    event.preventDefault();
    if (!submitQuoteBtn) return;
    
    submitQuoteBtn.textContent = 'Sending...';
    submitQuoteBtn.disabled = true;
    
    const user = getActiveUser();
    const serviceDataEl = document.getElementById('service-data-container');
    if (!serviceDataEl) {
        displayQuoteStatus("Error: Service ID not found.", true);
        return;
    }
    
    const serviceId = serviceDataEl.dataset.serviceId;
    const description = document.getElementById('job-description').value;
    const preferredTime = document.getElementById('preferred-time').value;

    try {
        const response = await fetch(BOOKING_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: parseInt(serviceId, 10),
                customer_name: user.name, 
                customer_id: user.userId,
                description: description,
                preferred_time: preferredTime
            })
        });

        const data = await response.json();
        if (data.success) {
            displayQuoteStatus("Request Sent! Redirecting...", false);
            setTimeout(() => {
                window.location.href = `/chat/booking/${data.booking.booking_id}`;
            }, 1000);
        } else {
            throw new Error(data.error || 'Failed to submit request.');
        }
    } catch (error) {
        console.error("Quote request failed:", error);
        displayQuoteStatus(error.message, true);
        submitQuoteBtn.textContent = 'Send Request';
        submitQuoteBtn.disabled = false;
    }
}

// --- Search Logic (Updated for Auto-Scroll) ---
async function fetchAndRenderServices() {
    if (!resultsContainer) return;
    const serviceQuery = serviceInput.value.trim(); 
    const locationQuery = locationInput.value.trim() || 'Nizamabad'; 
    
    // --- UX: Auto-Scroll to Results ---
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    resultsContainer.innerHTML = '';
    loadingMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    noResultsMessage.classList.add('hidden');
    if (searchButton) searchButton.disabled = true;
    
    try {
        const url = `${API_URL}?service=${encodeURIComponent(serviceQuery)}&location=${encodeURIComponent(locationQuery)}`;
        await new Promise(resolve => setTimeout(resolve, RENDER_TIMEOUT)); 
        const response = await fetch(url);
        const data = await response.json();
        
        resultsContainer.innerHTML = ''; 
        if (data.results && data.results.length > 0) {
            data.results.forEach(service => resultsContainer.innerHTML += createServiceCard(service));
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            noResultsMessage.classList.remove('hidden');
        }
    } catch (error) {
        errorMessage.textContent = 'Connection error.';
        errorMessage.classList.remove('hidden');
    } finally {
        loadingMessage.classList.add('hidden');
        if (searchButton) searchButton.disabled = false;
        // Close suggestions if open
        if(suggestionsBox) suggestionsBox.classList.add('hidden');
    }
}

// --- Suggestion Logic ---
function setupSuggestions() {
    if (!serviceInput || !suggestionsBox || !suggestionsList) return;

    serviceInput.addEventListener('input', function() {
        const val = this.value.toLowerCase();
        if (!val) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        const matches = SUGGESTION_KEYWORDS.filter(k => k.toLowerCase().includes(val));
        
        if (matches.length > 0) {
            suggestionsList.innerHTML = matches.map(item => `
                <li class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-gray-700 text-sm font-medium transition" 
                    onclick="selectSuggestion('${item}')">
                    ${item}
                </li>
            `).join('');
            suggestionsBox.classList.remove('hidden');
        } else {
            suggestionsBox.classList.add('hidden');
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!serviceInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });
}

window.selectSuggestion = function(value) {
    if(serviceInput) {
        serviceInput.value = value;
        suggestionsBox.classList.add('hidden');
        fetchAndRenderServices(); // Trigger Search immediately
    }
};

// --- Auth & Init Logic ---
function handleLogout() {
    localStorage.removeItem('citylinkUser');
    window.location.href = '/login';
}

function updateAuthUI() {
    if (!authStatusContainer) return;
    authStatusContainer.classList.remove('hidden');
    const user = getActiveUser(); 
    
    if (user) {
        const dashboardUrl = user.type === 'Business' ? '/business/dashboard' : '/dashboard';
        authStatusContainer.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-600 hidden md:block">Hi, ${user.name.split(' ')[0]}</span>
                <a href="${dashboardUrl}" class="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Dashboard"><i data-lucide="layout-dashboard" class="w-5 h-5"></i></a>
                <button id="logout-btn-header" class="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Log Out"><i data-lucide="log-out" class="w-5 h-5"></i></button>
            </div>
        `;
        document.getElementById('logout-btn-header').addEventListener('click', handleLogout);
    } else {
        authStatusContainer.innerHTML = `<a href="/login" class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-4 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all">Sign In</a>`;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function init() {
    // Assign elements
    searchButton = document.getElementById('search-button');
    serviceInput = document.getElementById('service-input');
    locationInput = document.getElementById('location-input');
    resultsContainer = document.getElementById('results-container');
    loadingMessage = document.getElementById('loading-message');
    errorMessage = document.getElementById('error-message');
    noResultsMessage = document.getElementById('no-results');
    authStatusContainer = document.getElementById('auth-status');
    
    // Suggestion Elements
    suggestionsBox = document.getElementById('suggestions-box');
    suggestionsList = document.getElementById('suggestions-list');
    
    // Quote Elements
    quoteModal = document.getElementById('quote-modal');
    quoteForm = document.getElementById('quote-form');
    requestQuoteBtn = document.getElementById('request-quote-btn');
    closeQuoteModalBtn = document.getElementById('close-quote-modal-btn');
    submitQuoteBtn = document.getElementById('submit-quote-btn');
    quoteStatusMessage = document.getElementById('quote-status-message');

    updateAuthUI();
    setupSuggestions(); // NEW
    
    // Run profile logic if on profile page
    if (document.getElementById('service-data-container')) {
        loadProfileReviews();
    }

    // Search Listeners
    if (searchButton && serviceInput) {
        searchButton.addEventListener('click', fetchAndRenderServices);
        serviceInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchAndRenderServices(); });
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if(serviceInput) {
                    serviceInput.value = this.getAttribute('data-category') === 'All' ? '' : this.getAttribute('data-category');
                    fetchAndRenderServices();
                }
            });
        });
    }

    // Modal Listeners
    if (requestQuoteBtn) requestQuoteBtn.addEventListener('click', openQuoteModal);
    if (closeQuoteModalBtn) closeQuoteModalBtn.addEventListener('click', closeQuoteModal);
    
    // CRITICAL FIX: Attach Submit Listener for Quote Form
    if (quoteForm) {
        quoteForm.addEventListener('submit', handleQuoteRequest);
    }
}

document.addEventListener('DOMContentLoaded', init);