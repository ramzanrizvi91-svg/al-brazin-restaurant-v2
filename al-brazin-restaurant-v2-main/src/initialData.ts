import { MenuItem, Branch, Table, SalesAnalytics } from './types';

export const BRANCHES: Branch[] = [
  { id: 'golden', name: 'Golden Restaurant', location: 'Riyadh' },
  { id: 'diamond', name: 'Diamond Restaurant', location: 'Jeddah' },
  { id: 'prestigino', name: 'Prestigino Restaurant', location: 'Al Khobar' },
  { id: 'mirage', name: 'Mirage Restaurant', location: 'Dammam' },
  { id: 'al_rashid', name: 'Al Rashid Al Khobar Restaurant', location: 'Al Khobar' }
];

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'starter_1',
    name: 'Spicy Shrimp',
    category: 'Starters',
    description: 'Crispy gulf shrimp tossed in our signature spicy maple-glaze, garnished with green onions and sesame seeds.',
    price: 49,
    ingredients: ['Shrimp', 'Maple syrup', 'Chili paste', 'Sriracha', 'Sesame seeds', 'Green onions'],
    calories: 340,
    taste: 'Spicy and sweet with a rich, savory seafood undertone',
    image: 'https://images.unsplash.com/photo-1559742811-82410b451b94?w=500&auto=format&fit=crop&q=60',
    isSpicy: true,
    isPopular: true
  },
  {
    id: 'starter_2',
    name: 'Truffle Parmesan Fries',
    category: 'Starters',
    description: 'Crispy thick-cut skin-on fries drizzled with white truffle oil, grated aged Parmesan, and fresh chopped parsley.',
    price: 29,
    ingredients: ['Potatoes', 'White truffle oil', 'Parmesan cheese', 'Sea salt', 'Parsley'],
    calories: 420,
    taste: 'Earthy, rich, cheesy and savory with perfect saltiness',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
    isVegetarian: true
  },
  {
    id: 'starter_3',
    name: 'Crispy Pepper Calamari',
    category: 'Starters',
    description: 'Tender calamari rings dusted in black pepper seasoned flour, fried to golden crisp, served with saffron aioli.',
    price: 39,
    ingredients: ['Calamari', 'Black pepper', 'Flour', 'Saffron', 'Garlic aioli'],
    calories: 290,
    taste: 'Crispy exterior, tender inside, with a peppery bite and luxurious creamy saffron dipping sauce',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'main_1',
    name: 'Wagyu Beef Burger',
    category: 'Mains',
    description: 'Premium grilled Wagyu patty, melted vintage cheddar, truffle mayonnaise, and caramelized balsamic onions on a toasted brioche bun.',
    price: 69,
    ingredients: ['Wagyu beef patty', 'Cheddar cheese', 'Truffle mayo', 'Balsamic onions', 'Brioche bun'],
    calories: 780,
    taste: 'Immensely juicy and buttery beef, sweet and tangy onions, rich umami truffle finish',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    isPopular: true
  },
  {
    id: 'main_2',
    name: 'Prestigino Ribeye Steak',
    category: 'Mains',
    description: '350g Prime Angus Ribeye, wet-aged and charbroiled, served with rosemary butter and a side of roasted garlic asparagus.',
    price: 159,
    ingredients: ['Prime Angus Ribeye', 'Rosemary butter', 'Garlic', 'Asparagus', 'Sea salt'],
    calories: 890,
    taste: 'Deeply caramelized crust, melt-in-your-mouth fat marbling, fragrant herb butter',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
    isPopular: true
  },
  {
    id: 'main_3',
    name: 'Saffron Seafood Risotto',
    category: 'Mains',
    description: 'Creamy Arborio rice slow-cooked in rich saffron broth, studded with fresh gulf prawns, mussels, and calamari.',
    price: 89,
    ingredients: ['Arborio rice', 'Saffron', 'Prawns', 'Mussels', 'Calamari', 'Parmesan', 'Butter'],
    calories: 610,
    taste: 'Fragrant, earthy saffron blended with rich creamy butter, sweet seafood flavors, and perfectly al dente rice',
    image: 'https://images.unsplash.com/photo-1534080564883-114af88c474e?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'main_4',
    name: 'Diamond Grilled Salmon',
    category: 'Mains',
    description: 'Atlantic salmon fillet pan-seared with a honey-lemon glaze, served on a bed of wild quinoa and sautéed baby spinach.',
    price: 99,
    ingredients: ['Atlantic salmon', 'Honey', 'Lemon juice', 'Quinoa', 'Baby spinach', 'Olive oil'],
    calories: 540,
    taste: 'Flaky and rich salmon with a caramelized sweet-and-sour glaze, paired with clean earthy quinoa',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'dessert_1',
    name: 'Pistachio Sensation Cake',
    category: 'Desserts',
    description: 'Moist pistachio sponge cake layered with premium white chocolate mousse and crushed Iranian pistachios.',
    price: 45,
    ingredients: ['Pistachios', 'Flour', 'White chocolate', 'Heavy cream', 'Sugar'],
    calories: 460,
    taste: 'Richly nutty pistachio flavor balanced with smooth, creamy white chocolate sweetness',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=60',
    isVegetarian: true,
    isPopular: true
  },
  {
    id: 'dessert_2',
    name: 'Chocolate Lava Dome',
    category: 'Desserts',
    description: 'Rich dark Belgian chocolate cake with a molten liquid core, served hot with vanilla bean gelato and fresh berries.',
    price: 39,
    ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Sugar', 'Vanilla bean gelato', 'Berries'],
    calories: 580,
    taste: 'Intense bittersweet warm chocolate flow contrasted with cold, sweet, fragrant vanilla ice cream',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
    isVegetarian: true
  },
  {
    id: 'dessert_3',
    name: 'Saudi Dates Bread Pudding',
    category: 'Desserts',
    description: 'Warm bread pudding made with rich local Khalas dates, soaked in cardamon-spiced butterscotch sauce, topped with clotted cream.',
    price: 35,
    ingredients: ['Khalas dates', 'Bread', 'Cardamom', 'Butterscotch', 'Clotted cream'],
    calories: 520,
    taste: 'Warm, sticky, caramel-like sweetness from dates with a subtle aromatic cardamom warmth and luscious cream',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=60',
    isVegetarian: true
  },
  {
    id: 'drink_1',
    name: 'Limon Mint Mojito',
    category: 'Drinks',
    description: 'Refreshing blend of freshly squeezed local lime juice, crushed garden mint, pure cane syrup, and carbonated water over crushed ice.',
    price: 18,
    ingredients: ['Limes', 'Fresh mint', 'Cane syrup', 'Carbonated water', 'Ice'],
    calories: 120,
    taste: 'Zesty, crisp citrus offset by cooling, clean mint and refreshing carbonation',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
    isVegetarian: true,
    isPopular: true
  },
  {
    id: 'drink_2',
    name: 'Saudi Sparkling Gold',
    category: 'Drinks',
    description: 'Our traditional mocktail blend of organic apple juice, peach nectar, and sparkling white grape juice, garnished with mint and apple fans.',
    price: 24,
    ingredients: ['Apple juice', 'Peach nectar', 'Sparkling white grape juice', 'Fresh apple', 'Mint'],
    calories: 160,
    taste: 'Sparkling, fruity, medium sweetness with elegant apple and peach highlights',
    image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&auto=format&fit=crop&q=60',
    isVegetarian: true
  },
  {
    id: 'drink_3',
    name: 'Double Espresso',
    category: 'Drinks',
    description: 'Rich, bold shot of espresso brewed from freshly ground specialty grade Arabica beans.',
    price: 15,
    ingredients: ['Arabica coffee beans', 'Purified water'],
    calories: 5,
    taste: 'Deeply bitter, nutty, robust, and full-bodied with a thick, golden crema',
    image: 'https://images.unsplash.com/photo-1510972527409-cef190317412?w=500&auto=format&fit=crop&q=60',
    isVegetarian: true
  }
];

