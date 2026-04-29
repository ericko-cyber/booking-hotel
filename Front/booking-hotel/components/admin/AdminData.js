// ── All Users ──
export const ALL_USERS = [
  { id: 1, name: 'Sophie Laurent', email: 'sophie@example.com', role: 'user', status: 'active', joined: '2023-09-12', bookings: 8 },
  { id: 2, name: 'James Harrison', email: 'j.harrison@example.com', role: 'user', status: 'active', joined: '2023-10-01', bookings: 5 },
  { id: 3, name: 'James Richardson', email: 'j.richardson@hotels.com', role: 'owner', status: 'active', joined: '2023-08-15', bookings: 0 },
  { id: 4, name: 'Elena Bianchi', email: 'elena.b@example.com', role: 'user', status: 'active', joined: '2024-01-20', bookings: 3 },
  { id: 5, name: 'Marco Rossi', email: 'marco.r@example.com', role: 'user', status: 'active', joined: '2024-02-10', bookings: 12 },
  { id: 6, name: 'Yui Nakamura', email: 'yui.n@example.com', role: 'user', status: 'inactive', joined: '2023-11-05', bookings: 1 },
  { id: 7, name: 'Charlotte Webb', email: 'c.webb@hotels.com', role: 'owner', status: 'active', joined: '2024-03-01', bookings: 0 },
  { id: 8, name: 'Luca Ferrari', email: 'luca.f@example.com', role: 'user', status: 'active', joined: '2024-04-08', bookings: 4 },
  { id: 9, name: 'Admin System', email: 'admin@sanctuaryluxe.com', role: 'admin', status: 'active', joined: '2023-01-01', bookings: 0 },
  { id: 10, name: 'Amara Johnson', email: 'amara.j@example.com', role: 'user', status: 'active', joined: '2024-05-15', bookings: 2 },
]

// ── All Hotels (platform-wide) ──
export const ALL_HOTELS_ADMIN = [
  { id: 101, name: 'The Lumina Heights', owner: 'James Richardson', ownerId: 3, address: 'Rue de Rivoli 42, Paris, France', status: 'approved', rooms: 12, submitted: '2023-08-15', photo: 'linear-gradient(135deg,#3a2a1a 0%,#6b4a2a 60%,#8a6a40 100%)' },
  { id: 102, name: 'Amalfi Cliffside', owner: 'James Richardson', ownerId: 3, address: 'Via Positanesi d\'America 8, Positano, Italy', status: 'approved', rooms: 8, submitted: '2023-11-02', photo: 'linear-gradient(135deg,#1a3a5a 0%,#2a6a9a 60%,#4a8aba 100%)' },
  { id: 103, name: 'Monte Rosa Chalet', owner: 'James Richardson', ownerId: 3, address: 'Bergweg 14, Zermatt, Switzerland', status: 'pending', rooms: 6, submitted: '2024-03-20', photo: 'linear-gradient(135deg,#1a2a3a 0%,#2a4a6a 60%,#4a6a8a 100%)' },
  { id: 104, name: 'Lisbon Palácio', owner: 'James Richardson', ownerId: 3, address: 'Rua das Flores 88, Lisbon, Portugal', status: 'rejected', rooms: 10, submitted: '2024-01-10', photo: 'linear-gradient(135deg,#3a1a2a 0%,#6a2a4a 60%,#8a4a6a 100%)' },
  { id: 105, name: 'Highland Estate', owner: 'Charlotte Webb', ownerId: 7, address: 'Glencoe Road 1, Inverness, Scotland', status: 'pending', rooms: 5, submitted: '2024-04-25', photo: 'linear-gradient(135deg,#1a2a1a 0%,#2a4a2a 60%,#4a6a4a 100%)' },
  { id: 106, name: 'Santorini Caldera View', owner: 'Charlotte Webb', ownerId: 7, address: 'Oia Cliff 12, Santorini, Greece', status: 'approved', rooms: 9, submitted: '2024-02-14', photo: 'linear-gradient(135deg,#2a1a3a 0%,#4a2a6a 60%,#7a4a9a 100%)' },
]

