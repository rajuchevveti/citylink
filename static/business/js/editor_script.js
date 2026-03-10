/**
 * Business Service Editor Logic (Dynamic ID)
 * Allows the logged-in provider to Add/Delete their own services.
 */

document.addEventListener('DOMContentLoaded', function() {
    loadServices();

    // Modal Logic
    const modal = document.getElementById('add-service-modal');
    const openBtn = document.getElementById('add-service-btn');
    const closeBtn = document.getElementById('close-add-modal-btn');
    const form = document.getElementById('add-service-form');

    if(openBtn) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    if(closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('add-service-name').value;
            const price = document.getElementById('add-service-price').value;
            const user = JSON.parse(localStorage.getItem('citylinkUser'));

            if (!user || !user.serviceId) {
                showStatus("Error: No valid business session.", "error");
                return;
            }

            fetch('/api/business/service/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    serviceId: user.serviceId, // CRITICAL: Use logged-in ID
                    name: name, 
                    price: price 
                })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    showStatus("Service added!", "success");
                    modal.classList.add('hidden');
                    form.reset();
                    loadServices();
                } else { showStatus("Error: " + data.error, "error"); }
            })
            .catch(err => console.error(err));
        });
    }
});

function loadServices() {
    const container = document.getElementById('current-service-cards');
    const user = JSON.parse(localStorage.getItem('citylinkUser'));
    
    if (!user || !user.serviceId) {
        container.innerHTML = '<p class="text-red-500 text-sm">Please log in as a business.</p>';
        return;
    }

    fetch(`/api/business/service/list?serviceId=${user.serviceId}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = '';
            if (data.success && data.fixed_services.length > 0) {
                data.fixed_services.forEach(service => {
                    container.innerHTML += `
                        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                            <div>
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-bold text-gray-800 text-lg">${service.name}</h4>
                                    <span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Fixed</span>
                                </div>
                                <p class="text-2xl font-bold text-indigo-600">€${service.price}</p>
                            </div>
                            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                <button onclick="deleteService('${service.name}')" class="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center">
                                    <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i> Delete
                                </button>
                            </div>
                        </div>
                    `;
                });
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                container.innerHTML = '<p class="text-gray-500 italic col-span-3 text-center">No fixed services yet. Add one!</p>';
            }
        })
        .catch(err => console.error("Failed to load services", err));
}

window.deleteService = function(serviceName) {
    if(!confirm(`Remove "${serviceName}"?`)) return;
    const user = JSON.parse(localStorage.getItem('citylinkUser'));

    fetch('/api/business/service/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: user.serviceId, name: serviceName })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) { showStatus("Deleted.", "success"); loadServices(); }
        else { showStatus("Error deleting.", "error"); }
    });
};

function showStatus(msg, type) {
    const el = document.getElementById('editor-status-message');
    el.innerText = msg;
    el.className = type === "success" ? "p-3 mb-4 rounded-lg text-sm font-semibold text-center bg-green-100 text-green-700 block" : "p-3 mb-4 rounded-lg text-sm font-semibold text-center bg-red-100 text-red-700 block";
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}