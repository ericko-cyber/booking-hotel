export const CURRENT_OWNER = {
  id: 9001,
  initials: 'JR',
  name: 'James Richardson',
  email: 'j.richardson@hotels.com',
}

// ── Mock Hotels (multi-owner dataset) ──
export const OWNER_HOTELS = [
  {
    id: 101,
    ownerId: 9001,
    name: 'The Lumina Heights',
    address: 'Rue de Rivoli 42, Paris, France',
    description: 'Perched above the Seine with panoramic views of the Eiffel Tower, The Lumina Heights redefines Parisian luxury.',
    status: 'approved',
    rooms: 12,
    photo: 'linear-gradient(135deg,#3a2a1a 0%,#6b4a2a 60%,#8a6a40 100%)',
    createdAt: '2023-08-15',
  },
  {
    id: 102,
    ownerId: 9102,
    name: 'Amalfi Cliffside',
    address: 'Via Positanesi d\'America 8, Positano, Italy',
    description: 'Cascading down the dramatic Amalfi cliffs toward a cerulean sea, this property is Positano at its most cinematic.',
    status: 'approved',
    rooms: 8,
    photo: 'linear-gradient(135deg,#1a3a5a 0%,#2a6a9a 60%,#4a8aba 100%)',
    createdAt: '2023-11-02',
  },
  {
    id: 103,
    ownerId: 9001,
    name: 'Monte Rosa Chalet',
    address: 'Bergweg 14, Zermatt, Switzerland',
    description: 'An alpine sanctuary with direct Matterhorn views, hand-carved pine interiors, and a legendary cheese fondue tradition since 1958.',
    status: 'pending',
    rooms: 6,
    photo: 'linear-gradient(135deg,#1a2a3a 0%,#2a4a6a 60%,#4a6a8a 100%)',
    createdAt: '2024-03-20',
  },
  {
    id: 104,
    ownerId: 9203,
    name: 'Lisbon Palácio',
    address: 'Rua das Flores 88, Lisbon, Portugal',
    description: 'A restored 18th-century palace in Baixa with original azulejo tiles, a rooftop miradouro, and a natural wine cellar.',
    status: 'rejected',
    rooms: 10,
    photo: 'linear-gradient(135deg,#3a1a2a 0%,#6a2a4a 60%,#8a4a6a 100%)',
    createdAt: '2024-01-10',
  },
]

// ── Rooms per hotel ──
export const OWNER_ROOMS = {
  101: [
    { id: 1001, name: 'Classic Room', price: 650, stock: 3, facilities: ['Wi-Fi', 'AC', 'Minibar', 'Brankas'] },
    { id: 1002, name: 'Deluxe Suite', price: 850, stock: 2, facilities: ['Wi-Fi', 'AC', 'Minibar', 'Brankas', 'Jacuzzi', 'Balkon'] },
    { id: 1003, name: 'Tower Suite', price: 1400, stock: 1, facilities: ['Wi-Fi', 'AC', 'Minibar', 'Brankas', 'Jacuzzi', 'Pelayan Pribadi'] },
    { id: 1004, name: 'Garden Room', price: 580, stock: 4, facilities: ['Wi-Fi', 'AC', 'Brankas'] },
    { id: 1005, name: 'Presidential Suite', price: 3200, stock: 1, facilities: ['Wi-Fi', 'AC', 'Minibar', 'Brankas', 'Jacuzzi', 'Pelayan Pribadi', 'Kolam Renang'] },
  ],
  102: [
    { id: 2001, name: 'Garden Room', price: 780, stock: 2, facilities: ['Wi-Fi', 'AC', 'Brankas'] },
    { id: 2002, name: 'Sea View Suite', price: 980, stock: 3, facilities: ['Wi-Fi', 'AC', 'Minibar', 'Brankas', 'Balkon'] },
    { id: 2003, name: 'Cliff Suite', price: 1380, stock: 1, facilities: ['Wi-Fi', 'AC', 'Minibar', 'Brankas', 'Terasa Pribadi'] },
  ],
  103: [
    { id: 3001, name: 'Alpine Room', price: 420, stock: 2, facilities: ['Wi-Fi', 'Perapian', 'Brankas'] },
    { id: 3002, name: 'Matterhorn Suite', price: 680, stock: 2, facilities: ['Wi-Fi', 'Perapian', 'Brankas', 'Balkon'] },
  ],
  104: [
    { id: 4001, name: 'Azulejo Room', price: 320, stock: 4, facilities: ['Wi-Fi', 'AC', 'Brankas'] },
    { id: 4002, name: 'Palace Suite', price: 580, stock: 2, facilities: ['Wi-Fi', 'AC', 'Minibar', 'Brankas', 'Terasa'] },
  ],
}

