document.addEventListener('DOMContentLoaded', () => {
    loadProviders();
});

async function loadProviders() {
    const tbody = document.getElementById('providers-table-body');
    
    try {
        const response = await fetch('/api/admin/providers');
        const data = await response.json();

        if (data.success) {
            renderTable(data.providers);
        }
    } catch (error) {
        console.error("Admin load failed:", error);
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load data.</td></tr>`;
    }
}

function renderTable(providers) {
    const tbody = document.getElementById('providers-table-body');
    tbody.innerHTML = '';

    if (providers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center italic">No providers found.</td></tr>`;
        return;
    }

    providers.forEach(p => {
        // Status Badge Logic
        let statusBadge = '';
        let actionButton = '';

        if (p.isVerified) {
            statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/50">
                             <i data-lucide="shield-check" class="w-3 h-3 mr-1"></i> Verified
                           </span>`;
            actionButton = `<button onclick="toggleVerification(${p.id}, 'revoke')" class="text-xs font-bold text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/20 px-3 py-1.5 rounded transition">Revoke</button>`;
        } else {
            statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-500 border border-yellow-700/50">
                             <i data-lucide="clock" class="w-3 h-3 mr-1"></i> Pending
                           </span>`;
            actionButton = `<button onclick="toggleVerification(${p.id}, 'verify')" class="text-xs font-bold text-green-400 hover:text-green-300 border border-green-900/50 bg-green-900/20 px-3 py-1.5 rounded transition">Verify</button>`;
        }

        const row = `
            <tr class="hover:bg-gray-700/30 transition">
                <td class="px-6 py-4 text-gray-500">#${p.id}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold mr-3 text-xs">
                            ${p.name.charAt(0)}
                        </div>
                        <span class="font-medium text-white">${p.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="bg-gray-700 text-gray-300 py-1 px-2 rounded text-xs">${p.category}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center text-yellow-500 text-xs">
                        <i data-lucide="star" class="w-3 h-3 fill-current mr-1"></i> ${p.rating} 
                        <span class="text-gray-500 ml-1">(${p.reviews})</span>
                    </div>
                </td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right space-x-2">
                    ${actionButton}
                    <button class="text-gray-500 hover:text-white transition"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function toggleVerification(serviceId, action) {
    if(!confirm(`Are you sure you want to ${action} this provider?`)) return;

    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ service_id: serviceId, action: action })
        });
        
        const data = await response.json();
        if(data.success) {
            // Refresh table to show new status
            loadProviders();
        } else {
            alert("Failed to update status.");
        }
    } catch(e) {
        console.error(e);
        alert("Error connecting to server.");
    }
}