from flask import Flask, jsonify, render_template, request, redirect, url_for
from flask_cors import CORS
import os
import datetime
from collections import defaultdict
import razorpay

# Initialize Flask App
app = Flask(__name__, template_folder='templates')
CORS(app) 

# --- CONFIGURATION ---
RAZORPAY_KEY_ID = "rzp_test_RImEZemljMIgyT"
RAZORPAY_KEY_SECRET = "uRMZQOFLZepmTgs2Mew4iJ0I"
ADMIN_ID = "admin"
ADMIN_PASSWORD = "admin@123"

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except:
    razorpay_client = None
    print("WARNING: Razorpay client could not be initialized.")

# --- GLOBAL SETTINGS ---
GLOBAL_SETTINGS = {
    "commission_rate": 10, 
    "service_categories": ["Plumber", "Electrician", "Healthcare", "Restaurant", "Locksmith", "Gardening", "Fashion", "Drone Repair"],
    "maintenance_mode": False
}

# --- LIVE DATABASES ---
LIVE_BOOKINGS = []
LIVE_REVIEWS = []
LIVE_FINANCE = []
LIVE_NOTIFICATIONS = []
LIVE_VOUCHES = defaultdict(lambda: defaultdict(int)) 

# --- MOCK SERVICES DATA ---
MOCK_SERVICES = [
    { "id": 1, "name": "Reliable Plumbing", "category": "Plumber", "rating": 4.8, "reviews": 154, "distance": "1.2 km", "priceRange": "$$", "isVerified": True, "specialty": "Leak Repair", "city": "Nizamabad", "provider_name": "Sparky's Plumbing", "portfolio": [], "fixed_services": [] },
    { "id": 2, "name": "Apex Electricians", "category": "Electrician", "rating": 4.5, "reviews": 88, "distance": "3.5 km", "priceRange": "$$$", "isVerified": True, "specialty": "Wiring", "city": "Nizamabad", "provider_name": "Demet Pctltile", "portfolio": [], "fixed_services": [] },
    { 
        "id": 3, "name": "City Tandoori", "category": "Restaurant", "rating": 4.2, "reviews": 301, "distance": "0.8 km", "priceRange": "$", "isVerified": False, "specialty": "North Indian", "city": "Nizamabad", "provider_name": "Urban Cafe",
        "portfolio": [{"url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop", "caption": "Dining Area"}], "fixed_services": [] 
    },
    { "id": 4, "name": "Dr. Priya", "category": "Healthcare", "rating": 4.9, "reviews": 55, "distance": "5.1 km", "priceRange": "$$$", "isVerified": True, "specialty": "Family Practice", "city": "Nizamabad", "provider_name": "Dr. Priya", "portfolio": [], "fixed_services": [] },
    { "id": 5, "name": "Quick Fix Locks", "category": "Locksmith", "rating": 4.7, "reviews": 12, "distance": "0.5 km", "priceRange": "$$", "isVerified": True, "specialty": "Key Cutting", "city": "Nizamabad", "provider_name": "Locksmith Fix", "portfolio": [], "fixed_services": [] },
    { "id": 6, "name": "Green Thumb", "category": "Gardening", "rating": 4.0, "reviews": 25, "distance": "7.0 km", "priceRange": "$$", "isVerified": False, "specialty": "Landscaping", "city": "Nizamabad", "provider_name": "Green Thumb", "portfolio": [], "fixed_services": [] },
    
    # --- DAVID (ID 7) ---
    { 
      "id": 7, 
      "name": "David's Master Plumbing Co.", 
      "category": "Plumber", 
      "rating": 5.0, 
      "reviews": 3, 
      "distance": "0.1 km", 
      "priceRange": "$$$", 
      "isVerified": True, 
      "specialty": "Emergency Water Heater Repair", 
      "city": "Nizamabad", 
      "provider_name": "David's Master Plumbing Co.",
      "fixed_services": [ { "name": "Drain Unclogging", "price": 75 }, { "name": "Faucet Installation", "price": 120 } ],
      "portfolio": [{"url": "https://plus.unsplash.com/premium_photo-1663013675008-bd5a78926d36?q=80&w=800&auto=format&fit=crop", "caption": "Kitchen Sink Setup"}]
    },
    
    # --- DRONE REPAIR (ID 8) ---
    { 
        "id": 8, "name": "SkyHigh Drone Tech", "category": "Drone Repair", "rating": 4.9, "reviews": 32, "distance": "4.5 km", "priceRange": "$$$", "isVerified": True, "specialty": "DJI Repairs", "city": "Nizamabad", "provider_name": "SkyHigh Tech",
        "portfolio": [ {"url": "https://images.unsplash.com/photo-1506947411487-a56738267384?q=80&w=800&auto=format&fit=crop", "caption": "Drone Motor Repair"} ],
        "fixed_services": []
    }
]