export const TABLES: Table[] = [
  // VIP, Family, Open for Golden Riyadh
  { id: 'golden_1', number: '1', area: 'Open', branchId: 'golden' },
  { id: 'golden_1_vip', number: '1', area: 'VIP', branchId: 'golden' },
  { id: 'golden_2', number: '2', area: 'Open', branchId: 'golden' },
  { id: 'golden_3', number: '10', area: 'VIP', branchId: 'golden' },
  { id: 'golden_4', number: '11', area: 'VIP', branchId: 'golden' },
  { id: 'golden_5', number: '20', area: 'Family', branchId: 'golden' },

  // Diamond
  { id: 'diamond_1', number: '1', area: 'Open', branchId: 'diamond' },
  { id: 'diamond_2', number: '5', area: 'VIP', branchId: 'diamond' },
  { id: 'diamond_3', number: '12', area: 'Family', branchId: 'diamond' },

  // Prestigino
  { id: 'prest_1', number: '3', area: 'Open', branchId: 'prestigino' },
  { id: 'prest_2', number: '8', area: 'VIP', branchId: 'prestigino' },
  { id: 'prest_3', number: '15', area: 'Family', branchId: 'prestigino' },

  // Mirage
  { id: 'mirage_1', number: '2', area: 'Open', branchId: 'mirage' },
  { id: 'mirage_2', number: '9', area: 'VIP', branchId: 'mirage' },
  { id: 'mirage_3', number: '16', area: 'Family', branchId: 'mirage' },

  // Al Rashid
  { id: 'rashid_1', number: '4', area: 'Open', branchId: 'al_rashid' },
  { id: 'rashid_2', number: '7', area: 'VIP', branchId: 'al_rashid' },
  { id: 'rashid_3', number: '18', area: 'Family', branchId: 'al_rashid' }
];

