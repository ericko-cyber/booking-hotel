# Struktur Database Booking Hotel - Desain Komprehensif

## Overview Database
Sistem Booking Hotel memiliki aplikasi bertingkat dengan 3 role utama:
- **User** - Penyewa/Tamu Hotel
- **Owner** - Pemilik/Pengelola Hotel
- **Admin** - Administrator Platform

---

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   USERS     │         │    HOTELS    │         │    ROOMS    │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)      │         │ id (PK)     │
│ name        │         │ name         │         │ hotel_id(FK)│
│ email       │         │ location     │         │ name        │
│ password    │────┐    │ address      │    ┌────│ price       │
│ role        │    │    │ description  │    │    │ stock       │
│ is_admin    │    │    │ owner_id(FK) │    │    │ facilities  │
│ phone       │    │    │ status       │    │    │ images      │
│ created_at  │    │    │ created_at   │────┤    │ created_at  │
└─────────────┘    │    └──────────────┘    │    └─────────────┘
                   │                        │
      ┌────────────┴────────────┐           │
      │                         │           │
┌──────────────┐      ┌──────────────────┐ │
│  MEMBERSHIPS │      │    BOOKINGS      │─┘
├──────────────┤      ├──────────────────┤
│ id (PK)      │      │ id (PK)          │
│ user_id(FK)  │◄─────│ user_id(FK)      │
│ level        │      │ room_id(FK)      │
│ joined_date  │      │ check_in         │
│ discount     │      │ check_out        │
│ spend_total  │      │ guests_count     │
└──────────────┘      │ status           │
                      │ total_price      │
                      │ notes            │
                      │ created_at       │
                      └──────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
            ┌──────────────┐    ┌──────────────┐
            │   PAYMENTS   │    │  ROOM_IMAGES │
            ├──────────────┤    ├──────────────┤
            │ id (PK)      │    │ id (PK)      │
            │ booking_id   │    │ room_id(FK)  │
            │ amount       │    │ image_url    │
            │ method       │    │ caption      │
            │ status       │    │ order        │
            │ created_at   │    │ created_at   │
            └──────────────┘    └──────────────┘

            ┌──────────────┐    ┌──────────────┐
            │   VOUCHERS   │    │  REVIEWS     │
            ├──────────────┤    ├──────────────┤
            │ id (PK)      │    │ id (PK)      │
            │ code         │    │ booking_id   │
            │ type         │    │ user_id(FK)  │
            │ value        │    │ hotel_id(FK) │
            │ scope        │    │ rating       │
            │ hotel_id(FK) │    │ comment      │
            │ expiry_date  │    │ created_at   │
            │ usage_limit  │    └──────────────┘
            │ used_count   │
            │ status       │
            └──────────────┘
```

---

## 🗂️ Tabel-Tabel Database

### 1. **USERS** - Data Pengguna
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  role ENUM('user', 'owner', 'admin') DEFAULT 'user',
  is_admin BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(255),
  bio TEXT,
  address VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(10),
  country VARCHAR(100),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_email (email),
  KEY idx_role (role),
  KEY idx_status (status)
);
```

**Penjelasan:**
- `role`: Menentukan tipe user (user biasa, pemilik hotel, atau admin)
- `is_admin`: Flag tambahan untuk superadmin
- Tersimpan profile lengkap user untuk sistem membership

---

### 2. **HOTELS** - Data Hotel
```sql
CREATE TABLE hotels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  owner_id INT NOT NULL,
  location VARCHAR(150),
  address VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  phone VARCHAR(15),
  email VARCHAR(100),
  website VARCHAR(255),
  
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INT DEFAULT 0,
  
  status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
  total_rooms INT DEFAULT 0,
  amenities JSON,
  category VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_owner (owner_id),
  KEY idx_status (status),
  KEY idx_location (location),
  KEY idx_rating (rating)
);
```

**Penjelasan:**
- `owner_id`: Menghubungkan ke user yang memiliki hotel
- `status`: Sistem approval untuk hotel baru
- `amenities`: JSON untuk fleksibilitas (pool, spa, gym, etc)
- `latitude/longitude`: Untuk geolocation mapping

---