MOCK_BUSINESS_DATA = { "business_name": "Reliable Plumbing Services", "verified": True, "member_since": "2023", "total_earnings": 0, "active_listings": 3, "conversion_rate": 32, "avg_rating": 4.7 }

# --- HELPERS ---
def generate_simple_id(): return f"{int(datetime.datetime.now().timestamp())}_{os.urandom(2).hex()}"
def get_service_by_id(service_id):
    try: return next((s for s in MOCK_SERVICES if s["id"] == int(service_id)), None)
    except: return None
def get_booking_by_id(booking_id): return next((b for b in LIVE_BOOKINGS if b["booking_id"] == booking_id), None)

def add_notification(user_id, message, link="#", type="info"):
    LIVE_NOTIFICATIONS.append({
        "id": f"notif_{generate_simple_id()}", "user_id": str(user_id), "message": message, "link": link, "type": type, "read": False, "timestamp": datetime.datetime.now().isoformat()
    })
    print(f"--- NOTIFICATION TO {user_id}: {message} ---")

# --- DATA SEEDING ---
def seed_reviews():
    initial_reviews = [
        { "review_id": "rev_seed_1", "booking_id": "bk_seed_1", "service_id": 7, "rating": 5, "comment": "Professional job.", "customer_name": "Sarah J.", "timestamp": datetime.datetime.now().isoformat(), "vouched_skills": ["Punctuality", "Cleanliness"] }
    ]
    global LIVE_REVIEWS, LIVE_VOUCHES
    LIVE_REVIEWS.extend(initial_reviews)
    for r in initial_reviews:
        for skill in r['vouched_skills']: LIVE_VOUCHES[r['service_id']][skill] += 1
    
    if initial_reviews:
        MOCK_BUSINESS_DATA['avg_rating'] = 5.0
        srv = get_service_by_id(7)
        if srv: srv['rating'] = 5.0; srv['reviews'] = 1

seed_reviews()

# --- PAGE ROUTES ---
@app.route('/')
def index(): return render_template('resident/index.html')
@app.route('/login')
def login(): return render_template('resident/auth.html')
@app.route('/about') 
def about(): return render_template('resident/about.html')

# Resident Portal
@app.route('/dashboard') 
def dashboard(): return render_template('resident/dashboard.html', active_page='dashboard')
@app.route('/bookings') 
def bookings(): return render_template('resident/bookings.html', active_page='bookings')
@app.route('/resident/profile')
def resident_profile(): return render_template('resident/profile.html', active_page='profile')
@app.route('/resident/settings') 
def resident_settings(): return render_template('resident/settings.html', active_page='settings')

