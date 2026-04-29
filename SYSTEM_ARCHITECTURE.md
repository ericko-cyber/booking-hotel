# Data Flow Diagram & System Architecture

Visualisasi lengkap alur data dari Frontend ke Database melalui Backend API.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Next.js)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Pages:                                                                   │
│  ├─ index.js (Homepage)                                                 │
│  ├─ hotels.js (Hotel Listing)                                           │
│  ├─ hotels/[id].js (Hotel Detail + Booking)                             │
│  ├─ bookings.js (User Bookings)                                         │
│  ├─ dashboard.js (User Dashboard)                                       │
│  ├─ login.js / register.js                                              │
│  ├─ owner/                                                               │
│  │  ├─ index.js (Owner Dashboard)                                       │
│  │  ├─ hotels.js (Manage Hotels)                                        │
│  │  ├─ rooms.js (Manage Rooms)                                          │
│  │  └─ bookings.js (View Bookings)                                      │
│  └─ admin/                                                               │
│     ├─ index.js (Admin Dashboard)                                       │
│     ├─ hotels.js (Approve Hotels)                                       │
│     ├─ bookings.js (All Bookings)                                       │
│     ├─ users.js (User Management)                                       │
│     ├─ vouchers.js (Voucher Management)                                 │
│     ├─ analytics.js (Platform Analytics)                                │
│     └─ membership.js (Membership Config)                                │
│                                                                           │
│  Components:                                                              │
│  ├─ HotelCard, HotelFilters                                             │
│  ├─ BookingPanel, RoomSelector                                          │
│  ├─ ReviewForm, ReviewList                                              │
│  ├─ UserProfile, MembershipCard                                         │
│  └─ AdminTables, Analytics Charts                                       │
│                                                                           │
│  Services (src/lib/services):                                            │
│  ├─ authService.js                                                      │
│  ├─ hotelService.js                                                     │
│  ├─ bookingService.js                                                   │
│  ├─ paymentService.js                                                   │
│  ├─ voucherService.js                                                   │
│  ├─ membershipService.js                                                │
│  ├─ reviewService.js                                                    │
│  └─ analyticsService.js                                                 │
│                                                                           │
│  State Management:                                                        │
│  └─ useContext (Auth), useState, useReducer                             │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
              │                                                    │
              │ HTTP/HTTPS                                         │ JSON
              │ REST API Calls                                     │
              │                                                    │
