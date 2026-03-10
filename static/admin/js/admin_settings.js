document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Slider Logic
    const slider = document.getElementById('commission-slider');
    const display = document.getElementById('commission-display');
    const estimated = document.getElementById('estimated-revenue');
    
    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        display.innerText = `${val}%`;
        // Mock calc: Base Volume (45000) * (Rate / 100)
        const mockRevenue = Math.floor(45000 * (val / 100));
        estimated.innerText = mockRevenue.toLocaleString();
    });

    // Category Logic
    document.getElementById('add-category-btn').addEventListener('click', addCategory);
    
    // Save Logic
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

let currentCategories = [];

async function loadSettings() {
    try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        
        if(data.success) {
            const settings = data.settings;
            
            // Commission
            document.getElementById('commission-slider').value = settings.commission_rate;
            document.getElementById('commission-display').innerText = `${settings.commission_rate}%`;
            const mockRevenue = Math.floor(45000 * (settings.commission_rate / 100));
            document.getElementById('estimated-revenue').innerText = mockRevenue.toLocaleString();

            // Categories
            currentCategories = settings.service_categories;
            renderCategories();

            // Maintenance
            document.getElementById('maintenance-toggle').checked = settings.maintenance_mode;
        }
    } catch(e) {
        console.error("Failed to load settings", e);
    }
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    container.innerHTML = '';
    
    currentCategories.forEach(cat => {
        const tag = document.createElement('div');
        tag.className = 'inline-flex items-center bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm border border-gray-600';
        tag.innerHTML = `
            ${cat}
            <button onclick="removeCategory('${cat}')" class="ml-2 text-gray-400 hover:text-red-400 focus:outline-none">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;
        container.appendChild(tag);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.removeCategory = function(cat) {
    currentCategories = currentCategories.filter(c => c !== cat);
    renderCategories();
};

function addCategory() {
    const input = document.getElementById('new-category-input');
    const val = input.value.trim();
    if (val && !currentCategories.includes(val)) {
        currentCategories.push(val);
        renderCategories();
        input.value = '';
    }
}

async function saveSettings() {
    const btn = document.getElementById('save-settings-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 mr-2 animate-spin"></i> Saving...`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const payload = {
        commission_rate: document.getElementById('commission-slider').value,
        service_categories: currentCategories,
        maintenance_mode: document.getElementById('maintenance-toggle').checked
    };

    try {
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if(data.success) {
            alert("System configuration updated successfully.");
        } else {
            alert("Failed to save settings.");
        }
    } catch(e) {
        alert("Error connecting to server.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}