# Business Portal
@app.route('/business')
def business_portal_root(): return redirect(url_for('business_dashboard'))
@app.route('/business/dashboard') 
def business_dashboard(): return render_template('business/business_dashboard.html', active_page='dashboard', business_data=MOCK_BUSINESS_DATA)
@app.route('/business/myprofile') 
def business_myprofile(): return render_template('business/business_myprofile.html', active_page='myprofile', business_data=MOCK_BUSINESS_DATA)
@app.route('/business/leads') 
def business_leads(): return render_template('business/business_leads.html', active_page='leads', business_data=MOCK_BUSINESS_DATA)
@app.route('/business/editor') 
def business_editor(): return render_template('business/business_editor.html', active_page='editor', business_data=MOCK_BUSINESS_DATA)
@app.route('/business/reviews') 
def business_reviews(): return render_template('business/business_reviews.html', active_page='reviews', business_data=MOCK_BUSINESS_DATA)
@app.route('/business/settings') 
def business_settings(): return render_template('business/business_settings.html', active_page='settings', business_data=MOCK_BUSINESS_DATA)
@app.route('/business/analytics') 
def business_analytics(): return render_template('business/business_analytics.html', active_page='analytics', business_data=MOCK_BUSINESS_DATA)

# Admin Portal
@app.route('/admin')
def admin_redirect(): return redirect(url_for('admin_login'))
@app.route('/admin/login')
def admin_login(): return render_template('admin/login.html')
@app.route('/admin/dashboard')
def admin_dashboard():
    total_revenue = sum(t['platform_fee'] for t in LIVE_FINANCE)
    return render_template('admin/dashboard.html', revenue=total_revenue, jobs=len(LIVE_FINANCE), providers=len(MOCK_SERVICES), recent_transactions=LIVE_FINANCE[-10:])
@app.route('/admin/users')
def admin_users(): return render_template('admin/users.html')
@app.route('/admin/settings')
def admin_settings(): return render_template('admin/settings.html')

# Shared Routes
@app.route('/profile/<int:service_id>') 
def provider_profile(service_id):
    service = get_service_by_id(service_id)
    if service is None: return render_template('shared/portal_error.html', error_message="Service Profile Not Found"), 404
    service['vouched_skills'] = sorted([{'skill': s, 'count': c} for s, c in LIVE_VOUCHES[service_id].items()], key=lambda x: x['count'], reverse=True)
    return render_template('shared/provider_profile.html', service=service)

@app.route('/chat/booking/<string:booking_id>') 
def chat_interface_booking(booking_id):
    booking = get_booking_by_id(booking_id)
    if booking is None: return render_template('shared/portal_error.html', error_message="Booking not found"), 404
    service = get_service_by_id(booking['service_id'])
    return render_template('shared/chat.html', service=service, booking=booking)

@app.route('/chat/<int:service_id>') 
def chat_interface_service(service_id):
    service = get_service_by_id(service_id)
    if service is None: return render_template('shared/portal_error.html', error_message="Service provider not found"), 404
    
    new_booking = {
        "booking_id": f"bk_{generate_simple_id()}", "service_id": int(service_id),
        "provider_name": service.get('provider_name'), "customer_name": "New Customer", "customer_id": "temp_id",
        "status": "New", "description": "Started a new conversation.", "preferred_time": "N/A",
        "timestamp": datetime.datetime.now().isoformat(), "reviewed": False, "quote_amount": None, "messages": []
    }
    LIVE_BOOKINGS.append(new_booking)
    return redirect(url_for('chat_interface_booking', booking_id=new_booking['booking_id']))

# --- API ENDPOINTS ---

# AUTH: Admin Login
@app.route('/api/admin/login', methods=['POST'])
def handle_admin_login():
    if request.json.get('id') == ADMIN_ID and request.json.get('password') == ADMIN_PASSWORD:
        return jsonify({ "success": True, "session": { "role": "admin", "token": f"secure_{generate_simple_id()}", "name": "Super Admin" } })
    return jsonify({"success": False, "error": "Invalid Credentials"}), 401

# AUTH: Business Registration (Real-Time)
@app.route('/api/auth/register-business', methods=['POST'])
def register_business():
    data = request.json
    new_id = len(MOCK_SERVICES) + 1 + int(datetime.datetime.now().timestamp() % 1000)
    new_service = {
        "id": new_id, "name": data.get('businessName'), "category": data.get('category'),
        "rating": 0.0, "reviews": 0, "distance": "2.5 km", "priceRange": "$$", "isVerified": False, 
        "specialty": "General Services", "city": data.get('city') or "Nizamabad",
        "provider_name": data.get('businessName'), "portfolio": [], "fixed_services": []
    }
    MOCK_SERVICES.append(new_service)
    return jsonify({ "success": True, "service_id": new_id, "service": new_service })