// ── Bookings ──
export const OWNER_BOOKINGS = [
  { id: 'BK-001', guest: 'Sophie Laurent', hotel: 'The Lumina Heights', hotelId: 101, room: 'Deluxe Suite', checkIn: '2024-05-02', checkOut: '2024-05-06', nights: 4, total: 3400, status: 'paid' },
  { id: 'BK-002', guest: 'James Harrison', hotel: 'The Lumina Heights', hotelId: 101, room: 'Tower Suite', checkIn: '2024-05-08', checkOut: '2024-05-10', nights: 2, total: 2800, status: 'paid' },
  { id: 'BK-004', guest: 'David Kim', hotel: 'The Lumina Heights', hotelId: 101, room: 'Classic Room', checkIn: '2024-05-14', checkOut: '2024-05-17', nights: 3, total: 1950, status: 'paid' },
  { id: 'BK-006', guest: 'Marco Rossi', hotel: 'The Lumina Heights', hotelId: 101, room: 'Presidential Suite', checkIn: '2024-05-20', checkOut: '2024-05-23', nights: 3, total: 9600, status: 'paid' },
  { id: 'BK-008', guest: 'Charlotte Webb', hotel: 'The Lumina Heights', hotelId: 101, room: 'Deluxe Suite', checkIn: '2024-06-01', checkOut: '2024-06-05', nights: 4, total: 3400, status: 'paid' },
  { id: 'BK-010', guest: 'Amara Johnson', hotel: 'The Lumina Heights', hotelId: 101, room: 'Garden Room', checkIn: '2024-06-10', checkOut: '2024-06-12', nights: 2, total: 1160, status: 'cancelled' },
]

// ── Monthly revenue ──
export const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 18400, bookings: 12 },
  { month: 'Feb', revenue: 22100, bookings: 15 },
  { month: 'Mar', revenue: 19800, bookings: 13 },
  { month: 'Apr', revenue: 31200, bookings: 22 },
  { month: 'May', revenue: 38900, bookings: 28 },
  { month: 'Jun', revenue: 44500, bookings: 32 },
  { month: 'Jul', revenue: 52100, bookings: 38 },
  { month: 'Aug', revenue: 49300, bookings: 35 },
  { month: 'Sep', revenue: 41800, bookings: 29 },
  { month: 'Oct', revenue: 35600, bookings: 24 },
  { month: 'Nov', revenue: 28400, bookings: 19 },
  { month: 'Dec', revenue: 33200, bookings: 23 },
]

// ── Vouchers ──
export const OWNER_VOUCHERS = [
  { code: 'LUMINA-SUMMER', discount: 150, type: 'Fixed', minSpend: 800, uses: 24, maxUses: 50, expiry: '2024-08-31', status: 'active' },
  { code: 'AMALFI-SEA20', discount: 20, type: 'Percent', minSpend: 500, uses: 11, maxUses: 30, expiry: '2024-07-15', status: 'active' },
  { code: 'WELCOME100', discount: 100, type: 'Fixed', minSpend: 600, uses: 30, maxUses: 30, expiry: '2024-06-01', status: 'expired' },
]