export const MOCK_ANALYTICS: SalesAnalytics = {
  topSellingItems: [
    { name: 'Prestigino Ribeye Steak', quantity: 342, revenue: 54378 },
    { name: 'Wagyu Beef Burger', quantity: 512, revenue: 35328 },
    { name: 'Spicy Shrimp', quantity: 489, revenue: 23961 },
    { name: 'Diamond Grilled Salmon', quantity: 210, revenue: 20790 },
    { name: 'Pistachio Sensation Cake', quantity: 380, revenue: 17100 }
  ],
  revenuePerBranch: [
    { branchName: 'Golden Restaurant (Riyadh)', revenue: 78450 },
    { branchName: 'Diamond Restaurant', revenue: 62100 },
    { branchName: 'Prestigino Restaurant', revenue: 89400 },
    { branchName: 'Mirage Restaurant', revenue: 41200 },
    { branchName: 'Al Rashid Al Khobar Restaurant', revenue: 54300 }
  ],
  peakHours: [
    { hour: '12:00 PM', orderCount: 45 },
    { hour: '01:00 PM', orderCount: 62 },
    { hour: '02:00 PM', orderCount: 38 },
    { hour: '07:00 PM', orderCount: 88 },
    { hour: '08:00 PM', orderCount: 110 },
    { hour: '09:00 PM', orderCount: 95 },
    { hour: '10:00 PM', orderCount: 54 }
  ],
  orderTrends: [
    { date: 'Jul 05', revenue: 18400, orderCount: 142 },
    { date: 'Jul 06', revenue: 21200, orderCount: 155 },
    { date: 'Jul 07', revenue: 19800, orderCount: 139 },
    { date: 'Jul 08', revenue: 24500, orderCount: 178 },
    { date: 'Jul 09', revenue: 28900, orderCount: 210 },
    { date: 'Jul 10', revenue: 35400, orderCount: 245 },
    { date: 'Jul 11', revenue: 42100, orderCount: 298 }
  ]
};