# RAZORPAY: Order
@app.route('/api/payment/create-order', methods=['POST'])
def create_payment_order():
    data = request.json
    amount_inr = data.get('amount') 
    if not amount_inr or int(amount_inr) <= 0: return jsonify({"success": False, "error": "Invalid amount"}), 400
    
    amount_paise = int(amount_inr) * 100 
    if razorpay_client:
        try:
            order = razorpay_client.order.create(data={ "amount": amount_paise, "currency": "INR", "payment_capture": 1 })
            return jsonify({ "success": True, "mode": "live", "order_id": order['id'], "amount": amount_paise, "key_id": RAZORPAY_KEY_ID, "currency": "INR" })
        except Exception as e:
            print(f"Razorpay Error: {e}. Falling back to Mock.")
    
    return jsonify({ "success": True, "mode": "mock", "order_id": f"mock_{generate_simple_id()}", "amount": amount_paise, "key_id": "mock_key", "currency": "INR" })

# Search
@app.route('/api/search', methods=['GET'])
def search_services():
    category = request.args.get('service', 'All')
    filtered = MOCK_SERVICES
    if category != 'All' and category:
        filtered = [s for s in MOCK_SERVICES if category.lower() in s['category'].lower() or category.lower() in s['name'].lower()]
    return jsonify({ "results": filtered })

# Booking
@app.route('/api/booking/create', methods=['POST'])
def create_booking():
    data = request.json
    service_id = int(data.get('service_id'))
    provider = get_service_by_id(service_id)
    
    p_name = provider['provider_name'] if provider else "Service Provider"

    new_booking = {
        "booking_id": f"bk_{generate_simple_id()}", "service_id": service_id,
        "provider_name": p_name,
        "customer_name": data.get('customer_name'), "customer_id": data.get('customer_id'),
        "status": "Pending Approval" if data.get('fixed_price') else "Awaiting Quote",
        "description": data.get('description'), "preferred_time": data.get('preferred_time'),
        "timestamp": datetime.datetime.now().isoformat(), "reviewed": False,
        "quote_amount": int(data.get('fixed_price')) if data.get('fixed_price') else None, "messages": []
    }
    LIVE_BOOKINGS.append(new_booking)
    add_notification(str(service_id), f"New Lead: {data.get('customer_name')}", "/business/leads", "info")
    return jsonify({"success": True, "booking": new_booking})

@app.route('/api/booking/update', methods=['POST'])
def update_booking_status():
    data = request.json
    booking_id = data.get('booking_id')
    new_status = data.get('status')
    booking = get_booking_by_id(booking_id)
    if booking:
        old_status = booking['status']; booking['status'] = new_status
        if new_status == 'Completed' and old_status != 'Completed':
            amount = booking.get('quote_amount', 0) or 0
            try: rate = float(GLOBAL_SETTINGS['commission_rate']) / 100
            except: rate = 0.10
            fee = round(amount * rate, 2)
            payout = amount - fee
            LIVE_FINANCE.append({
                "id": f"txn_{generate_simple_id()}", "booking_id": booking['booking_id'], "service_id": booking['service_id'], "provider": booking['provider_name'], "total_amount": amount, "platform_fee": fee, "provider_payout": payout, "timestamp": datetime.datetime.now().isoformat(), "status": "Settled"
            })
        return jsonify({"success": True, "booking": booking})
    return jsonify({"success": False}), 404

@app.route('/api/business/leads', methods=['GET'])
def get_business_leads():
    service_id = request.args.get('serviceId')
    try: service_id = int(service_id)
    except: return jsonify({"success": False}), 400
    leads = [b for b in LIVE_BOOKINGS if b['service_id'] == service_id]
    leads.reverse()
    return jsonify({"success": True, "leads": leads})

