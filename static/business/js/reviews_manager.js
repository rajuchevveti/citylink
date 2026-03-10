/**
 * Business Reviews Management Logic
 * Fetches live reviews from the API and renders them dynamically.
 */

// --- Global State ---
let businessServiceId = null;

// --- DOM References ---
const reviewsContainer = document.getElementById('reviews-list-container');
const loadingReviews = document.getElementById('reviews-loading');
const noReviewsMessage = document.getElementById('no-reviews-message');

// --- Helper Functions ---

function getActiveBusinessUser() {
    try {
        const user = JSON.parse(localStorage.getItem('citylinkUser'));
        if (user && user.type === 'Business') {
            return user;
        }
    } catch (e) {
        console.error("Could not parse user session.");
    }
    return null;
}

/**
 * Generates the star rating HTML for a given rating number.
 * @param {number} rating - The rating (e.g., 4.5)
 */
function generateStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1"></i>`;
    }
    // Half star
    if (hasHalfStar) {
        starsHtml += `<i data-lucide="star-half" class="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1"></i>`;
    }
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += `<i data-lucide="star" class="w-4 h-4 text-gray-300 mr-1"></i>`;
    }
    return starsHtml;
}


/**
 * Creates the HTML for a single review card.
 * @param {object} review - The review object from the API.
 */
function createReviewCard(review) {
    const reviewDate = new Date(review.timestamp);
    const dateString = reviewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let borderColor = 'border-gray-200';
    if (review.rating >= 4) {
        borderColor = 'border-green-200';
    } else if (review.rating <= 2) {
        borderColor = 'border-red-200';
    }

    return `
        <div class="bg-gray-50 p-6 rounded-xl border ${borderColor} shadow-sm flex flex-col justify-between">
            <div>
                <div class="flex items-center space-x-3 mb-3">
                    <img src="https://placehold.co/40x40/4f46e5/ffffff?text=${review.customer_name.charAt(0)}" class="w-10 h-10 rounded-full" alt="Customer Avatar">
                    <div>
                        <p class="font-semibold text-gray-900">${review.customer_name}</p>
                        <p class="text-xs text-gray-500">Reviewed on ${dateString}</p>
                    </div>
                </div>
                
                <div class="flex items-center text-yellow-500 mb-3">
                    ${generateStars(review.rating)}
                    <span class="text-sm font-semibold text-gray-800 ml-2">${review.rating}.0 Stars</span>
                </div>

                <p class="text-sm text-gray-700 leading-relaxed italic">
                    "${review.comment}"
                </p>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                <button class="text-sm font-semibold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 py-2 px-4 rounded-lg transition">
                    Publicly Reply
                </button>
                <button class="text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 py-2 px-4 rounded-lg transition">
                    Report
                </button>
            </div>
        </div>
    `;
}

/**
 * Fetches reviews from the API and renders them to the DOM.
 */
async function fetchAndRenderReviews(serviceId) {
    if (!serviceId) {
        loadingReviews.classList.add('hidden');
        noReviewsMessage.textContent = 'Error: Could not identify your business service ID.';
        noReviewsMessage.classList.remove('hidden');
        return;
    }
    
    try {
        const response = await fetch(`/api/business/reviews?serviceId=${serviceId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch reviews from server.');
        }
        
        const data = await response.json();
        
        if (data.success && data.reviews) {
            loadingReviews.classList.add('hidden');
            reviewsContainer.innerHTML = ''; // Clear
            
            if (data.reviews.length > 0) {
                data.reviews.forEach(review => {
                    reviewsContainer.innerHTML += createReviewCard(review);
                });
            } else {
                noReviewsMessage.classList.remove('hidden'); // Show "No reviews found"
            }
            
            // Re-render Lucide icons for the new cards
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

        } else {
            throw new Error(data.error || 'API returned failure');
        }

    } catch (error) {
        console.error("Error fetching reviews:", error);
        loadingReviews.classList.add('hidden');
        reviewsContainer.innerHTML = ''; // Clear
        noReviewsMessage.textContent = 'Error: Could not load reviews data.';
        noReviewsMessage.classList.remove('hidden');
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const businessUser = getActiveBusinessUser();
    
    if (businessUser && businessUser.serviceId) {
        businessServiceId = businessUser.serviceId;
        fetchAndRenderReviews(businessServiceId);
    } else {
        console.error("No valid business user session found.");
        if (!businessUser) {
             window.location.href = '/login';
        } else {
            // User is logged in, but has no serviceId (data error)
            loadingReviews.classList.add('hidden');
            noReviewsMessage.textContent = 'Error: Your account is not linked to a service ID.';
            noReviewsMessage.classList.remove('hidden');
        }
    }
});