// ── All Bookings (platform-wide) ──
export const ALL_BOOKINGS_ADMIN = [
  { id: 'BK-001', guest: 'Sophie Laurent', guestId: 1, hotel: 'The Lumina Heights', hotelId: 101, room: 'Deluxe Suite', checkIn: '2024-05-02', checkOut: '2024-05-06', nights: 4, total: 3400, status: 'paid', commission: 340 },
  { id: 'BK-002', guest: 'James Harrison', guestId: 2, hotel: 'The Lumina Heights', hotelId: 101, room: 'Tower Suite', checkIn: '2024-05-08', checkOut: '2024-05-10', nights: 2, total: 2800, status: 'paid', commission: 280 },
  { id: 'BK-003', guest: 'Elena Bianchi', guestId: 4, hotel: 'Amalfi Cliffside', hotelId: 102, room: 'Sea View Suite', checkIn: '2024-05-12', checkOut: '2024-05-16', nights: 4, total: 3920, status: 'pending', commission: 0 },
  { id: 'BK-004', guest: 'Marco Rossi', guestId: 5, hotel: 'The Lumina Heights', hotelId: 101, room: 'Presidential Suite', checkIn: '2024-05-20', checkOut: '2024-05-23', nights: 3, total: 9600, status: 'paid', commission: 960 },
  { id: 'BK-005', guest: 'Mia Chen', guestId: 6, hotel: 'Amalfi Cliffside', hotelId: 102, room: 'Cliff Suite', checkIn: '2024-05-18', checkOut: '2024-05-22', nights: 4, total: 5520, status: 'cancelled', commission: 0 },
  { id: 'BK-006', guest: 'Charlotte Webb', guestId: 7, hotel: 'Santorini Caldera View', hotelId: 106, room: 'Caldera Suite', checkIn: '2024-06-01', checkOut: '2024-06-05', nights: 4, total: 4200, status: 'paid', commission: 420 },
  { id: 'BK-007', guest: 'Luca Ferrari', guestId: 8, hotel: 'Amalfi Cliffside', hotelId: 102, room: 'Sea View Suite', checkIn: '2024-06-03', checkOut: '2024-06-07', nights: 4, total: 3920, status: 'paid', commission: 392 },
  { id: 'BK-008', guest: 'Amara Johnson', guestId: 10, hotel: 'The Lumina Heights', hotelId: 101, room: 'Garden Room', checkIn: '2024-06-10', checkOut: '2024-06-12', nights: 2, total: 1160, status: 'cancelled', commission: 0 },
  { id: 'BK-009', guest: 'Sophie Laurent', guestId: 1, hotel: 'Santorini Caldera View', hotelId: 106, room: 'Infinity Room', checkIn: '2024-06-15', checkOut: '2024-06-18', nights: 3, total: 2700, status: 'paid', commission: 270 },
  { id: 'BK-010', guest: 'James Harrison', guestId: 2, hotel: 'Amalfi Cliffside', hotelId: 102, room: 'Garden Room', checkIn: '2024-06-20', checkOut: '2024-06-23', nights: 3, total: 2340, status: 'pending', commission: 0 },
]

// ── Platform Vouchers ──
export const PLATFORM_VOUCHERS = [
  { id: 1, code: 'WELCOME2024', type: 'percent', value: 10, scope: 'global', hotel: null, expiry: '2024-12-31', quota: 500, used: 213, status: 'active' },
  { id: 2, code: 'LUMINA-SUMMER', type: 'fixed', value: 150, scope: 'hotel', hotel: 'The Lumina Heights', expiry: '2024-08-31', quota: 50, used: 24, status: 'active' },
  { id: 3, code: 'AMALFI-SEA20', type: 'percent', value: 20, scope: 'hotel', hotel: 'Amalfi Cliffside', expiry: '2024-07-15', quota: 30, used: 11, status: 'active' },
  { id: 4, code: 'NEWYEAR50', type: 'fixed', value: 50, scope: 'global', hotel: null, expiry: '2024-01-31', quota: 200, used: 200, status: 'expired' },
  { id: 5, code: 'VIP-MEMBER', type: 'percent', value: 15, scope: 'global', hotel: null, expiry: '2024-12-31', quota: 100, used: 42, status: 'active' },
]

// ── Membership Levels ──
export const MEMBERSHIP_LEVELS = [
  { id: 1, name: 'Basic', discount: 0, minSpend: 0, color: '#888', benefits: ['Access to all listings', 'Standard booking support'], members: 6200 },
  { id: 2, name: 'Silver', discount: 5, minSpend: 3000, color: '#9aa0a6', benefits: ['5% booking discount', 'Priority customer support', 'Early access to new properties'], members: 1840 },
  { id: 3, name: 'Gold', discount: 10, minSpend: 8000, color: '#c49a3c', benefits: ['10% booking discount', 'Dedicated concierge', 'Free room upgrades', 'Exclusive member vouchers'], members: 520 },
  { id: 4, name: 'Luminary', discount: 15, minSpend: 20000, color: '#1b4d5c', benefits: ['15% booking discount', 'White-glove concierge 24/7', 'Annual curated retreat invite', 'Airport lounge access', 'Complimentary transfers'], members: 88 },
]

// ── Monthly stats ──
export const PLATFORM_MONTHLY = [
  { month: 'Jan', revenue: 48400, bookings: 38, users: 210 },
  { month: 'Feb', revenue: 62100, bookings: 51, users: 285 },
  { month: 'Mar', revenue: 55800, bookings: 44, users: 320 },
  { month: 'Apr', revenue: 81200, bookings: 68, users: 410 },
  { month: 'May', revenue: 97900, bookings: 82, users: 480 },
  { month: 'Jun', revenue: 114500, bookings: 96, users: 520 },
  { month: 'Jul', revenue: 132100, bookings: 112, users: 610 },
  { month: 'Aug', revenue: 119300, bookings: 98, users: 570 },
  { month: 'Sep', revenue: 101800, bookings: 84, users: 490 },
  { month: 'Oct', revenue: 85600, bookings: 70, users: 430 },
  { month: 'Nov', revenue: 68400, bookings: 56, users: 360 },
  { month: 'Dec', revenue: 93200, bookings: 78, users: 450 },
]