@app.route('/api/resident/my-bookings', methods=['GET'])
def get_resident_bookings():
    bookings = [b for b in LIVE_BOOKINGS if b['customer_id'] == request.args.get('customerId')]
    bookings.reverse()
    return jsonify({"success": True, "bookings": bookings})

@app.route('/api/resident/dashboard-stats', methods=['GET'])
def get_resident_dashboard_stats():
    customer_id = request.args.get('customerId')
    my_bookings = [b for b in LIVE_BOOKINGS if b['customer_id'] == customer_id]
    active_jobs = [b for b in my_bookings if b['status'] in ['New', 'Awaiting Quote', 'Pending Approval', 'Quoted', 'Booked']]
    completed_jobs = [b for b in my_bookings if b['status'] in ['Completed', 'Archived']]
    
    paid_jobs = [b for b in my_bookings if b['status'] in ['Booked', 'Completed', 'Archived', 'Disputed']]
    total_spent = sum(b.get('quote_amount', 0) or 0 for b in paid_jobs)
    
    recent_activity = []
    for b in my_bookings[-5:]:
        try: dt = datetime.datetime.fromisoformat(b['timestamp'])
        except: dt = datetime.datetime.now()
        recent_activity.append({
            "type": b['status'], "title": b['status'], "description": f"{b['provider_name']} - {b['description'][:30]}...", 
            "time": dt.strftime("%b %d, %I:%M %p")
        })
    recent_activity.reverse()
    return jsonify({ "success": True, "active_count": len(active_jobs), "completed_count": len(completed_jobs), "total_spent": total_spent, "recent_activity": recent_activity })

@app.route('/api/business/analytics-data', methods=['GET'])
def get_analytics_data():
    """Unified Endpoint for Dashboard & Analytics - Robust Version"""
    service_id_param = request.args.get('serviceId')
    
    if not service_id_param:
        return jsonify({"success": False, "error": "Missing serviceId"}), 400
        
    try:
        service_id = int(service_id_param)
    except ValueError:
        return jsonify({"success": False, "error": "Invalid serviceId"}), 400
    
    # 1. Fetch Data
    my_bookings = [b for b in LIVE_BOOKINGS if b['service_id'] == service_id]
    
    # Calculate Revenue (Sum of payouts in ledger)
    current_revenue = sum(txn['provider_payout'] for txn in LIVE_FINANCE if txn.get('service_id') == service_id)

    # Active Jobs
    active_jobs_count = len([b for b in my_bookings if b['status'] not in ['Completed', 'Archived', 'Cancelled', 'Declined']])
    
    # Skills
    skill_dict = LIVE_VOUCHES[service_id]
    sorted_skills = sorted(skill_dict.items(), key=lambda item: item[1], reverse=True)[:5]
    skill_labels = [item[0] for item in sorted_skills]
    skill_counts = [item[1] for item in sorted_skills]

    # 2. Analytics Logic
    total_inquiries = len(my_bookings)
    converted_jobs = [b for b in my_bookings if b['status'] in ['Booked', 'Completed']]
    
    conversion_rate = 0
    if total_inquiries > 0:
        conversion_rate = round((len(converted_jobs) / total_inquiries * 100), 1)
    
    # Funnel Counts
    status_counts = {"Awaiting Quote": 0, "Quoted": 0, "Booked": 0, "Completed": 0}
    for b in my_bookings:
        s = b.get('status')
        if s in status_counts: 
            status_counts[s] += 1
        elif s in ["New", "Pending Approval"]: 
            status_counts["Awaiting Quote"] += 1
        elif s in ["Refunded", "Disputed"]:
             status_counts["Completed"] += 1 

    # 3. Reviews
    my_reviews = [r for r in LIVE_REVIEWS if r['service_id'] == service_id]
    recent_reviews = sorted(my_reviews, key=lambda x: x['timestamp'], reverse=True)[:2]

    # 4. Rating Info
    srv = get_service_by_id(service_id)
    current_rating = srv.get('rating', 0.0) if srv else 0.0
    review_count = srv.get('reviews', 0) if srv else 0

    # 5. Revenue Trend Logic (Smoothing)
    # If we have revenue but no time history (common in demos), fake a curve so graph isn't empty
    if current_revenue > 0:
        # Distribute total over 5 points: 0%, 20%, 50%, 80%, 100%
        rev_data = [0, current_revenue * 0.2, current_revenue * 0.5, current_revenue * 0.8, current_revenue]
    else:
        rev_data = [0, 0, 0, 0, 0]

    return jsonify({
        "success": True,
        "kpi": {
            "revenue": current_revenue,
            "jobs": active_jobs_count,
            "rating": current_rating,
            "inquiries": total_inquiries,
            "conversion": conversion_rate,
            "review_count": review_count
        },
        "charts": {
            "skill_labels": skill_labels,
            "skill_counts": skill_counts,
            "revenue_labels": ["Week 1", "Week 2", "Week 3", "Week 4", "Today"], 
            "revenue_data": rev_data, 
            "funnel_labels": ["Leads", "Quoted", "Booked", "Done"],
            "funnel_data": [
                status_counts["Awaiting Quote"], 
                status_counts["Quoted"], 
                status_counts["Booked"], 
                status_counts["Completed"]
            ]
        },
        "recent_reviews": recent_reviews
    })