### 3. **ROOMS** - Data Ruangan
```sql
CREATE TABLE rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INT DEFAULT 2,
  
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  stock INT DEFAULT 1,
  booked_count INT DEFAULT 0,
  
  facilities JSON,
  room_type ENUM('single', 'double', 'suite', 'deluxe', 'presidential') DEFAULT 'double',
  
  status ENUM('available', 'maintenance', 'discontinued') DEFAULT 'available',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  KEY idx_hotel (hotel_id),
  KEY idx_price (price),
  KEY idx_status (status)
);
```

**Penjelasan:**
- `stock`: Jumlah kamar yang tersedia
- `booked_count`: Counter untuk tracking
- `facilities`: JSON array untuk amenities spesifik kamar
- `room_type`: Kategori tipe kamar

---

### 4. **ROOM_IMAGES** - Gambar Kamar
```sql
CREATE TABLE room_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  caption VARCHAR(255),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  KEY idx_room (room_id)
);
```

---

### 5. **BOOKINGS** - Data Pemesanan
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_code VARCHAR(20) UNIQUE,
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  hotel_id INT NOT NULL,
  
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT DEFAULT 1,
  guests_count INT DEFAULT 1,
  
  room_rate DECIMAL(10, 2),
  subtotal DECIMAL(10, 2),
  tax_rate DECIMAL(3, 1) DEFAULT 10,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  service_fee DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  
  voucher_code VARCHAR(50),
  voucher_discount DECIMAL(10, 2) DEFAULT 0,
  membership_discount DECIMAL(10, 2) DEFAULT 0,
  
  status ENUM('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
  
  guest_name VARCHAR(100),
  guest_email VARCHAR(100),
  guest_phone VARCHAR(15),
  special_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT,
  
  KEY idx_user (user_id),
  KEY idx_hotel (hotel_id),
  KEY idx_status (status),
  KEY idx_check_in (check_in),
  KEY idx_check_out (check_out),
  KEY idx_booking_code (booking_code)
);
```

**Penjelasan:**
- `booking_code`: Reference unik untuk booking (BK-001, BK-002, etc)
- Mencatat semua breakdown harga untuk transparansi
- Tracking voucher dan membership discount terpisah
- Multi-status tracking dari pending hingga checked-out

---

### 6. **PAYMENTS** - Data Pembayaran
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50),
  
  transaction_id VARCHAR(100) UNIQUE,
  reference_number VARCHAR(100) UNIQUE,
  
  status ENUM('pending', 'processing', 'success', 'failed', 'refunded') DEFAULT 'pending',
  
  proof_image VARCHAR(255),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  KEY idx_booking (booking_id),
  KEY idx_status (status),
  KEY idx_created (created_at)
);
```

---

### 7. **VOUCHERS** - Data Voucher Diskon
```sql
CREATE TABLE vouchers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  
  type ENUM('percent', 'fixed') DEFAULT 'percent',
  value DECIMAL(10, 2) NOT NULL,
  min_booking_amount DECIMAL(10, 2) DEFAULT 0,
  
  scope ENUM('global', 'hotel', 'room_type') DEFAULT 'global',
  hotel_id INT,
  room_type VARCHAR(50),
  
  start_date DATE,
  expiry_date DATE NOT NULL,
  usage_limit INT,
  used_count INT DEFAULT 0,
  
  status ENUM('active', 'inactive', 'expired', 'exhausted') DEFAULT 'active',
  description TEXT,
  
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  KEY idx_code (code),
  KEY idx_expiry (expiry_date),
  KEY idx_status (status)
);
```

**Penjelasan:**
- `scope`: Global (semua hotel), hotel spesifik, atau tipe kamar spesifik
- `type`: Persen atau fixed amount
- Tracking penggunaan untuk limit quota

---

### 8. **MEMBERSHIPS** - Data Membership Level
```sql
CREATE TABLE memberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  
  level_name ENUM('Basic', 'Silver', 'Gold', 'Luminary') DEFAULT 'Basic',
  discount_percent DECIMAL(3, 1) DEFAULT 0,
  
  min_annual_spending DECIMAL(10, 2) DEFAULT 0,
  annual_spending DECIMAL(10, 2) DEFAULT 0,
  
  status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
  joined_date DATE,
  renewal_date DATE,
  
  benefits JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user (user_id),
  KEY idx_level (level_name)
);
```

