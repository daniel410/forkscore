import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Toronto area neighborhoods and streets
const torontoLocations = [
  { area: 'Downtown', streets: ['King St W', 'Queen St W', 'Dundas St W', 'College St', 'Bloor St W'] },
  { area: 'North York', streets: ['Yonge St', 'Finch Ave', 'Sheppard Ave', 'Steeles Ave'] },
  { area: 'Scarborough', streets: ['Lawrence Ave E', 'Eglinton Ave E', 'Kingston Rd', 'Danforth Ave'] },
  { area: 'Etobicoke', streets: ['Bloor St W', 'Dundas St W', 'Lake Shore Blvd W', 'The Queensway'] },
  { area: 'Yorkville', streets: ['Bloor St W', 'Avenue Rd', 'Yorkville Ave', 'Cumberland St'] },
  { area: 'Chinatown', streets: ['Spadina Ave', 'Dundas St W', 'College St', 'Kensington Ave'] },
  { area: 'Koreatown', streets: ['Bloor St W', 'Christie St', 'Manning Ave', 'Clinton St'] },
  { area: 'Little Italy', streets: ['College St', 'Clinton St', 'Grace St', 'Ossington Ave'] },
  { area: 'The Annex', streets: ['Bloor St W', 'Harbord St', 'Brunswick Ave', 'Spadina Ave'] },
  { area: 'Liberty Village', streets: ['King St W', 'Liberty St', 'Atlantic Ave', 'Jefferson Ave'] },
];

const torontoPostalCodes = ['M5V', 'M5H', 'M4W', 'M5R', 'M6G', 'M4Y', 'M5T', 'M6H', 'M2N', 'M1P'];

// Unsplash image IDs for each cuisine type (curated food photos)
const unsplashImages = {
  korean: {
    restaurant: [
      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=600&fit=crop', // Korean BBQ
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=600&fit=crop', // Korean restaurant
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', // Asian restaurant
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurant interior
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop', // Restaurant
    ],
    food: [
      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop', // Korean BBQ meat
      'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600&h=400&fit=crop', // Bibimbap
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=400&fit=crop', // Korean food
      'https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=600&h=400&fit=crop', // Korean fried chicken
      'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=600&h=400&fit=crop', // Ramen/noodles
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&h=400&fit=crop', // Korean stew
      'https://images.unsplash.com/photo-1583224964978-2257b960c3d3?w=600&h=400&fit=crop', // Dumplings
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', // Asian food
    ],
  },
  chinese: {
    restaurant: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop', // Restaurant
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurant interior
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', // Restaurant setting
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Fine dining
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', // Chinese restaurant
    ],
    food: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop', // Dim sum
      'https://images.unsplash.com/photo-1583224964978-2257b960c3d3?w=600&h=400&fit=crop', // Dumplings
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop', // Chinese food
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop', // Noodles
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=400&fit=crop', // Fried rice
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=400&fit=crop', // Spring rolls
      'https://images.unsplash.com/photo-1547928576-b822bc410bdf?w=600&h=400&fit=crop', // Stir fry
      'https://images.unsplash.com/photo-1562967916-eb82221dfb44?w=600&h=400&fit=crop', // Asian soup
    ],
  },
  italian: {
    restaurant: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Fine dining
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurant
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', // Restaurant
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop', // Italian setting
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop', // Rustic restaurant
    ],
    food: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop', // Pizza
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop', // Pasta carbonara
      'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&h=400&fit=crop', // Lasagna
      'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&h=400&fit=crop', // Spaghetti
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=400&fit=crop', // Pasta dish
      'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&h=400&fit=crop', // Tiramisu
      'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop', // Bruschetta
      'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=600&h=400&fit=crop', // Risotto
    ],
  },
};

// Korean restaurant data
const koreanRestaurantNames = [
  'Seoul Garden', 'Kimchi House', 'Korean BBQ Palace', 'Gangnam Kitchen', 'Bibimbap Bowl',
  'Han River', 'Arirang Restaurant', 'K-Town Grill', 'Bulgogi Brothers', 'Tofu Village',
  'Myeongdong Kitchen', 'Samgyeopsal House', 'Jjigae Pot', 'Kimbap Heaven', 'Soju Bar & Grill',
  'Dongdaemun', 'Busan Seafood', 'Gyeongju Kitchen', 'Seoul Food', 'Hallyu House',
  'Hansik Table', 'Mapo Kitchen', 'Itaewon Eats', 'Namsan Grill', 'Hongdae Kitchen',
  'Korean Soul', 'Daegu BBQ', 'Incheon Harbor', 'Jeju Island', 'Gwangjang Market',
  'Palace Korean', 'Royal Seoul', 'K-Pot', 'Korean Fire',
];