@app.route('/api/quote/send', methods=['POST'])
def send_quote():
    data = request.json
    booking = get_booking_by_id(data.get('booking_id'))
    if booking:
        booking['status'] = "Quoted"; booking['quote_amount'] = int(data.get('amount'))
        add_notification(booking['customer_id'], f"Quote: ₹{data.get('amount')}", f"/chat/booking/{booking['booking_id']}", "success")
        return jsonify({"success": True, "booking": booking})
    return jsonify({"success": False}), 404

@app.route('/api/quote/accept', methods=['POST'])
def accept_quote():
    data = request.json
    booking = get_booking_by_id(data.get('booking_id'))
    if booking:
        booking['status'] = "Booked"; booking['payment_id'] = data.get('payment_id')
        add_notification(str(booking['service_id']), f"Job Confirmed by {booking['customer_name']}", "/business/leads", "success")
        return jsonify({"success": True, "booking": booking})
    return jsonify({"success": False}), 404

@app.route('/api/chat/send-message', methods=['POST'])
def send_chat_message():
    data = request.json
    booking = get_booking_by_id(data.get('booking_id'))
    if booking:
        if 'messages' not in booking: booking['messages'] = []
        msg = { "id": len(booking['messages'])+1, "sender": data.get('sender_role'), "text": data.get('text'), "timestamp": datetime.datetime.now().isoformat() }
        booking['messages'].append(msg)
        return jsonify({"success": True, "message": msg})
    return jsonify({"success": False}), 404

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    booking = get_booking_by_id(request.args.get('booking_id'))
    if booking: return jsonify({"success": True, "messages": booking.get('messages', []), "status": booking['status'], "quote_amount": booking.get('quote_amount')})
    return jsonify({"success": False}), 404

@app.route('/api/business/reviews', methods=['GET'])
def get_business_reviews():
    reviews = [r for r in LIVE_REVIEWS if r['service_id'] == int(request.args.get('serviceId'))]
    return jsonify({"success": True, "reviews": reviews})

