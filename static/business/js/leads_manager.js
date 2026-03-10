/**
 * Business Leads & Inbox Logic (Unified View)
 */

document.addEventListener('DOMContentLoaded', () => {
    loadLeads();
    setInterval(loadLeads, 5000);
});

async function loadLeads() {
    const loadingEl = document.getElementById('leads-loading');
    const contentEl = document.getElementById('leads-content');
    if (!loadingEl || !contentEl) return;

    try {
        const user = JSON.parse(localStorage.getItem('citylinkUser'));
        if (!user || user.type !== 'Business' || !user.serviceId) {
            loadingEl.innerHTML = "<p class='text-red-500'>Error: User identity not linked to a service.</p>";
            return;
        }

        const response = await fetch(`/api/business/leads?serviceId=${user.serviceId}`);
        const data = await response.json();

        if (data.success) {
            renderInbox(data.leads);
            loadingEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Error loading leads:", error);
    }
}

function renderInbox(leads) {
    const listNew = document.getElementById('list-new-requests');
    const listActive = document.getElementById('list-active-chats');
    const emptyActive = document.getElementById('empty-active');
    
    if (listNew) listNew.innerHTML = '';
    if (listActive) listActive.innerHTML = '';
    
    let newCount = 0;
    let activeCount = 0;

    leads.forEach(lead => {
        const timeAgo = new Date(lead.timestamp).toLocaleDateString();
        
        // CATEGORY 1: New Requests
        if (['New', 'Awaiting Quote', 'Pending Approval'].includes(lead.status)) {
            newCount++;
            if (listNew) {
                listNew.innerHTML += `
                    <div onclick="window.location.href='/chat/booking/${lead.booking_id}'" 
                         class="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md cursor-pointer transition group border-l-4 border-l-indigo-500 relative overflow-hidden">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-gray-900 group-hover:text-indigo-600">${lead.customer_name}</h3>
                            <span class="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase">New Request</span>
                        </div>
                        <p class="text-sm text-gray-600 line-clamp-2 mb-3">"${lead.description}"</p>
                        <div class="flex items-center justify-between text-xs text-gray-400">
                            <span><i data-lucide="clock" class="w-3 h-3 inline mr-1"></i> ${timeAgo}</span>
                            <span class="text-indigo-600 font-semibold group-hover:underline flex items-center">
                                Reply <i data-lucide="arrow-right" class="w-3 h-3 ml-1"></i>
                            </span>
                        </div>
                    </div>
                `;
            }
        } 
        // CATEGORY 2: Active/Booked Chats
        else {
            activeCount++;
            let statusColor = 'bg-gray-100 text-gray-600';
            if (lead.status === 'Booked') statusColor = 'bg-green-100 text-green-700';
            if (lead.status === 'Quoted') statusColor = 'bg-yellow-100 text-yellow-700';
            
            if (listActive) {
                listActive.innerHTML += `
                    <div onclick="window.location.href='/chat/booking/${lead.booking_id}'" 
                         class="p-4 hover:bg-gray-50 cursor-pointer transition flex items-center gap-4 group">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg border border-white shadow-sm">
                            ${lead.customer_name.charAt(0)}
                        </div>
                        <div class="flex-grow min-w-0">
                            <div class="flex justify-between items-center mb-1">
                                <h4 class="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">${lead.customer_name}</h4>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}">${lead.status}</span>
                            </div>
                            <p class="text-sm text-gray-500 truncate flex items-center">
                                <i data-lucide="message-square" class="w-3 h-3 mr-1 opacity-50"></i> ${lead.description}
                            </p>
                        </div>
                        <div class="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                             <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
                        </div>
                    </div>
                `;
            }
        }
    });

    const countNewEl = document.getElementById('count-new');
    const countActiveEl = document.getElementById('count-active');
    if (countNewEl) countNewEl.innerText = newCount;
    if (countActiveEl) countActiveEl.innerText = activeCount;

    if (emptyActive) {
        if (activeCount === 0) emptyActive.classList.remove('hidden');
        else emptyActive.classList.add('hidden');
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}