const koreanMenuItems = [
  { name: 'Bulgogi', description: 'Marinated beef slices grilled to perfection', price: 18.99, tags: ['signature'], imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&h=400&fit=crop' }, // Grilled marinated beef
  { name: 'Bibimbap', description: 'Mixed rice with vegetables, meat, and gochujang', price: 15.99, tags: ['popular'], imageUrl: 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600&h=400&fit=crop' }, // Bibimbap bowl
  { name: 'Kimchi Jjigae', description: 'Spicy kimchi stew with pork and tofu', price: 14.99, tags: ['spicy', 'soup'], imageUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=400&fit=crop' }, // Korean stew
  { name: 'Samgyeopsal', description: 'Grilled pork belly with lettuce wraps', price: 22.99, tags: ['bbq', 'popular'], imageUrl: 'https://images.unsplash.com/photo-1611518040286-9af8ba8cc905?w=600&h=400&fit=crop' }, // Grilled pork belly
  { name: 'Japchae', description: 'Stir-fried glass noodles with vegetables', price: 13.99, tags: ['vegetarian'], imageUrl: 'https://images.unsplash.com/photo-1634864572865-1cf8ff8bd23d?w=600&h=400&fit=crop' }, // Glass noodles
  { name: 'Tteokbokki', description: 'Spicy rice cakes in gochujang sauce', price: 11.99, tags: ['spicy', 'street-food'], imageUrl: 'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=600&h=400&fit=crop' }, // Tteokbokki
  { name: 'Korean Fried Chicken', description: 'Crispy double-fried chicken with sauce', price: 16.99, tags: ['popular'], imageUrl: 'https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=600&h=400&fit=crop' }, // Fried chicken
  { name: 'Sundubu Jjigae', description: 'Soft tofu stew with seafood', price: 14.99, tags: ['spicy', 'soup'], imageUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&h=400&fit=crop' }, // Tofu stew
  { name: 'Galbi', description: 'Grilled beef short ribs', price: 28.99, tags: ['bbq', 'premium'], imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop' }, // Beef ribs
  { name: 'Kimbap', description: 'Korean rice rolls with vegetables and meat', price: 9.99, tags: ['light'], imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop' }, // Kimbap rolls
  { name: 'Pajeon', description: 'Savory green onion pancake', price: 12.99, tags: ['appetizer'], imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop' }, // Korean pancake
  { name: 'Dakgalbi', description: 'Spicy stir-fried chicken with vegetables', price: 17.99, tags: ['spicy'], imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&h=400&fit=crop' }, // Stir-fried chicken
  { name: 'Samgyetang', description: 'Ginseng chicken soup', price: 19.99, tags: ['soup', 'healthy'], imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop' }, // Chicken soup
  { name: 'Haemul Pajeon', description: 'Seafood pancake with green onions', price: 15.99, tags: ['seafood'], imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop' }, // Seafood pancake
  { name: 'Bossam', description: 'Boiled pork belly with wraps', price: 24.99, tags: ['signature'], imageUrl: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=600&h=400&fit=crop' }, // Pork belly slices
];

// Chinese restaurant data
const chineseRestaurantNames = [
  'Dragon Palace', 'Golden Dragon', 'Jade Garden', 'Lucky Star', 'Szechuan House',
  'Dynasty Restaurant', 'Pearl River', 'Mandarin Kitchen', 'Canton Express', 'Dim Sum King',
  'Peking Duck House', 'Shanghai Garden', 'Hunan Taste', 'Bamboo Garden', 'Fortune Cookie',
  'Red Lantern', 'Great Wall', 'Imperial Palace', 'Phoenix Garden', 'Lotus Flower',
  'Ming Dynasty', 'Tang Palace', 'Silk Road', 'Five Spice', 'Wok This Way',
  'Noodle House', 'Dumpling King', 'Hot Pot Heaven', 'Kung Fu Kitchen', 'Panda Express',
  'China Garden', 'Eastern Star', 'Happy Dragon', 'Golden Phoenix',
];

const chineseMenuItems = [
  { name: 'Kung Pao Chicken', description: 'Spicy diced chicken with peanuts', price: 16.99, tags: ['spicy', 'popular'], imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop' }, // Kung pao chicken
  { name: 'Mapo Tofu', description: 'Spicy tofu in chili bean sauce', price: 13.99, tags: ['spicy', 'vegetarian'], imageUrl: 'https://images.unsplash.com/photo-1582576163090-09d3b6f8a969?w=600&h=400&fit=crop' }, // Mapo tofu
  { name: 'Peking Duck', description: 'Crispy roasted duck with pancakes', price: 45.99, tags: ['signature', 'premium'], imageUrl: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&h=400&fit=crop' }, // Roasted duck
  { name: 'Dim Sum Platter', description: 'Assorted steamed dumplings', price: 18.99, tags: ['popular'], imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop' }, // Dim sum
  { name: 'Sweet and Sour Pork', description: 'Crispy pork in tangy sauce', price: 15.99, tags: ['classic'], imageUrl: 'https://images.unsplash.com/photo-1616711220245-59a39ce85da8?w=600&h=400&fit=crop' }, // Sweet and sour pork
  { name: 'Beef Chow Fun', description: 'Stir-fried rice noodles with beef', price: 14.99, tags: ['noodles'], imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=400&fit=crop' }, // Flat rice noodles
  { name: 'General Tso Chicken', description: 'Crispy chicken in sweet spicy sauce', price: 15.99, tags: ['popular'], imageUrl: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&h=400&fit=crop' }, // Crispy chicken
  { name: 'Hot and Sour Soup', description: 'Traditional spicy and sour soup', price: 8.99, tags: ['soup', 'spicy'], imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop' }, // Asian soup
  { name: 'Xiao Long Bao', description: 'Shanghai soup dumplings', price: 12.99, tags: ['signature', 'dumplings'], imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&h=400&fit=crop' }, // Soup dumplings
  { name: 'Char Siu', description: 'Cantonese BBQ pork', price: 17.99, tags: ['bbq'], imageUrl: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=600&h=400&fit=crop' }, // BBQ pork
  { name: 'Szechuan Beef', description: 'Spicy shredded beef with peppers', price: 18.99, tags: ['spicy'], imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop' }, // Stir-fried beef
  { name: 'Wonton Soup', description: 'Pork dumplings in clear broth', price: 9.99, tags: ['soup'], imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&h=400&fit=crop' }, // Wonton soup
  { name: 'Fried Rice', description: 'Classic egg fried rice with vegetables', price: 11.99, tags: ['rice'], imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop' }, // Fried rice
  { name: 'Spring Rolls', description: 'Crispy vegetable spring rolls', price: 7.99, tags: ['appetizer', 'vegetarian'], imageUrl: 'https://images.unsplash.com/photo-1548507200-573a1ebb4989?w=600&h=400&fit=crop' }, // Spring rolls
  { name: 'Dan Dan Noodles', description: 'Spicy Szechuan noodles with minced pork', price: 13.99, tags: ['spicy', 'noodles'], imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop' }, // Dan dan noodles
];

// Italian restaurant data
const italianRestaurantNames = [
  'Trattoria Roma', 'La Dolce Vita', 'Pasta Paradise', 'Bella Italia', 'Il Forno',
  'Osteria Napoli', 'Casa Mia', 'Via Roma', 'Amore Mio', 'Piccolo Italia',
  'Nonna\'s Kitchen', 'Tuscan Sun', 'Ristorante Milano', 'Vino & Pasta', 'La Cucina',
  'Olive Garden', 'Sicilian Table', 'Roman Holiday', 'Positano', 'Capri Restaurant',
  'Florence Kitchen', 'Venice Bistro', 'Palermo Pizzeria', 'Bologna Trattoria', 'Napoli Express',
  'Firenze Ristorante', 'Venetian Table', 'Sardinia Kitchen', 'Piedmont House', 'Calabria Cucina',
  'Lombardi\'s', 'Amalfi Coast', 'Little Italy', 'Mama Rosa',
];

const italianMenuItems = [
  { name: 'Margherita Pizza', description: 'Classic pizza with tomato, mozzarella, basil', price: 16.99, tags: ['pizza', 'classic'], imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop' }, // Margherita pizza
  { name: 'Spaghetti Carbonara', description: 'Pasta with egg, pecorino, guanciale', price: 18.99, tags: ['pasta', 'signature'], imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop' }, // Carbonara
  { name: 'Lasagna', description: 'Layered pasta with meat ragù and béchamel', price: 19.99, tags: ['pasta', 'popular'], imageUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=600&h=400&fit=crop' }, // Lasagna
  { name: 'Risotto ai Funghi', description: 'Creamy risotto with wild mushrooms', price: 21.99, tags: ['rice', 'vegetarian'], imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop' }, // Mushroom risotto
  { name: 'Osso Buco', description: 'Braised veal shanks with gremolata', price: 32.99, tags: ['meat', 'premium'], imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop' }, // Braised meat
  { name: 'Tiramisu', description: 'Coffee-flavored Italian dessert', price: 9.99, tags: ['dessert', 'popular'], imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop' }, // Tiramisu
  { name: 'Bruschetta', description: 'Toasted bread with tomatoes and basil', price: 8.99, tags: ['appetizer'], imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop' }, // Bruschetta
  { name: 'Fettuccine Alfredo', description: 'Pasta in creamy parmesan sauce', price: 17.99, tags: ['pasta', 'creamy'], imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=400&fit=crop' }, // Fettuccine alfredo
  { name: 'Caprese Salad', description: 'Fresh mozzarella, tomatoes, basil', price: 12.99, tags: ['salad', 'vegetarian'], imageUrl: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600&h=400&fit=crop' }, // Caprese salad
  { name: 'Ravioli', description: 'Stuffed pasta with ricotta and spinach', price: 18.99, tags: ['pasta'], imageUrl: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=600&h=400&fit=crop' }, // Ravioli
  { name: 'Chicken Parmigiana', description: 'Breaded chicken with marinara and cheese', price: 22.99, tags: ['chicken', 'popular'], imageUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&h=400&fit=crop' }, // Chicken parm
  { name: 'Minestrone Soup', description: 'Hearty vegetable soup', price: 8.99, tags: ['soup', 'vegetarian'], imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop' }, // Vegetable soup
  { name: 'Gnocchi', description: 'Potato dumplings with tomato sauce', price: 16.99, tags: ['pasta'], imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop' }, // Gnocchi
  { name: 'Veal Piccata', description: 'Veal cutlets in lemon caper sauce', price: 26.99, tags: ['meat'], imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop' }, // Veal cutlet
  { name: 'Panna Cotta', description: 'Italian cream dessert with berry sauce', price: 8.99, tags: ['dessert'], imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop' }, // Panna cotta
];

// Mock users data
const mockUsers = [
  { name: 'Sarah Chen', email: 'sarah.chen@email.com', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop' },
  { name: 'Michael Kim', email: 'michael.kim@email.com', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' },
  { name: 'Emma Wilson', email: 'emma.wilson@email.com', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop' },
  { name: 'David Lee', email: 'david.lee@email.com', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' },
  { name: 'Jessica Park', email: 'jessica.park@email.com', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop' },
  { name: 'James Wong', email: 'james.wong@email.com', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop' },
  { name: 'Sofia Martinez', email: 'sofia.martinez@email.com', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop' },
  { name: 'Ryan Thompson', email: 'ryan.thompson@email.com', avatarUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop' },
  { name: 'Olivia Brown', email: 'olivia.brown@email.com', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop' },
  { name: 'Daniel Garcia', email: 'daniel.garcia@email.com', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop' },
  { name: 'Ava Johnson', email: 'ava.johnson@email.com', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop' },
  { name: 'Chris Taylor', email: 'chris.taylor@email.com', avatarUrl: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop' },
  { name: 'Mia Anderson', email: 'mia.anderson@email.com', avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop' },
  { name: 'Andrew Liu', email: 'andrew.liu@email.com', avatarUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop' },
  { name: 'Isabella White', email: 'isabella.white@email.com', avatarUrl: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150&h=150&fit=crop' },
  { name: 'Kevin Nguyen', email: 'kevin.nguyen@email.com', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop' },
  { name: 'Grace Lee', email: 'grace.lee@email.com', avatarUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop' },
  { name: 'Brandon Smith', email: 'brandon.smith@email.com', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop' },
  { name: 'Chloe Davis', email: 'chloe.davis@email.com', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop' },
  { name: 'Tyler Robinson', email: 'tyler.robinson@email.com', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' },
];

// Review templates by rating
const reviewTemplates = {
  excellent: [
    { title: 'Absolutely incredible!', content: 'This is hands down one of the best dishes I\'ve ever had in Toronto. The flavors are perfectly balanced, and you can tell they use high-quality ingredients. Will definitely be coming back!' },
    { title: 'A must-try!', content: 'Wow! I was blown away by how good this was. The presentation was beautiful, and the taste was even better. Our server was also very knowledgeable and friendly.' },
    { title: 'Exceeded all expectations', content: 'I\'ve been to many restaurants in the city, and this place stands out. The food is authentic, flavorful, and made with care. Highly recommend!' },
    { title: 'Perfect in every way', content: 'From the moment we walked in, we knew this was going to be special. The ambiance, service, and most importantly, the food - all exceptional. 10/10!' },
    { title: 'Best I\'ve had!', content: 'I\'m a huge fan of this cuisine and I can confidently say this is the best version I\'ve tried in the GTA. Fresh ingredients, perfect seasoning, generous portions.' },
    { title: 'Outstanding experience', content: 'Every bite was a delight! The chef clearly knows what they\'re doing. Already planning my next visit to try more dishes.' },
  ],
  good: [
    { title: 'Really enjoyed it', content: 'Great food and nice atmosphere. The dish was well-prepared and tasty. Service was prompt and friendly. Would recommend to friends.' },
    { title: 'Solid choice', content: 'Had a great meal here. The food was flavorful and the portions were generous. Will definitely come back to try other items on the menu.' },
    { title: 'Very good!', content: 'The food was delicious and authentic. Prices are reasonable for the quality you get. Nice spot for a casual dinner.' },
    { title: 'Impressed!', content: 'First time trying this dish here and I wasn\'t disappointed. Good flavors, fresh ingredients, and reasonable prices. Happy customer!' },
    { title: 'Tasty and satisfying', content: 'Really enjoyed my meal. The flavors were on point and the dish was filling. Great value for money. Will visit again.' },
    { title: 'Worth the visit', content: 'Came here based on reviews and it lived up to expectations. Food was fresh and delicious. Service was attentive.' },
  ],
  average: [
    { title: 'Decent meal', content: 'The food was okay - nothing special but not bad either. Portions were adequate and the price was fair. Might try something else next time.' },
    { title: 'It was alright', content: 'Had higher expectations based on reviews. The dish was fine but I\'ve had better elsewhere. Service was good though.' },
    { title: 'Average experience', content: 'Food was satisfactory but didn\'t blow me away. The restaurant has a nice vibe but the dish itself was just okay.' },
    { title: 'Not bad, not great', content: 'Came here with friends and had a decent time. Food was acceptable but I probably wouldn\'t order this particular dish again.' },
    { title: 'Room for improvement', content: 'The dish was edible but lacked the wow factor. Maybe I should try something else from their menu next time.' },
  ],
  poor: [
    { title: 'Disappointed', content: 'Unfortunately, this didn\'t meet my expectations. The flavors were bland and the dish seemed like it was sitting for a while. Hope they can improve.' },
    { title: 'Could be better', content: 'Not what I was hoping for. The dish was underseasoned and the ingredients didn\'t taste fresh. Probably won\'t order this again.' },
    { title: 'Not impressed', content: 'Had a subpar experience. The food was mediocre at best. There are better options in the area for this type of cuisine.' },
  ],
};

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  return `(416) ${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`;
}

function generateAddress(location: typeof torontoLocations[0]): string {
  return `${randomNumber(1, 999)} ${randomElement(location.streets)}`;
}

// Toronto coordinates (approximate bounds)
function generateTorontoCoords(): { lat: number; lng: number } {
  const lat = 43.6 + Math.random() * 0.15; // ~43.6 to ~43.75
  const lng = -79.5 + Math.random() * 0.2;  // ~-79.5 to ~-79.3
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

function getReviewByRating(rating: number): { title: string; content: string } {
  if (rating >= 4.5) return randomElement(reviewTemplates.excellent);
  if (rating >= 3.5) return randomElement(reviewTemplates.good);
  if (rating >= 2.5) return randomElement(reviewTemplates.average);
  return randomElement(reviewTemplates.poor);
}

function randomDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomNumber(1, daysBack));
  date.setHours(randomNumber(10, 22), randomNumber(0, 59), randomNumber(0, 59));
  return date;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.favorite.deleteMany();
  await prisma.helpfulVote.deleteMany();
  await prisma.reviewPhoto.deleteMany();
  await prisma.review.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurantHours.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.user.deleteMany();

  // Create mock users
  console.log('👥 Creating mock users...');
  const users: any[] = [];
  for (const userData of mockUsers) {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
        isVerified: true,
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users`);

  // Create admin user
  console.log('👑 Creating admin user...');
  const adminPassword = await bcrypt.hash('MenuYelp@2532', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Daniel Choi',
      email: 'daniel410.choi@gmail.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  const restaurants: any[] = [];
  const allMenuItems: any[] = [];

  // Create Korean restaurants (34)
  console.log('🇰🇷 Creating Korean restaurants...');
  for (let i = 0; i < 34; i++) {
    const location = randomElement(torontoLocations);
    const coords = generateTorontoCoords();
    const name = i < koreanRestaurantNames.length 
      ? koreanRestaurantNames[i] 
      : `${koreanRestaurantNames[i % koreanRestaurantNames.length]} ${Math.floor(i / koreanRestaurantNames.length) + 1}`;

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description: `Authentic Korean cuisine in the heart of ${location.area}. Experience the flavors of Korea with our traditional recipes.`,
        address: generateAddress(location),
        city: 'Toronto',
        state: 'ON',
        zipCode: `${randomElement(torontoPostalCodes)} ${randomNumber(1, 9)}${String.fromCharCode(65 + randomNumber(0, 25))}${randomNumber(1, 9)}`,
        country: 'Canada',
        latitude: coords.lat,
        longitude: coords.lng,
        phone: generatePhone(),
        website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ca`,
        imageUrl: randomElement(unsplashImages.korean.restaurant),
        cuisineType: ['Korean'],
        priceRange: randomNumber(2, 3),
        avgRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        totalReviews: randomNumber(10, 200),
      },
    });
    restaurants.push({ ...restaurant, cuisine: 'Korean' });
  }

  // Create Chinese restaurants (33)
  console.log('🇨🇳 Creating Chinese restaurants...');
  for (let i = 0; i < 33; i++) {
    const location = randomElement(torontoLocations);
    const coords = generateTorontoCoords();
    const name = i < chineseRestaurantNames.length 
      ? chineseRestaurantNames[i] 
      : `${chineseRestaurantNames[i % chineseRestaurantNames.length]} ${Math.floor(i / chineseRestaurantNames.length) + 1}`;

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description: `Traditional Chinese cuisine featuring recipes passed down through generations. Located in ${location.area}.`,
        address: generateAddress(location),
        city: 'Toronto',
        state: 'ON',
        zipCode: `${randomElement(torontoPostalCodes)} ${randomNumber(1, 9)}${String.fromCharCode(65 + randomNumber(0, 25))}${randomNumber(1, 9)}`,
        country: 'Canada',
        latitude: coords.lat,
        longitude: coords.lng,
        phone: generatePhone(),
        website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ca`,
        imageUrl: randomElement(unsplashImages.chinese.restaurant),
        cuisineType: ['Chinese'],
        priceRange: randomNumber(1, 3),
        avgRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        totalReviews: randomNumber(10, 200),
      },
    });
    restaurants.push({ ...restaurant, cuisine: 'Chinese' });
  }

  // Create Italian restaurants (33)
  console.log('🇮🇹 Creating Italian restaurants...');
  for (let i = 0; i < 33; i++) {
    const location = randomElement(torontoLocations);
    const coords = generateTorontoCoords();
    const name = i < italianRestaurantNames.length 
      ? italianRestaurantNames[i] 
      : `${italianRestaurantNames[i % italianRestaurantNames.length]} ${Math.floor(i / italianRestaurantNames.length) + 1}`;

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description: `Authentic Italian dining experience in ${location.area}. Fresh pasta made daily with imported Italian ingredients.`,
        address: generateAddress(location),
        city: 'Toronto',
        state: 'ON',
        zipCode: `${randomElement(torontoPostalCodes)} ${randomNumber(1, 9)}${String.fromCharCode(65 + randomNumber(0, 25))}${randomNumber(1, 9)}`,
        country: 'Canada',
        latitude: coords.lat,
        longitude: coords.lng,
        phone: generatePhone(),
        website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ca`,
        imageUrl: randomElement(unsplashImages.italian.restaurant),
        cuisineType: ['Italian'],
        priceRange: randomNumber(2, 4),
        avgRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        totalReviews: randomNumber(10, 200),
      },
    });
    restaurants.push({ ...restaurant, cuisine: 'Italian' });
  }

  console.log(`✅ Created ${restaurants.length} restaurants`);

  // Create menu categories and items for each restaurant
  console.log('📋 Creating menu categories and items...');
  
  let menuItemCount = 0;
  const targetMenuItems = 100;
  const itemsPerRestaurant = Math.ceil(targetMenuItems / restaurants.length);

  for (const restaurant of restaurants) {
    if (menuItemCount >= targetMenuItems) break;

    let menuItems: typeof koreanMenuItems;
    let categoryNames: string[];

    if (restaurant.cuisine === 'Korean') {
      menuItems = koreanMenuItems;
      categoryNames = ['Appetizers', 'BBQ', 'Stews & Soups', 'Rice & Noodles', 'Main Dishes'];
    } else if (restaurant.cuisine === 'Chinese') {
      menuItems = chineseMenuItems;
      categoryNames = ['Appetizers', 'Dim Sum', 'Noodles & Rice', 'Main Courses', 'Soups'];
    } else {
      menuItems = italianMenuItems;
      categoryNames = ['Antipasti', 'Pasta', 'Pizza', 'Secondi', 'Dolci'];
    }

    // Create 1-2 categories per restaurant
    const numCategories = Math.min(2, categoryNames.length);
    const selectedCategories = categoryNames.slice(0, numCategories);

    for (let catIdx = 0; catIdx < selectedCategories.length; catIdx++) {
      if (menuItemCount >= targetMenuItems) break;

      const category = await prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: selectedCategories[catIdx],
          description: `Our finest ${selectedCategories[catIdx].toLowerCase()} selection`,
          sortOrder: catIdx,
        },
      });

      // Add 1-2 menu items per category
      const itemsToAdd = Math.min(itemsPerRestaurant, targetMenuItems - menuItemCount, 2);
      const shuffledItems = [...menuItems].sort(() => Math.random() - 0.5);

      for (let itemIdx = 0; itemIdx < itemsToAdd; itemIdx++) {
        if (menuItemCount >= targetMenuItems) break;

        const item = shuffledItems[itemIdx % shuffledItems.length];
        const menuItem = await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: item.price + (Math.random() * 4 - 2), // Slight price variation
            imageUrl: item.imageUrl,
            isAvailable: Math.random() > 0.1, // 90% available
            isPopular: item.tags.includes('popular') || Math.random() > 0.7,
            tags: item.tags,
            avgRating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
            totalReviews: randomNumber(5, 100),
          },
        });
        allMenuItems.push(menuItem);
        menuItemCount++;
      }
    }
  }

  console.log(`✅ Created ${menuItemCount} menu items`);

  // Create restaurant hours for all restaurants
  console.log('🕐 Creating restaurant hours...');
  for (const restaurant of restaurants) {
    for (let day = 0; day < 7; day++) {
      await prisma.restaurantHours.create({
        data: {
          restaurantId: restaurant.id,
          dayOfWeek: day,
          openTime: day === 0 ? '12:00' : '11:00', // Sunday opens later
          closeTime: day === 5 || day === 6 ? '23:00' : '22:00', // Fri/Sat close later
          isClosed: false,
        },
      });
    }
  }

  console.log('✅ Restaurant hours created');

  // Create reviews for menu items
  console.log('⭐ Creating reviews...');
  let reviewCount = 0;
  const usedCombinations = new Set<string>(); // Track user-menuItem combinations
  const menuItemReviews: Map<string, { ratings: number[], tasteRatings: number[], qualityRatings: number[], valueRatings: number[], presentationRatings: number[] }> = new Map();

  // Initialize tracking for each menu item
  for (const menuItem of allMenuItems) {
    menuItemReviews.set(menuItem.id, { ratings: [], tasteRatings: [], qualityRatings: [], valueRatings: [], presentationRatings: [] });
  }

  for (const menuItem of allMenuItems) {
    // Each menu item gets 3-8 reviews
    const numReviews = randomNumber(3, 8);
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numReviews && i < shuffledUsers.length; i++) {
      const user = shuffledUsers[i];
      const combinationKey = `${user.id}-${menuItem.id}`;
      
      // Skip if this user already reviewed this item
      if (usedCombinations.has(combinationKey)) continue;
      usedCombinations.add(combinationKey);

      // Generate rating (weighted towards higher ratings)
      const ratingRoll = Math.random();
      let rating: number;
      if (ratingRoll < 0.4) rating = 5;
      else if (ratingRoll < 0.7) rating = 4;
      else if (ratingRoll < 0.85) rating = 4.5;
      else if (ratingRoll < 0.93) rating = 3.5;
      else if (ratingRoll < 0.97) rating = 3;
      else rating = 2 + Math.random();

      rating = parseFloat(rating.toFixed(1));
      
      // Generate sub-ratings based on main rating with small variance
      const tasteRating = Math.min(5, Math.max(1, parseFloat((rating + (Math.random() - 0.5) * 0.6).toFixed(1))));
      const qualityRating = Math.min(5, Math.max(1, parseFloat((rating + (Math.random() - 0.5) * 0.6).toFixed(1))));
      const valueRating = Math.min(5, Math.max(1, parseFloat((rating + (Math.random() - 0.5) * 0.6).toFixed(1))));
      const presentationRating = Math.min(5, Math.max(1, parseFloat((rating + (Math.random() - 0.5) * 0.6).toFixed(1))));
      
      const reviewTemplate = getReviewByRating(rating);

      // Track ratings for this menu item
      const itemRatings = menuItemReviews.get(menuItem.id)!;
      itemRatings.ratings.push(rating);
      itemRatings.tasteRatings.push(tasteRating);
      itemRatings.qualityRatings.push(qualityRating);
      itemRatings.valueRatings.push(valueRating);
      itemRatings.presentationRatings.push(presentationRating);

      await prisma.review.create({
        data: {
          userId: user.id,
          menuItemId: menuItem.id,
          rating,
          tasteRating,
          qualityRating,
          valueRating,
          presentationRating,
          title: reviewTemplate.title,
          content: reviewTemplate.content,
          helpfulCount: randomNumber(0, 25),
          isVisible: true,
          createdAt: randomDate(180), // Reviews from last 6 months
        },
      });
      reviewCount++;
    }
  }

  console.log(`✅ Created ${reviewCount} reviews`);

  // Update menu items with calculated average ratings from reviews
  console.log('📊 Updating menu item ratings from reviews...');
  for (const menuItem of allMenuItems) {
    const itemRatings = menuItemReviews.get(menuItem.id)!;
    
    if (itemRatings.ratings.length > 0) {
      const avgRating = itemRatings.ratings.reduce((a, b) => a + b, 0) / itemRatings.ratings.length;
      const avgTasteRating = itemRatings.tasteRatings.reduce((a, b) => a + b, 0) / itemRatings.tasteRatings.length;
      const avgQualityRating = itemRatings.qualityRatings.reduce((a, b) => a + b, 0) / itemRatings.qualityRatings.length;
      const avgValueRating = itemRatings.valueRatings.reduce((a, b) => a + b, 0) / itemRatings.valueRatings.length;
      const avgPresentationRating = itemRatings.presentationRatings.reduce((a, b) => a + b, 0) / itemRatings.presentationRatings.length;

      await prisma.menuItem.update({
        where: { id: menuItem.id },
        data: {
          avgRating: parseFloat(avgRating.toFixed(1)),
          avgTasteRating: parseFloat(avgTasteRating.toFixed(1)),
          avgQualityRating: parseFloat(avgQualityRating.toFixed(1)),
          avgValueRating: parseFloat(avgValueRating.toFixed(1)),
          avgPresentationRating: parseFloat(avgPresentationRating.toFixed(1)),
          totalReviews: itemRatings.ratings.length,
        },
      });
    }
  }
  console.log('✅ Menu item ratings updated');

  // Update restaurant ratings based on their menu items' reviews
  console.log('🏪 Updating restaurant ratings from menu items...');
  for (const restaurant of restaurants) {
    // Get all menu items for this restaurant
    const restaurantMenuItems = await prisma.menuItem.findMany({
      where: {
        category: {
          restaurantId: restaurant.id,
        },
      },
      select: {
        avgRating: true,
        totalReviews: true,
      },
    });

    if (restaurantMenuItems.length > 0) {
      const itemsWithRatings = restaurantMenuItems.filter(item => item.avgRating !== null);
      if (itemsWithRatings.length > 0) {
        const totalReviews = restaurantMenuItems.reduce((sum, item) => sum + item.totalReviews, 0);
        const avgRating = itemsWithRatings.reduce((sum, item) => sum + (item.avgRating || 0), 0) / itemsWithRatings.length;

        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: {
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalReviews,
          },
        });
      }
    }
  }
  console.log('✅ Restaurant ratings updated');

  // Summary
  console.log('\n📊 Seed Summary:');
  console.log(`   - Total Users: ${users.length}`);
  console.log(`   - Total Restaurants: ${restaurants.length}`);
  console.log(`   - Korean Restaurants: 34`);
  console.log(`   - Chinese Restaurants: 33`);
  console.log(`   - Italian Restaurants: 33`);
  console.log(`   - Total Menu Items: ${menuItemCount}`);
  console.log(`   - Total Reviews: ${reviewCount}`);
  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