@app.route('/api/review/create', methods=['POST'])
def create_review():
    data = request.json
    new_rev = {
        "review_id": f"rev_{generate_simple_id()}", "booking_id": data.get('booking_id'), "service_id": int(data.get('service_id')), "rating": int(data.get('rating')), "comment": data.get('comment'), "customer_name": data.get('customer_name'), "timestamp": datetime.datetime.now().isoformat(), "vouched_skills": data.get('vouched_skills', [])
    }
    LIVE_REVIEWS.append(new_rev)
    for skill in data.get('vouched_skills', []): LIVE_VOUCHES[int(data.get('service_id'))][skill] += 1
    booking = get_booking_by_id(data.get('booking_id'))
    if booking: booking['reviewed'] = True
    # Update Rating
    all = [r for r in LIVE_REVIEWS if r['service_id'] == int(data.get('service_id'))]
    srv = get_service_by_id(data.get('service_id'))
    if srv and all: srv['rating'] = round(sum(r['rating'] for r in all)/len(all), 1); srv['reviews'] = len(all)
    return jsonify({"success": True})

@app.route('/api/notifications/list', methods=['GET'])
def get_notifications_api():
    notifs = [n for n in LIVE_NOTIFICATIONS if n['user_id'] == request.args.get('userId')]
    notifs.reverse()
    return jsonify({"success": True, "notifications": notifs})

@app.route('/api/notifications/mark-read', methods=['POST'])
def mark_read():
    for n in LIVE_NOTIFICATIONS:
        if n['user_id'] == request.json.get('user_id'): n['read'] = True
    return jsonify({"success": True})

@app.route('/api/business/profile/update', methods=['POST'])
def update_profile():
    service = get_service_by_id(request.json.get('userId'))
    if service: service['name'] = request.json.get('name'); return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route('/api/business/service/list', methods=['GET'])
def list_business_services():
    s_id = request.args.get('serviceId')
    service = get_service_by_id(s_id)
    if not service and s_id:
        # HEALING: If ID missing (due to restart), return empty list
        return jsonify({"success": True, "fixed_services": []})
    if service: return jsonify({"success": True, "fixed_services": service.get('fixed_services', [])})
    return jsonify({"success": False}), 404

@app.route('/api/business/service/add', methods=['POST'])
def add_service_listing():
    data = request.json
    s_id = data.get('serviceId')
    service = get_service_by_id(s_id)
    
    # --- DEMO HEALING ---
    if not service and s_id:
        service = {
            "id": int(s_id), "name": "Restored Business", "category": "General",
            "rating": 0.0, "reviews": 0, "provider_name": "Restored Business",
            "fixed_services": [], "portfolio": []
        }
        MOCK_SERVICES.append(service)

    if service:
        service['fixed_services'].append({ "name": data.get('name'), "price": int(data.get('price')) })
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Service ID not found. Please re-login."}), 404

@app.route('/api/business/service/delete', methods=['POST'])
def delete_service_listing():
    data = request.json
    service = get_service_by_id(data.get('serviceId'))
    if service:
        service['fixed_services'] = [s for s in service['fixed_services'] if s['name'] != data.get('name')]
        return jsonify({"success": True})
    return jsonify({"success": False}), 404

# --- ADMIN API ---
@app.route('/api/admin/providers', methods=['GET'])
def admin_providers(): return jsonify({"success": True, "providers": MOCK_SERVICES})

@app.route('/api/admin/verify', methods=['POST'])
def admin_verify():
    s = get_service_by_id(request.json.get('service_id'))
    if s: s['isVerified'] = (request.json.get('action') == 'verify'); return jsonify({"success": True})
    return jsonify({"success": False}), 404

@app.route('/api/admin/settings', methods=['GET', 'POST'])
def admin_settings_api():
    global GLOBAL_SETTINGS, COMMISSION_RATE
    if request.method == 'POST':
        GLOBAL_SETTINGS.update(request.json)
        if 'commission_rate' in request.json: COMMISSION_RATE = int(request.json['commission_rate']) / 100
        return jsonify({"success": True})
    return jsonify({"success": True, "settings": GLOBAL_SETTINGS})

# --- ERROR HANDLERS ---
@app.errorhandler(404)
def not_found(e): return render_template('shared/portal_error.html', error_message="Page Not Found"), 404
@app.errorhandler(500)
def internal_error(e): return render_template('shared/portal_error.html', error_message="Internal server error"), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)