┌──────────────▼────────────────────────────────────────────────────────────┐
│                      API LAYER (Node.js/Express)                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Routes:                                                                   │
│  ├─ /api/auth                                                             │
│  ├─ /api/users                                                            │
│  ├─ /api/hotels                                                           │
│  ├─ /api/rooms                                                            │
│  ├─ /api/bookings                                                         │
│  ├─ /api/payments                                                         │
│  ├─ /api/vouchers                                                         │
│  ├─ /api/reviews                                                          │
│  ├─ /api/memberships                                                      │
│  ├─ /api/owner/*                                                          │
│  └─ /api/admin/*                                                          │
│                                                                             │
│  Middleware:                                                               │
│  ├─ Authentication (JWT)                                                 │
│  ├─ Authorization (Role-based)                                           │
│  ├─ Validation (Input sanitization)                                      │
│  ├─ Error Handling                                                       │
│  └─ Logging                                                              │
│                                                                             │
│  Controllers:                                                              │
│  ├─ authController.js                                                    │
│  ├─ userController.js                                                    │
│  ├─ hotelController.js                                                   │
│  ├─ bookingController.js                                                 │
│  ├─ paymentController.js                                                 │
│  └─ analyticsController.js                                               │
│                                                                             │
│  Services:                                                                 │
│  ├─ bookingService.js (Business logic)                                   │
│  ├─ paymentService.js (Payment processing)                               │
│  ├─ voucherService.js (Validation & application)                         │
│  ├─ membershipService.js (Tier calculation)                              │
│  └─ analyticsService.js (Data aggregation)                               │
│                                                                             │
│  Utilities:                                                                │
│  ├─ emailService.js (Send confirmation, invoice)                         │
│  ├─ priceCalculator.js (Tax, discount calculation)                       │
│  ├─ availabilityChecker.js (Room availability logic)                     │
│  └─ tokenGenerator.js (JWT management)                                   │
│                                                                             │
└───────────────────────────────────────────────────────────────────────────┘
              │                                                   │
              │ SQL Queries                                       │
              │ Transactions                                      │
              │                                                   │
┌──────────────▼────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (MySQL)                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TABLES:                                                                   │
│  ├─ users (id, email, password, role, ...)                               │
│  ├─ hotels (id, name, owner_id, status, ...)                             │
│  ├─ rooms (id, hotel_id, name, price, stock, ...)                        │
│  ├─ room_images (id, room_id, image_url, ...)                            │
│  ├─ bookings (id, user_id, room_id, check_in, check_out, ...)            │
│  ├─ payments (id, booking_id, amount, status, ...)                       │
│  ├─ vouchers (id, code, value, scope, ...)                               │
│  ├─ memberships (id, user_id, level, ...)                                │
│  ├─ reviews (id, booking_id, rating, comment, ...)                       │
│  ├─ wishlist (id, user_id, hotel_id, ...)                                │
│  └─ analytics_metrics (id, date, revenue, bookings, ...)                 │
│                                                                             │
│  INDEXES:                                                                  │
│  ├─ Composite: (hotel_id, check_in, check_out)                           │
│  ├─ Foreign Keys: user_id, hotel_id, owner_id                            │
│  └─ Search: code, email, status                                          │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Examples

### 1️⃣ User Registration Flow

```
User Frontend                    Backend                         Database
    │                              │                                │
    │──────Register Form─────────>│                                │
    │                              │                                │
    │                    Validate Input                             │
    │                              │                                │
    │                    Hash Password                              │
    │                              │                                │
    │                              │─── INSERT users ───────────>│
    │                              │<─── user_id = 1 ─────────────│
    │                              │                                │
    │                    Generate JWT Token                         │
    │                              │                                │
    │<────────Token + User Data────│                                │
    │                              │                                │
  Store Token in              Save to Session
  localStorage
    │
  Redirect to Dashboard
```

---

### 2️⃣ Hotel Browsing & Booking Flow

```
User Frontend                    Backend                         Database
    │                              │                                │
    │──── GET /hotels?location ──>│                                │
    │                              │                                │
    │                    Query Hotels                               │
    │                              │─── SELECT hotels ────────────>│
    │                              │<─── 45 hotels ────────────────│
    │                              │                                │
    │<────────Hotels Array────────│                                │
    │                              │                                │
  Display Hotels                 │
  Select 1 Hotel                 │
    │                              │                                │
    │─── GET /hotels/1/rooms ───>│                                │
    │                              │                                │
    │                    Query Rooms                                │
    │                              │─── SELECT rooms ──────────────>│
    │                              │<─── 5 rooms ──────────────────│
    │                              │                                │
    │<────────Rooms Array────────│                                │
    │                              │                                │
  Select Dates + Room             │
  Apply Voucher Code              │
    │                              │                                │
    │─ POST /vouchers/validate ──>│                                │
    │                              │                                │
    │                    Check Voucher                              │
    │                              │─── SELECT vouchers ───────────>│
    │                              │<─── Valid ────────────────────│
    │                              │                                │
    │<────Discount Amount─────────│                                │
    │                              │                                │
  Enter Guest Info                │
  Review Booking Details          │
    │                              │                                │
    │──── POST /bookings ────────>│                                │
    │                              │                                │
    │                    Check Room Availability                    │
    │                              │─── SELECT bookings ───────────>│
    │                              │  (check_in/check_out overlap) │
    │                              │<─── Available ────────────────│
    │                              │                                │
    │                    Calculate Total Price                      │
    │                    (base + tax - discount)                    │
    │                              │                                │
    │                              │─── START TRANSACTION ────────>│
    │                              │                                │
    │                              │─── INSERT bookings ───────────>│
    │                              │<─── booking_id = 1 ───────────│
    │                              │                                │
    │                              │─── INSERT payments ───────────>│
    │                              │<─── payment_id = 1 ───────────│
    │                              │                                │
    │                              │─── UPDATE rooms (stock-1) ───>│
    │                              │<─── OK ───────────────────────│
    │                              │                                │
    │                              │─── COMMIT TRANSACTION ────────>│
    │                              │                                │
    │<──Booking Confirmation──────│                                │
    │  (booking_code, details)     │                                │
    │                              │                                │
  Redirect to Payment Page        │
    │                              │                                │
    │─ POST /bookings/1/payments >│                                │
    │ (redirect to payment gateway)                                 │
    │                              │                                │
                    [Payment Gateway Processing]                    
                                                                     
    │<──Payment Confirmation────   │                                │
    │ (callback from gateway)      │                                │
    │                              │                                │
    │─ POST /payments/1/verify ──>│                                │
    │                              │                                │
    │                              │─── UPDATE payments ───────────>│
    │                              │   (status = success)          │
    │                              │<─── OK ───────────────────────│
    │                              │                                │
    │                              │─── UPDATE bookings ───────────>│
    │                              │   (payment_status = paid)     │
    │                              │<─── OK ───────────────────────│
    │                              │                                │
    │<─────Success Page───────────│                                │
    │                              │                                │
  Email: Receipt + Invoice        │
```

---

### 3️⃣ Owner Hotel Management Flow

```
Owner Frontend                   Backend                         Database
    │                              │                                │
    │──── GET /owner/hotels ────>│                                │
    │                              │                                │
    │                    Query Owner Hotels                         │
    │                              │─── SELECT hotels ────────────>│
    │                              │  WHERE owner_id = ?           │
    │                              │<─── 3 hotels ─────────────────│
    │                              │                                │
    │<────Hotels List────────────│                                │
    │                              │                                │
  Select Hotel to Manage          │
    │                              │                                │
    │── GET /hotels/101/rooms ───>│                                │
    │                              │                                │
    │                              │─── SELECT rooms ──────────────>│
    │                              │  WHERE hotel_id = 101         │
    │                              │<─── 5 rooms ──────────────────│
    │                              │                                │
    │<────Rooms List────────────│                                │
    │                              │                                │
  View Available Bookings        │
    │                              │                                │
    │ GET /owner/hotels/101/bookings ─>│                           │
    │                              │                                │
    │                    Complex Query:                              │
    │                    - Join bookings + users + rooms           │
    │                    - Filter by hotel_id & status             │
    │                              │─── SELECT (complex) ─────────>│
    │                              │<─── 12 bookings ──────────────│
    │                              │                                │
    │<────Bookings List─────────│                                │
    │                              │                                │
  Update Room (price/stock)      │
    │                              │                                │
    │──── PUT /rooms/1001 ──────>│                                │
    │  { price: 700, stock: 5 }    │                                │
    │                              │                                │
    │                    Validate Input                             │
    │                              │─── UPDATE rooms ──────────────>│
    │                              │<─── Updated ──────────────────│
    │                              │                                │
    │<────Success Response──────│                                │
    │                              │                                │
  Upload Room Images             │
    │                              │                                │
    │─── POST /rooms/1001/images ──>│                              │
    │     (multipart/form-data)     │                                │
    │                              │                                │
    │                    Store Images (AWS S3/Local)               │
    │                              │                                │
    │                              │─── INSERT room_images ────────>│
    │                              │<─── OK ───────────────────────│
    │                              │                                │
    │<────Images URLs────────────│                                │
    │                              │                                │
  View Revenue Stats             │
    │                              │                                │
    │ GET /owner/hotels/101/revenue?date_from=...&date_to=... ─>│
    │                              │                                │
    │                    Aggregation Query:                         │
    │                    - SUM(total) WHERE hotel_id & date range  │
    │                    - Group by day/week/month                 │
    │                              │─── SELECT (aggregate) ────────>│
    │                              │<─── Revenue data ─────────────│
    │                              │                                │
    │<────Charts + Numbers──────│                                │
```

---

### 4️⃣ Admin Approval & Analytics Flow

```
Admin Frontend                   Backend                         Database
    │                              │                                │
    │─── GET /admin/hotels ────>│  (status = pending)            │
    │                              │                                │
    │                    Query Pending Hotels                       │
    │                              │─── SELECT hotels ────────────>│
    │                              │  WHERE status = 'pending'     │
    │                              │<─── 3 pending ────────────────│
    │                              │                                │
    │<────Pending Hotels───────│                                │
    │                              │                                │
  Review Hotel Details           │
  (photos, description, etc)     │
    │                              │                                │
  Accept or Reject               │
    │                              │                                │
    │─ PATCH /admin/hotels/103/status ──>│                         │
    │  { status: "approved" }      │                                │
    │                              │                                │
    │                              │─── UPDATE hotels ────────────>│
    │                              │   (status = approved)         │
    │                              │<─── OK ───────────────────────│
    │                              │                                │
    │<────Success────────────────│                                │
    │                              │                                │
  (Email notification sent to owner)                               
                                                                     
  View Platform Analytics        │
    │                              │                                │
    │─ GET /admin/analytics?period=12m ──>│                       │
    │                              │                                │
    │                    Complex Aggregation:                       │
    │                    - SELECT COUNT(users) by month            │
    │                    - SUM(total) by month                     │
    │                    - COUNT(bookings) by status               │
    │                    - JOIN with hotels for performance        │
    │                              │─── SELECT (complex) ─────────>│
    │                              │<─── Analytics data ───────────│
    │                              │                                │
    │<────Charts + KPIs────────│                                │
    │  - Total Revenue                                              │
    │  - Monthly Growth                                             │
    │  - Top Performing Hotels                                     │
    │  - Booking Conversion Rate                                   │
```

---

## 🔄 Transactional Integrity

### Booking Creation (Example)

```sql
START TRANSACTION;

-- 1. Insert booking
INSERT INTO bookings (
  user_id, room_id, hotel_id, check_in, check_out,
  subtotal, tax_amount, total_price, status
) VALUES (...);
-- Result: booking_id = 1

-- 2. Insert payment
INSERT INTO payments (
  booking_id, amount, status
) VALUES (1, 2860, 'pending');

-- 3. Update room stock
UPDATE rooms SET booked_count = booked_count + 1
WHERE id = 1001;

-- 4. Create/update membership record
UPDATE memberships SET annual_spending = annual_spending + 2860
WHERE user_id = 1;

-- 5. Check if user upgraded membership
UPDATE memberships SET level_name = 'Gold'
WHERE user_id = 1 AND annual_spending >= 8000000;

COMMIT;
-- Jika ada error di step manapun, ROLLBACK semua
```

---

## 🔐 Security Layers

```
Frontend                    API                        Database
   │                        │                            │
   ├─ HTTPS/TLS ────────────┤                           │
   │                        │                            │
   ├─ Token in Header ─────>│  JWT Verification         │
   │                        │  Role Check               │
   │                        │  Input Validation         │
   │                        │  Rate Limiting            │
   │                        │                            │
   │                        ├─ Parameterized Queries ───>│
   │                        │  (prevent SQL Injection)  │
   │                        │                            │
   │                        ├─ Password Hashing ───────>│
   │                        │  (bcrypt)                 │
   │                        │                            │
   │                        ├─ Encryption ─────────────>│
   │                        │  (sensitive data)         │
   │                        │                            │
   └─ Never store sensitive data                         
```

---

## 📈 Performance Optimization

### 1. Frontend Optimization
- Lazy loading components
- Image optimization
- Code splitting
- Caching with React Query

### 2. API Optimization
- Pagination for large datasets
- Compression (gzip)
- Query optimization
- Caching headers (Redis)

### 3. Database Optimization
- Indexes on foreign keys
- Composite indexes for complex queries
- Query optimization
- Connection pooling

```
Query without index:
SELECT * FROM bookings WHERE hotel_id = 101
AND check_in BETWEEN '2024-05-01' AND '2024-05-31'
-- Scan 100,000 rows ❌

Query with index:
CREATE INDEX idx_hotel_dates ON bookings(hotel_id, check_in, check_out);
-- Scan 50 rows ✅
```

---

## 🛠️ Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│                   CDN (CloudFlare)                  │
│            (Cache static assets globally)           │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│              Load Balancer (nginx)                  │
│          (Distribute traffic to servers)            │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│         Frontend Servers (Next.js)                  │
│   ├─ Server 1 (instance 1)                         │
│   ├─ Server 2 (instance 2)                         │
│   └─ Server 3 (instance 3)                         │
│   (Auto-scaling based on demand)                   │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│         API Servers (Node.js/Express)              │
│   ├─ API Server 1                                  │
│   ├─ API Server 2                                  │
│   └─ API Server 3                                  │
│   (Auto-scaling based on demand)                   │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│              Cache Layer (Redis)                   │
│         (Session storage, query cache)             │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│       Database (MySQL/PostgreSQL)                  │
│  ├─ Primary (Write)                               │
│  └─ Replicas (Read)                               │
│  (Automatic failover)                             │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│       External Services                            │
│  ├─ Payment Gateway (Stripe)                      │
│  ├─ Email Service (SendGrid)                      │
│  ├─ File Storage (AWS S3)                         │
│  └─ Analytics (Google Analytics)                  │
└────────────────────────────────────────────────────┘
```

---

## 📊 Database Backup Strategy

```
┌─ Daily Incremental Backups (at 2 AM UTC)
│  └─ Store on S3
│
├─ Weekly Full Backups (Sundays)
│  └─ Store on S3 + local NAS
│
└─ Monthly Snapshots (1st of month)
   └─ Archive to cold storage (Glacier)
```

---

## 🔍 Monitoring & Logging

```
Logs Collection:
├─ Application Logs (Node.js) → ELK Stack
├─ Database Logs (MySQL) → Central Log Server
├─ Access Logs (nginx) → Log Aggregator
└─ Frontend Errors → Sentry

Metrics:
├─ Response Time
├─ Error Rate
├─ Database Connections
├─ Cache Hit Rate
├─ Request Volume
└─ Active Users

Alerts:
├─ High Error Rate (>5%)
├─ Response Time > 2s
├─ Database Down
└─ Disk Space > 80%
```