**Penjelasan:**
- `benefits`: JSON array berisi benefit membership (priority support, early access, etc)
- `annual_spending`: Tracking untuk automatic upgrade level
- Sistem tier: Basic → Silver → Gold → Luminary

---

### 9. **REVIEWS** - Review & Rating
```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  user_id INT NOT NULL,
  hotel_id INT NOT NULL,
  
  rating INT CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INT,
  service_rating INT,
  comfort_rating INT,
  value_rating INT,
  
  title VARCHAR(255),
  comment TEXT,
  helpful_count INT DEFAULT 0,
  
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  
  KEY idx_hotel (hotel_id),
  KEY idx_rating (rating)
);
```

---

### 10. **WISHLIST** - Daftar Favorit
```sql
CREATE TABLE wishlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  hotel_id INT NOT NULL,
  
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_wish (user_id, hotel_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);
```

---

### 11. **ANALYTICS_METRICS** - Metrik Platform
```sql
CREATE TABLE analytics_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_date DATE NOT NULL,
  
  total_users INT DEFAULT 0,
  new_users INT DEFAULT 0,
  active_bookings INT DEFAULT 0,
  completed_bookings INT DEFAULT 0,
  cancelled_bookings INT DEFAULT 0,
  
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  platform_commission DECIMAL(15, 2) DEFAULT 0,
  platform_commission_rate DECIMAL(3, 1) DEFAULT 10,
  
  total_hotels INT DEFAULT 0,
  approved_hotels INT DEFAULT 0,
  pending_hotels INT DEFAULT 0,
  
  avg_booking_value DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_date (metric_date),
  KEY idx_date (metric_date)
);
```

---

## 🔄 Relasi Antar Tabel

| Tabel 1 | Tabel 2 | Relasi | Tipe |
|---------|---------|--------|------|
| users | hotels | owner_id → id | One-to-Many |
| hotels | rooms | id → hotel_id | One-to-Many |
| rooms | room_images | id → room_id | One-to-Many |
| users | bookings | id → user_id | One-to-Many |
| hotels | bookings | id → hotel_id | One-to-Many |
| rooms | bookings | id → room_id | One-to-Many |
| bookings | payments | id → booking_id | One-to-Many |
| bookings | reviews | id → booking_id | One-to-One |
| users | memberships | id → user_id | One-to-One |
| users | wishlist | id → user_id | One-to-Many |
| hotels | wishlist | id → hotel_id | One-to-Many |
| hotels | vouchers | id → hotel_id | Many-to-One |

---

## 🎯 Mapping ke UI Komponen

### **Admin Portal** (pages/admin/)
**Data yang diperlukan:**
- **Analytics Dashboard**: ANALYTICS_METRICS, BOOKINGS, PAYMENTS
- **Hotels Management**: HOTELS, USERS (owners), BOOKINGS
- **Users Management**: USERS, MEMBERSHIPS, BOOKINGS
- **Bookings Management**: BOOKINGS, PAYMENTS, ROOMS, HOTELS, USERS
- **Vouchers Management**: VOUCHERS
- **Membership Management**: MEMBERSHIPS, MEMBERSHIP_LEVELS

### **Owner Portal** (pages/owner/)
**Data yang diperlukan:**
- **Owner Dashboard**: HOTELS (owned), BOOKINGS (untuk hotel mereka), ROOMS
- **Hotels Management**: HOTELS (by owner_id), ROOMS, BOOKINGS
- **Rooms Management**: ROOMS (by hotel_id), BOOKINGS, ROOM_IMAGES
- **Bookings**: BOOKINGS (hotel_id), PAYMENTS, USERS (guest)
- **Revenue**: BOOKINGS (status=completed/checked-out), PAYMENTS
- **Settings**: USERS (profile owner)

### **User Portal** (pages/user/)
**Data yang diperlukan:**
- **Dashboard**: USERS (profile), MEMBERSHIPS, BOOKINGS (upcoming)
- **Hotels Browsing**: HOTELS (status=approved), ROOMS, REVIEWS, ROOM_IMAGES
- **Hotel Detail**: HOTELS (id), ROOMS (by hotel_id), REVIEWS, ROOM_IMAGES
- **Bookings**: BOOKINGS (user_id), PAYMENTS, HOTELS, ROOMS
- **Membership**: MEMBERSHIPS (user_id), MEMBERSHIP_LEVELS
- **Wishlist**: WISHLIST (user_id), HOTELS

### **Publik Pages** (index, hotels list)
**Data yang diperlukan:**
- **Homepage**: HOTELS (featured=true, status=approved)
- **Hotels Listing**: HOTELS (status=approved), FILTERS
- **Hotel Search**: HOTELS, ROOMS (filters by location, price, etc)

---

## 📋 Sample Data Setup

### Membership Levels (Static)
```sql
INSERT INTO memberships_levels VALUES
(1, 'Basic', 0, 0),
(2, 'Silver', 5, 3000000),
(3, 'Gold', 10, 8000000),
(4, 'Luminary', 15, 20000000);
```

### Sample User
```sql
INSERT INTO users (name, email, password, role)
VALUES ('Sophie Laurent', 'sophie@example.com', 'hashed_pwd', 'user');
```

### Sample Hotel
```sql
INSERT INTO hotels (name, owner_id, location, status)
VALUES ('The Lumina Heights', 1, 'Paris, France', 'approved');
```

---

## 🔐 Keamanan & Best Practices

1. **Passwords**: Selalu hash dengan bcrypt/argon2
2. **PII**: Encrypt sensitive data (SSN, payment details)
3. **Foreign Keys**: Enable constraint untuk data integrity
4. **Indexing**: Key pada frequently queried fields
5. **Audit Trail**: Track perubahan untuk compliance
6. **Backup**: Regular database backup
7. **Rate Limiting**: Limit API calls per user

---

## 📈 Query Umum

### 1. Get Hotels dengan Statistics
```sql
SELECT 
  h.*,
  COUNT(DISTINCT r.id) as total_rooms,
  AVG(rv.rating) as avg_rating,
  COUNT(DISTINCT b.id) as total_bookings
FROM hotels h
LEFT JOIN rooms r ON h.id = r.hotel_id
LEFT JOIN reviews rv ON h.id = rv.hotel_id
LEFT JOIN bookings b ON h.id = b.hotel_id
WHERE h.status = 'approved'
GROUP BY h.id;
```

### 2. Get User Bookings dengan Details
```sql
SELECT 
  b.*,
  h.name as hotel_name,
  r.name as room_name,
  r.price as room_price,
  p.status as payment_status
FROM bookings b
JOIN hotels h ON b.hotel_id = h.id
JOIN rooms r ON b.room_id = r.id
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.user_id = ? AND b.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
ORDER BY b.check_in DESC;
```

### 3. Available Rooms untuk Period
```sql
SELECT r.* FROM rooms r
WHERE r.hotel_id = ?
AND r.status = 'available'
AND r.id NOT IN (
  SELECT room_id FROM bookings 
  WHERE hotel_id = ?
  AND ((check_in <= ? AND check_out > ?)
    OR (check_in < ? AND check_out >= ?))
  AND status NOT IN ('cancelled')
);
```

### 4. Monthly Revenue Report
```sql
SELECT 
  DATE_FORMAT(b.check_in, '%Y-%m') as month,
  SUM(b.total_price) as revenue,
  COUNT(b.id) as bookings,
  COUNT(DISTINCT b.user_id) as users
FROM bookings b
WHERE b.payment_status = 'paid'
GROUP BY DATE_FORMAT(b.check_in, '%Y-%m')
ORDER BY month DESC;
```

---

## 🗂️ Indexing Strategy

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Hotels
CREATE INDEX idx_hotels_owner ON hotels(owner_id);
CREATE INDEX idx_hotels_status ON hotels(status);
CREATE INDEX idx_hotels_location ON hotels(location);

-- Rooms
CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX idx_rooms_price ON rooms(price);

-- Bookings
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_hotel ON bookings(hotel_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Vouchers
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_expiry ON vouchers(expiry_date);
```

---

## 📊 Kesimpulan

Struktur database ini dirancang untuk mendukung:
✅ Multi-role user system (user, owner, admin)
✅ Complex booking engine dengan availability checking
✅ Payment & voucher system
✅ Membership & loyalty program
✅ Review & rating system
✅ Analytics & reporting
✅ Scalability untuk pertumbuhan platform

