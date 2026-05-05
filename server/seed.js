import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Cart from './models/Cart.js';
import Order from './models/Order.js';
import Review from './models/Review.js';

const SALT = 10;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const ri = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
const img = (seed, n = 3) =>
  Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/fk-${seed}-${i}/800/800`);

// ─── Category Data ────────────────────────────────────────────────────────────
const PARENTS = [
  { name: 'Electronics',       image: 'https://picsum.photos/seed/cat-electronics/400/300' },
  { name: 'Fashion',           image: 'https://picsum.photos/seed/cat-fashion/400/300' },
  { name: 'Home & Kitchen',    image: 'https://picsum.photos/seed/cat-home/400/300' },
  { name: 'Sports & Fitness',  image: 'https://picsum.photos/seed/cat-sports/400/300' },
  { name: 'Books',             image: 'https://picsum.photos/seed/cat-books/400/300' },
];

const SUBS = {
  'Electronics':      ['Smartphones', 'Laptops', 'Tablets', 'Audio', 'Cameras'],
  'Fashion':          ["Men's Clothing", "Women's Clothing", 'Footwear'],
  'Home & Kitchen':   ['Kitchen Appliances', 'Home Decor'],
  'Sports & Fitness': ['Exercise Equipment'],
  'Books':            ['Fiction', 'Non-Fiction'],
};

const SUB_IMAGES = {
  Smartphones: 'https://picsum.photos/seed/cat-phones/400/300',
  Laptops:     'https://picsum.photos/seed/cat-laptops/400/300',
  Tablets:     'https://picsum.photos/seed/cat-tablets/400/300',
  Audio:       'https://picsum.photos/seed/cat-audio/400/300',
  Cameras:     'https://picsum.photos/seed/cat-cameras/400/300',
  "Men's Clothing":   'https://picsum.photos/seed/cat-men/400/300',
  "Women's Clothing": 'https://picsum.photos/seed/cat-women/400/300',
  Footwear:           'https://picsum.photos/seed/cat-footwear/400/300',
  'Kitchen Appliances': 'https://picsum.photos/seed/cat-kitchen/400/300',
  'Home Decor':         'https://picsum.photos/seed/cat-decor/400/300',
  'Exercise Equipment': 'https://picsum.photos/seed/cat-exercise/400/300',
  Fiction:     'https://picsum.photos/seed/cat-fiction/400/300',
  'Non-Fiction': 'https://picsum.photos/seed/cat-nonfiction/400/300',
};

// ─── Product Data (keyed by sub-category name) ────────────────────────────────
const PRODUCTS = {
  Smartphones: [
    {
      name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', price: 134999, mrp: 154999,
      stock: 45, isFeatured: true, images: img('s24u'),
      description: 'The ultimate Galaxy experience with built-in S Pen, 200MP camera, and AI-powered features. Titanium frame with Corning Gorilla Armor glass.',
      specs: { Display: '6.8" QHD+ Dynamic AMOLED 2X', Processor: 'Snapdragon 8 Gen 3', RAM: '12GB', Storage: '256GB', Camera: '200MP + 12MP + 10MP + 10MP', Battery: '5000mAh', OS: 'Android 14', Charging: '45W Wired + 15W Wireless' },
    },
    {
      name: 'Apple iPhone 15 Pro Max', brand: 'Apple', price: 159900, mrp: 179900,
      stock: 30, isFeatured: true, images: img('iphone15pm'),
      description: 'Forged in titanium with the groundbreaking A17 Pro chip, a customizable Action Button, and the most powerful iPhone camera system ever.',
      specs: { Display: '6.7" Super Retina XDR OLED', Processor: 'Apple A17 Pro', RAM: '8GB', Storage: '256GB', Camera: '48MP + 12MP + 12MP', Battery: '4422mAh', OS: 'iOS 17', Charging: '27W + 15W MagSafe' },
    },
    {
      name: 'OnePlus 12R', brand: 'OnePlus', price: 39999, mrp: 49999,
      stock: 80, isFeatured: true, images: img('op12r'),
      description: 'Snapdragon 8 Gen 1 powered flagship with 50MP Sony IMX890 camera and 100W SUPERVOOC charging. Flagship performance at a mid-range price.',
      specs: { Display: '6.78" AMOLED 120Hz', Processor: 'Snapdragon 8 Gen 1', RAM: '8GB', Storage: '128GB', Camera: '50MP + 8MP + 2MP', Battery: '5400mAh', OS: 'OxygenOS 14', Charging: '100W SUPERVOOC' },
    },
    {
      name: 'Redmi Note 13 Pro+', brand: 'Xiaomi', price: 29999, mrp: 36999,
      stock: 150, images: img('redminote13'),
      description: '200MP primary camera with OIS and MediaTek Dimensity 7200 Ultra. Best camera phone in its segment with 120W HyperCharge.',
      specs: { Display: '6.67" AMOLED 120Hz', Processor: 'Dimensity 7200 Ultra', RAM: '8GB', Storage: '256GB', Camera: '200MP + 8MP + 2MP', Battery: '5000mAh', OS: 'MIUI 14', Charging: '120W HyperCharge' },
    },
    {
      name: 'Google Pixel 8', brand: 'Google', price: 75999, mrp: 84999,
      stock: 40, images: img('pixel8'),
      description: 'Google Tensor G3 chip with advanced AI, 7 years of OS updates, and the most intelligent camera on any Pixel phone.',
      specs: { Display: '6.2" Actua OLED 120Hz', Processor: 'Google Tensor G3', RAM: '8GB', Storage: '128GB', Camera: '50MP + 12MP', Battery: '4575mAh', OS: 'Android 14', Charging: '27W + 18W Wireless' },
    },
    {
      name: 'Nothing Phone 2a', brand: 'Nothing', price: 23999, mrp: 29999,
      stock: 120, images: img('nothing2a'),
      description: "MediaTek Dimensity 7200 Pro with Nothing's iconic Glyph Interface. Radical design with a fantastic 50MP dual camera at an accessible price.",
      specs: { Display: '6.7" AMOLED 120Hz', Processor: 'Dimensity 7200 Pro', RAM: '8GB', Storage: '128GB', Camera: '50MP + 50MP', Battery: '5000mAh', OS: 'Nothing OS 2.5', Charging: '45W' },
    },
    {
      name: 'Vivo V30 Pro', brand: 'Vivo', price: 34999, mrp: 44999,
      stock: 70, images: img('vivov30'),
      description: 'Aura Light Portrait System with 50MP Sony IMX920 sensor, 3D curved AMOLED display, and Dimensity 8200 processor.',
      specs: { Display: '6.78" Curved AMOLED 120Hz', Processor: 'Dimensity 8200', RAM: '12GB', Storage: '256GB', Camera: '50MP + 50MP + 8MP', Battery: '5000mAh', OS: 'Funtouch OS 14', Charging: '80W FlashCharge' },
    },
    {
      name: 'Realme GT 6T', brand: 'Realme', price: 35999, mrp: 44999,
      stock: 95, images: img('realmegt6t'),
      description: 'Snapdragon 7+ Gen 3 with 120Hz AMOLED display and 50MP Sony LYT800 camera. Blazing 120W SUPERVOOC charging.',
      specs: { Display: '6.78" AMOLED 120Hz', Processor: 'Snapdragon 7+ Gen 3', RAM: '8GB', Storage: '256GB', Camera: '50MP + 8MP + 2MP', Battery: '5500mAh', OS: 'Realme UI 5.0', Charging: '120W SUPERVOOC' },
    },
  ],

  Laptops: [
    {
      name: 'Apple MacBook Air 13" M2', brand: 'Apple', price: 114900, mrp: 124900,
      stock: 25, isFeatured: true, images: img('macbookairm2'),
      description: 'Supercharged by Apple M2 with 8-core CPU and 8-core GPU. Fanless design, up to 18 hours battery life, and stunning Liquid Retina display.',
      specs: { Processor: 'Apple M2 8-core', RAM: '8GB Unified', Storage: '256GB SSD', Display: '13.6" Liquid Retina 2560x1664', Battery: 'Up to 18 hrs', OS: 'macOS Sonoma', Weight: '1.24 kg' },
    },
    {
      name: 'Dell XPS 15 (2024)', brand: 'Dell', price: 149990, mrp: 179990,
      stock: 15, images: img('dellxps15'),
      description: 'Intel Core i7-13th Gen with NVIDIA RTX 4060 and a gorgeous 3.5K OLED touch display. The pinnacle of Windows laptop engineering.',
      specs: { Processor: 'Intel Core i7-13700H', RAM: '16GB DDR5', Storage: '512GB SSD', Display: '15.6" 3.5K OLED Touch', Graphics: 'NVIDIA RTX 4060 8GB', Battery: '86Whr', OS: 'Windows 11 Home' },
    },
    {
      name: 'Lenovo ThinkPad E14 Gen 5', brand: 'Lenovo', price: 69990, mrp: 89990,
      stock: 35, images: img('thinkpade14'),
      description: 'Business-grade reliability with AMD Ryzen 7 and MIL-SPEC tested durability. 16GB RAM and 512GB SSD for demanding workloads.',
      specs: { Processor: 'AMD Ryzen 7 7730U', RAM: '16GB DDR4', Storage: '512GB SSD', Display: '14" FHD IPS', Battery: '57Whr', OS: 'Windows 11 Pro', Weight: '1.67 kg' },
    },
    {
      name: 'Asus ZenBook 14 OLED', brand: 'Asus', price: 74990, mrp: 89990,
      stock: 28, isFeatured: true, images: img('zenbook14'),
      description: 'Stunning 2.8K OLED display with Intel Core Ultra 7 and Harman Kardon tuned audio. Ultra-thin 14.9mm design with Intel Arc graphics.',
      specs: { Processor: 'Intel Core Ultra 7 155H', RAM: '16GB LPDDR5', Storage: '512GB SSD', Display: '14" 2.8K OLED 120Hz', Graphics: 'Intel Arc', Battery: '75Whr', OS: 'Windows 11 Home' },
    },
    {
      name: 'HP Pavilion 15', brand: 'HP', price: 54990, mrp: 67990,
      stock: 50, images: img('hppavilion'),
      description: 'Everyday performance with Intel Core i5-13th Gen, Full HD IPS display, and long battery life. Versatile for work, study, and entertainment.',
      specs: { Processor: 'Intel Core i5-1335U', RAM: '8GB DDR4', Storage: '512GB SSD', Display: '15.6" FHD IPS', Graphics: 'Intel Iris Xe', Battery: '41Whr', OS: 'Windows 11 Home' },
    },
    {
      name: 'Acer Aspire 7', brand: 'Acer', price: 59990, mrp: 74990,
      stock: 42, images: img('acerasp7'),
      description: 'AMD Ryzen 5 with NVIDIA GTX 1650, 144Hz display, and 512GB SSD. Gaming-ready performance at an accessible price point.',
      specs: { Processor: 'AMD Ryzen 5 5500U', RAM: '8GB DDR4', Storage: '512GB SSD', Display: '15.6" FHD IPS 144Hz', Graphics: 'NVIDIA GTX 1650 4GB', Battery: '48Whr', OS: 'Windows 11 Home' },
    },
  ],

  Tablets: [
    {
      name: 'Apple iPad Air (M1)', brand: 'Apple', price: 74900, mrp: 89900,
      stock: 30, isFeatured: true, images: img('ipadairm1'),
      description: 'Powerful M1 chip in a thin, light design. 10.9-inch Liquid Retina display, USB-C, and support for Apple Pencil (2nd gen) and Magic Keyboard.',
      specs: { Chip: 'Apple M1', Display: '10.9" Liquid Retina', Storage: '64GB', Camera: '12MP Wide', Battery: 'Up to 10 hrs', Connectivity: 'Wi-Fi 6, Bluetooth 5.0', OS: 'iPadOS 17' },
    },
    {
      name: 'Samsung Galaxy Tab S9 FE', brand: 'Samsung', price: 44999, mrp: 59999,
      stock: 45, images: img('tabs9fe'),
      description: 'IP68 water resistance, 10.9-inch display, and S Pen included in the box. Exynos 1380 for smooth multitasking.',
      specs: { Processor: 'Samsung Exynos 1380', Display: '10.9" TFT LCD 90Hz', Storage: '128GB', Camera: '8MP Rear, 10MP Front', Battery: '8000mAh', Connectivity: 'Wi-Fi 6, Bluetooth 5.3', OS: 'Android 13' },
    },
    {
      name: 'Lenovo Tab P12', brand: 'Lenovo', price: 34999, mrp: 49999,
      stock: 38, images: img('lenovotab'),
      description: '12.7-inch 3K display with MediaTek Dimensity 7050, 8GB RAM, and JBL-tuned quad speakers for immersive entertainment.',
      specs: { Processor: 'Dimensity 7050', Display: '12.7" 3K IPS 120Hz', Storage: '128GB', Camera: '13MP Rear, 8MP Front', Battery: '10200mAh', Connectivity: 'Wi-Fi 6, Bluetooth 5.1', OS: 'Android 13' },
    },
    {
      name: 'Xiaomi Pad 6', brand: 'Xiaomi', price: 26999, mrp: 34999,
      stock: 60, images: img('xiaomipad6'),
      description: 'Snapdragon 870 with 144Hz display, 8840mAh battery, and stylus support. Best value Android tablet in its segment.',
      specs: { Processor: 'Snapdragon 870', Display: '11" 2.8K IPS 144Hz', Storage: '128GB', Camera: '13MP Rear, 8MP Front', Battery: '8840mAh', Connectivity: 'Wi-Fi 6, Bluetooth 5.2', OS: 'MIUI 14' },
    },
  ],

  Audio: [
    {
      name: 'Sony WH-1000XM5', brand: 'Sony', price: 24990, mrp: 34990,
      stock: 60, isFeatured: true, images: img('sonywh1000'),
      description: 'Industry-leading noise cancellation with dual V1 and QN1 processors. 30-hour battery, Auto NC Optimizer, and Speak-to-Chat technology.',
      specs: { Type: 'Over-Ear Wireless', 'Driver Size': '30mm', Battery: '30 hrs (NC on)', ANC: 'Active (Dual Chip)', Connectivity: 'Bluetooth 5.2, NFC', Charging: 'USB-C, 3hr full', Weight: '250g' },
    },
    {
      name: 'Apple AirPods Pro (2nd Gen)', brand: 'Apple', price: 24900, mrp: 27900,
      stock: 55, images: img('airpodspro2'),
      description: 'H2 chip with Adaptive Audio, Personalized Spatial Audio, and 2x better ANC. MagSafe Charging Case with Find My.',
      specs: { Type: 'In-Ear TWS', Chip: 'Apple H2', ANC: 'Adaptive Transparency', Battery: '6 hrs + 24 hrs case', Connectivity: 'Bluetooth 5.3', Water: 'IPX4', Charging: 'MagSafe / USB-C' },
    },
    {
      name: 'JBL Flip 6', brand: 'JBL', price: 9499, mrp: 14999,
      stock: 90, images: img('jblflip6'),
      description: 'Powerful stereo sound with separate tweeters and racetrack-shaped woofer. IP67 waterproof with 12-hour playtime.',
      specs: { Type: 'Portable Speaker', Output: '30W', Battery: '12 hrs', Water: 'IP67', Connectivity: 'Bluetooth 5.1', Dimensions: '178 x 68 x 68 mm', Weight: '550g' },
    },
    {
      name: 'boAt Rockerz 558 Pro', brand: 'boAt', price: 1999, mrp: 4999,
      stock: 200, images: img('boatrockz'),
      description: 'Beast-Mode sound with 40mm drivers, active noise cancellation, and 70-hour battery life. ASAP charging: 10 minutes for 5 hours playtime.',
      specs: { Type: 'Over-Ear Wireless', 'Driver Size': '40mm', Battery: '70 hrs', ANC: 'Active', Connectivity: 'Bluetooth 5.3', Charging: 'ASAP (10min = 5hrs)', Weight: '240g' },
    },
    {
      name: 'Bose QuietComfort 45', brand: 'Bose', price: 24500, mrp: 34999,
      stock: 35, images: img('boseqc45'),
      description: 'World-class noise cancellation with Quiet and Aware modes. 24-hour battery, premium audio, and all-day comfort.',
      specs: { Type: 'Over-Ear Wireless', Battery: '24 hrs', ANC: 'Active (Quiet / Aware)', Connectivity: 'Bluetooth 5.1', Charging: 'USB-C', Weight: '240g', Foldable: 'Yes' },
    },
  ],

  Cameras: [
    {
      name: 'Canon EOS R50', brand: 'Canon', price: 74995, mrp: 89995,
      stock: 20, images: img('canoneosr50'),
      description: '24.2MP APS-C mirrorless camera with DIGIC X processor, Dual Pixel CMOS AF II, and 4K video. Perfect for content creators and beginners.',
      specs: { Sensor: '24.2MP APS-C CMOS', Processor: 'DIGIC X', AF: 'Dual Pixel CMOS AF II', Video: '4K 30fps / 1080p 120fps', 'Burst Rate': '15fps', Display: '3" Vari-Angle Touch', Connectivity: 'Wi-Fi, Bluetooth' },
    },
    {
      name: 'Sony Alpha ZV-E10', brand: 'Sony', price: 54990, mrp: 79990,
      stock: 18, images: img('sonyzve10'),
      description: 'APS-C mirrorless built for vlogging. Vari-angle LCD, real-time Eye AF, and directional 3-capsule microphone for creators.',
      specs: { Sensor: '24.2MP APS-C Exmor CMOS', Video: '4K 30fps / 1080p 120fps', AF: 'Real-time Eye AF', Display: '3" Vari-Angle Flip', Connectivity: 'Wi-Fi, Bluetooth', Weight: '343g (body only)' },
    },
    {
      name: 'Nikon Z30', brand: 'Nikon', price: 64995, mrp: 79995,
      stock: 22, images: img('nikonz30'),
      description: 'Compact APS-C mirrorless designed for video creators. 20.9MP sensor, 4K UHD, and in-body stabilization. No optical viewfinder for a lighter build.',
      specs: { Sensor: '20.9MP APS-C BSI CMOS', Video: '4K 30fps / 1080p 120fps', AF: 'Phase-detect 209 points', Display: '3" Tilting Touch', 'Battery Life': '300 shots', Connectivity: 'Wi-Fi, Bluetooth', Weight: '405g' },
    },
  ],

  "Men's Clothing": [
    {
      name: "Levi's 511 Slim Fit Jeans", brand: "Levi's", price: 2499, mrp: 4499,
      stock: 150, images: img('levisjeans'),
      description: "Classic 511 slim fit in stretch denim for comfort and flexibility. Levi's signature craftsmanship for all-day wear.",
      specs: { Fit: 'Slim', Material: '98% Cotton, 2% Elastane', Rise: 'Mid-Rise', Closure: 'Zip Fly', Care: 'Machine Wash' },
    },
    {
      name: 'Allen Solly Men Formal Shirt', brand: 'Allen Solly', price: 1299, mrp: 2499,
      stock: 200, images: img('allensollyformal'),
      description: 'Premium slim-fit full-sleeve formal shirt. Cotton-blend fabric for breathability and all-day freshness.',
      specs: { Fit: 'Slim Fit', Material: '60% Cotton, 40% Polyester', Sleeve: 'Full Sleeve', Collar: 'Spread Collar', Care: 'Machine Wash' },
    },
    {
      name: 'Nike Dri-FIT Training T-Shirt', brand: 'Nike', price: 1799, mrp: 2999,
      stock: 180, images: img('niketshirt'),
      description: "Dri-FIT technology wicks sweat away to keep you dry during workouts. Lightweight fabric with a relaxed fit.",
      specs: { Fit: 'Standard Fit', Material: '100% Polyester', Technology: 'Dri-FIT', Sleeve: 'Short Sleeve', Care: 'Machine Wash' },
    },
    {
      name: 'Peter England Men Chinos', brand: 'Peter England', price: 1899, mrp: 3499,
      stock: 120, images: img('pechinos'),
      description: 'Smart-casual slim taper chinos in super-soft cotton twill. All-day comfort for work or weekend outings.',
      specs: { Fit: 'Slim Taper', Material: '97% Cotton, 3% Elastane', Rise: 'Mid-Rise', Closure: 'Zip Fly', Pockets: '4 Pockets' },
    },
    {
      name: 'Tommy Hilfiger Classic Polo', brand: 'Tommy Hilfiger', price: 2999, mrp: 5499,
      stock: 80, images: img('tommypolo'),
      description: 'Iconic polo with signature flag embroidery. Premium cotton piqué fabric for a polished, comfortable look.',
      specs: { Fit: 'Regular Fit', Material: '100% Cotton Piqué', Sleeve: 'Short Sleeve', Collar: 'Polo Collar', Care: 'Machine Wash' },
    },
  ],

  "Women's Clothing": [
    {
      name: 'Biba Printed Anarkali Kurta', brand: 'Biba', price: 1499, mrp: 2999,
      stock: 120, isFeatured: true, images: img('bibaanarkali'),
      description: 'Elegant anarkali kurta with vibrant floral print in pure cotton. Perfect for festive and casual occasions.',
      specs: { Fabric: 'Pure Cotton', Style: 'Anarkali', Print: 'Floral', Sleeves: 'Three-Quarter', Occasion: 'Festive / Casual' },
    },
    {
      name: 'W for Woman Straight Kurta', brand: 'W', price: 899, mrp: 1799,
      stock: 180, images: img('wkurta'),
      description: 'Versatile straight-cut kurta with minimalist print, V-neckline, and side slits for easy movement.',
      specs: { Fabric: 'Polyester Blend', Style: 'Straight', Sleeves: 'Half Sleeves', Neckline: 'V-Neck', Occasion: 'Casual / Office' },
    },
    {
      name: 'H&M Floral Wrap Dress', brand: 'H&M', price: 1499, mrp: 2999,
      stock: 90, images: img('hmwrapdress'),
      description: 'Flowy wrap dress with floral print and side tie. Lightweight viscose drapes beautifully for a feminine silhouette.',
      specs: { Fabric: '100% Viscose', Style: 'Wrap', Pattern: 'Floral Print', Sleeves: 'Short Puff Sleeves', Occasion: 'Casual / Brunch' },
    },
    {
      name: 'Libas Embroidered Silk Suit Set', brand: 'Libas', price: 2499, mrp: 4999,
      stock: 65, images: img('libassuitset'),
      description: 'Luxurious art-silk suit set with intricate thread embroidery and matching dupatta. Perfect for celebrations.',
      specs: { Fabric: 'Art Silk', Style: 'Straight Kurta with Dupatta', Embroidery: 'Thread Work', Sleeves: 'Full Sleeves', Occasion: 'Festive / Wedding' },
    },
    {
      name: 'Aurelia Ethnic Palazzo Set', brand: 'Aurelia', price: 1799, mrp: 3499,
      stock: 110, images: img('aureliapalazo'),
      description: 'Trendy kurta-palazzo set in ethnic print. Comfortable rayon for an effortlessly chic ethnic look.',
      specs: { Fabric: 'Rayon', Style: 'Kurta + Palazzo', Print: 'Ethnic Motif', Sleeves: 'Three-Quarter', Occasion: 'Casual / Festive' },
    },
  ],

  Footwear: [
    {
      name: 'Nike Air Max 270', brand: 'Nike', price: 9995, mrp: 12995,
      stock: 60, isFeatured: true, images: img('nikeairmax'),
      description: "Nike's tallest Air unit delivers unrivaled all-day comfort. Breathable mesh upper with the iconic Air 270 heel cushioning.",
      specs: { Type: "Men's Lifestyle", Upper: 'Engineered Mesh', Sole: 'Rubber', 'Air Unit': 'Max Air 270', Closure: 'Lace-up' },
    },
    {
      name: 'Adidas Ultraboost 22', brand: 'Adidas', price: 12999, mrp: 17999,
      stock: 45, images: img('adidasultraboost'),
      description: 'Best energy-returning running shoes with BOOST midsole and Continental rubber outsole. Primeknit+ upper for a sock-like fit.',
      specs: { Type: "Men's Running", Upper: 'Primeknit+', Midsole: 'BOOST', Outsole: 'Continental™ Rubber', Drop: '10mm', 'Arch Type': 'Neutral' },
    },
    {
      name: 'Puma Softride Essential', brand: 'Puma', price: 2999, mrp: 5999,
      stock: 110, images: img('pumasoftride'),
      description: 'Cloud-like comfort with Softride foam midsole and slip-on design. Breathable mesh upper for everyday wear.',
      specs: { Type: 'Training / Casual', Upper: 'Mesh', Midsole: 'Softride Foam', Closure: 'Slip-On', Gender: 'Unisex' },
    },
    {
      name: 'Bata Power Oxford Shoes', brand: 'Bata', price: 1799, mrp: 3499,
      stock: 140, images: img('bataoxford'),
      description: 'Classic Oxford formal shoes with leather-finish upper and shock-absorbing TPR sole. Ideal for office and formal occasions.',
      specs: { Type: 'Formal', Upper: 'Synthetic Leather', Sole: 'TPR', Closure: 'Lace-up', Occasion: 'Office / Formal', Color: 'Black' },
    },
    {
      name: 'Skechers Go Walk 6', brand: 'Skechers', price: 4499, mrp: 7499,
      stock: 80, images: img('skechersgowalk'),
      description: 'Ultra-lightweight walking shoes with Air-Cooled Goga Mat insole and 5GEN midsole. Machine-washable slip-on design.',
      specs: { Type: 'Walking', Upper: 'Machine Washable Knit', Insole: 'Air-Cooled Goga Mat', Midsole: '5GEN', Closure: 'Slip-On', Weight: '200g per shoe' },
    },
  ],

  'Kitchen Appliances': [
    {
      name: 'Prestige Iris 750W Mixer Grinder', brand: 'Prestige', price: 2999, mrp: 5499,
      stock: 110, isFeatured: true, images: img('prestigemixer'),
      description: '750W Instatex motor with 3 stainless steel jars. Heavy-duty performance for everyday grinding, blending, and chutney making.',
      specs: { Power: '750W', Jars: '3 (1.5L + 1.0L + 0.4L)', Speed: '3 Speeds + Pulse', Material: 'Stainless Steel Jars', Warranty: '2 Yrs Product, 5 Yrs Motor' },
    },
    {
      name: 'LG 28L Convection Microwave', brand: 'LG', price: 12990, mrp: 19990,
      stock: 35, images: img('lgmicrowave'),
      description: 'Convection microwave with Smart Inverter technology and 301 auto-cook menus. Charcoal Healthy Cooking for healthier meals.',
      specs: { Capacity: '28 Litres', Type: 'Convection + Grill + Solo', Power: '900W', 'Auto Cook': '301 Menus', Voltage: '230V 50Hz', Warranty: '1 Year' },
    },
    {
      name: 'Philips HD9252 Air Fryer', brand: 'Philips', price: 6995, mrp: 11995,
      stock: 70, images: img('philipsairfryer'),
      description: 'Rapid Air Technology for crispy results with up to 90% less fat. 4.1L XXL capacity with 13 preset programs and digital touchscreen.',
      specs: { Capacity: '4.1L', Power: '1400W', Technology: 'Rapid Air', Programs: '13', Temperature: '80-200°C', Timer: '60 min', Warranty: '2 Years' },
    },
    {
      name: 'Pigeon Pressure Cooker 5L', brand: 'Pigeon', price: 899, mrp: 1799,
      stock: 200, images: img('pigeonpc'),
      description: 'Aluminium pressure cooker with induction-compatible base. Triple safety valve and ergonomic handles.',
      specs: { Capacity: '5 Litres', Material: 'Aluminium', Base: 'Induction Compatible', Safety: 'Triple Valve', Warranty: '2 Years' },
    },
    {
      name: 'Instant Pot Duo 5.7L', brand: 'Instant Pot', price: 8999, mrp: 13999,
      stock: 40, images: img('instantpot'),
      description: '7-in-1 electric pressure cooker: Pressure Cooker, Slow Cooker, Rice Cooker, Steamer, Sauté Pan, Yogurt Maker, Warmer.',
      specs: { Capacity: '5.7 Litres', Functions: '7-in-1', Power: '1200W', Programs: '14', 'Safety Features': '10+', Material: 'Stainless Steel Inner Pot', Warranty: '1 Year' },
    },
  ],

  'Home Decor': [
    {
      name: 'Nilkamal Plastic Chair Set of 4', brand: 'Nilkamal', price: 2499, mrp: 3999,
      stock: 90, images: img('nilkamalchair'),
      description: 'Durable UV-stabilised plastic chairs, weather-resistant and stackable for easy storage. Holds up to 150 kg per chair.',
      specs: { Material: 'Virgin Plastic', Capacity: '150 kg each', Dimensions: '87 x 55 x 48 cm', Stackable: 'Yes', Usage: 'Indoor / Outdoor', Warranty: '1 Year' },
    },
    {
      name: 'Story@Home 250TC King Bed Sheet Set', brand: 'Story@Home', price: 699, mrp: 1499,
      stock: 250, images: img('bedsheet'),
      description: '250 TC pure cotton bed sheet with 2 pillow covers. Soft, breathable, machine washable with fade-resistant reactive print.',
      specs: { Material: '100% Cotton', 'Thread Count': '250 TC', Size: 'King (108" x 108")', Includes: '1 Bed Sheet + 2 Pillow Covers', Care: 'Machine Washable' },
    },
    {
      name: 'Solaro Silent Wall Clock', brand: 'Solaro', price: 549, mrp: 999,
      stock: 180, images: img('wallclock'),
      description: 'Modern frameless wall clock with sweep silent mechanism. Acrylic glass lens for noise-free timekeeping.',
      specs: { Diameter: '30 cm', Mechanism: 'Silent Sweep', Power: '1x AA Battery', Frame: 'Acrylic', Mounting: 'Wall Hanging', Warranty: '1 Year' },
    },
    {
      name: 'India Circus Ceramic Decorative Vase', brand: 'India Circus', price: 999, mrp: 1999,
      stock: 75, images: img('decorvase'),
      description: 'Hand-painted ceramic vase with India Circus signature motifs. Elegant table decor piece for living room or bedroom.',
      specs: { Material: 'Ceramic', Height: '25 cm', Print: 'Hand Painted', Usage: 'Decorative / Flower Vase', Care: 'Wipe Clean', Origin: 'India' },
    },
  ],

  'Exercise Equipment': [
    {
      name: 'Kore 10 KG Rubber Hex Dumbbell Pair', brand: 'Kore', price: 999, mrp: 1999,
      stock: 120, images: img('hexdumbbell'),
      description: 'Solid cast-iron core with rubber hex coating — prevents rolling and floor damage. Knurled chrome handle for secure grip.',
      specs: { Weight: '10 kg (pair)', Material: 'Cast Iron + Rubber Coating', Shape: 'Hexagonal', Handle: 'Knurled Chrome', Use: 'Strength Training' },
    },
    {
      name: 'Boldfit Pro Yoga Mat 6mm', brand: 'Boldfit', price: 599, mrp: 1299,
      stock: 200, images: img('yogamat'),
      description: 'Anti-slip TPE yoga mat with alignment lines for correct posture. Eco-friendly, moisture-resistant with carrying strap included.',
      specs: { Thickness: '6mm', Material: 'TPE (Eco-Friendly)', Dimensions: '183 x 61 cm', Surface: 'Anti-Slip', Weight: '1 kg', Includes: 'Carrying Strap' },
    },
    {
      name: 'Lifelong Fit Pro Spin Bike', brand: 'Lifelong', price: 12999, mrp: 24999,
      stock: 20, isFeatured: true, images: img('spinbike'),
      description: '8 kg flywheel indoor cycling bike with adjustable seat, handlebar, and resistance dial. LED display for time, speed, distance, and calories.',
      specs: { Flywheel: '8 kg', Resistance: 'Friction (Manual)', Display: 'LED Multi-Function', 'Max User Weight': '110 kg', Seat: 'Adjustable (V + H)', Handlebar: 'Adjustable' },
    },
    {
      name: 'Nivia Kashmir Willow Cricket Bat', brand: 'Nivia', price: 799, mrp: 1599,
      stock: 85, images: img('cricketbat'),
      description: 'Full-size Kashmir Willow cricket bat with cane handle for shock absorption. Grade 2 willow for hard ball cricket on all pitches.',
      specs: { Wood: 'Kashmir Willow', Size: 'Full Size', Handle: 'Cane Handle', Weight: '1.1-1.3 kg', Grade: 'Grade 2', Cover: 'Included' },
    },
  ],

  Fiction: [
    {
      name: 'The Alchemist', brand: 'HarperCollins', price: 299, mrp: 399,
      stock: 300, images: img('alchemist'),
      description: "Paulo Coelho's masterpiece — the magical story of Santiago, a shepherd boy who follows his dream across the desert. Translated into 80+ languages.",
      specs: { Author: 'Paulo Coelho', Publisher: 'HarperCollins', Pages: '197', Language: 'English', Format: 'Paperback', Genre: 'Literary Fiction' },
    },
    {
      name: 'Wings of Fire: An Autobiography', brand: 'Universities Press', price: 199, mrp: 299,
      stock: 400, images: img('wingsoffire'),
      description: "APJ Abdul Kalam's inspiring autobiography tracing his journey from humble beginnings in Rameswaram to becoming the Missile Man of India.",
      specs: { Author: 'A.P.J. Abdul Kalam', Publisher: 'Universities Press', Pages: '204', Language: 'English', Format: 'Paperback', Genre: 'Autobiography' },
    },
  ],

  'Non-Fiction': [
    {
      name: 'Atomic Habits', brand: 'Penguin', price: 399, mrp: 499,
      stock: 350, isFeatured: true, images: img('atomichabits'),
      description: "James Clear's #1 NYT bestseller — a proven framework for building good habits and breaking bad ones through tiny, consistent changes.",
      specs: { Author: 'James Clear', Publisher: 'Penguin Random House', Pages: '320', Language: 'English', Format: 'Paperback', Genre: 'Self-Help / Productivity' },
    },
    {
      name: 'The Psychology of Money', brand: 'Harriman House', price: 349, mrp: 499,
      stock: 280, images: img('psychmoney'),
      description: "Morgan Housel's 19 timeless lessons on wealth, greed, and happiness — doing well with money is about behaviour, not knowledge.",
      specs: { Author: 'Morgan Housel', Publisher: 'Harriman House', Pages: '256', Language: 'English', Format: 'Paperback', Genre: 'Personal Finance' },
    },
  ],
};

// ─── Review comment pool ──────────────────────────────────────────────────────
const COMMENTS = [
  'Absolutely love this product! Exceeded my expectations in every way.',
  'Great value for money. Build quality is solid and performance is excellent.',
  'Delivery was super fast and packaging was very secure. Product is exactly as described.',
  'Been using this for a month now and it works perfectly. Highly recommended!',
  'Good product overall. Setup was easy and it works as advertised.',
  'The quality is impressive for the price. Will definitely buy again.',
  'Very happy with this purchase. Customer service was also helpful.',
  'Performs exactly as described. No complaints whatsoever.',
  'Slightly took time to arrive but the product quality made the wait worth it.',
  'Excellent! My family loves it. Already recommended to 3 friends.',
  'Durable and well-made. Exactly what I was looking for at this price range.',
  'Works like a charm. Interface is intuitive and easy to use.',
];

// ─── Indian addresses ─────────────────────────────────────────────────────────
const ADDRESSES = [
  { street: '42 MG Road, Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034' },
  { street: '15 Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001' },
  { street: '7 Park Street', city: 'Kolkata', state: 'West Bengal', pincode: '700016' },
  { street: '88 Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
  { street: '23 FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411004' },
  { street: '5 CG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009' },
  { street: '11 Hazratganj', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
  { street: '34 Sector 17', city: 'Chandigarh', state: 'Punjab', pincode: '160017' },
];

const ORDER_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'delivered'];
const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash on Delivery'];

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('Cleared existing collections');

    // ── Users ──
    const hashedAdmin = await bcrypt.hash('Admin@1234', SALT);
    const hashedUser  = await bcrypt.hash('User@1234',  SALT);

    const customerNames = [
      'Priya Sharma', 'Rahul Verma', 'Ananya Singh', 'Arjun Mehta',
      'Sneha Patel', 'Karthik Nair', 'Divya Reddy', 'Rohit Gupta',
    ];

    const userDocs = await User.insertMany([
      {
        name: 'Admin User', email: 'admin@flipkart.com',
        password: hashedAdmin, role: 'admin',
        addresses: [ADDRESSES[0]],
      },
      ...customerNames.map((name, i) => ({
        name, email: `user${i + 1}@flipkart.com`,
        password: hashedUser, role: 'user',
        addresses: [ADDRESSES[i % ADDRESSES.length]],
        phone: `98${String(1000000000 + i * 111111111).slice(0, 8)}`,
      })),
    ]);

    const [adminUser, ...customers] = userDocs;
    console.log(`Created ${userDocs.length} users`);

    // ── Categories ──
    const parentDocs = await Category.insertMany(
      PARENTS.map((p) => ({ name: p.name, slug: slug(p.name), image: p.image, parent: null }))
    );
    const parentMap = Object.fromEntries(parentDocs.map((d) => [d.name, d]));

    const subRows = [];
    for (const [parentName, subNames] of Object.entries(SUBS)) {
      for (const subName of subNames) {
        subRows.push({
          name: subName,
          slug: slug(subName),
          image: SUB_IMAGES[subName] || '',
          parent: parentMap[parentName]._id,
        });
      }
    }
    const subDocs = await Category.insertMany(subRows);
    const subMap = Object.fromEntries(subDocs.map((d) => [d.name, d]));
    console.log(`Created ${parentDocs.length + subDocs.length} categories`);

    // ── Products ──
    const allProductRows = [];
    for (const [catName, prods] of Object.entries(PRODUCTS)) {
      const catId = subMap[catName]._id;
      for (const p of prods) {
        allProductRows.push({
          name: p.name, description: p.description,
          price: p.price, mrp: p.mrp,
          images: p.images, category: catId,
          brand: p.brand, stock: p.stock,
          specs: p.specs || {},
          isFeatured: p.isFeatured || false,
          ratings: 0, numReviews: 0,
        });
      }
    }
    const productDocs = await Product.insertMany(allProductRows);
    console.log(`Created ${productDocs.length} products`);

    // ── Reviews ──
    const reviewRows = [];
    const seen = new Set(); // track "productId-userId" to respect unique index

    for (let pi = 0; pi < productDocs.length; pi++) {
      const product = productDocs[pi];
      const reviewCount = ri(3, 5);
      const reviewers = pick(customers, reviewCount);

      for (const customer of reviewers) {
        const key = `${product._id}-${customer._id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        reviewRows.push({
          product: product._id,
          user: customer._id,
          rating: ri(3, 5),
          comment: COMMENTS[(pi + reviewRows.length) % COMMENTS.length],
        });
      }
    }
    const reviewDocs = await Review.insertMany(reviewRows);
    console.log(`Created ${reviewDocs.length} reviews`);

    // Update product ratings and numReviews
    const ratingMap = {};
    for (const r of reviewDocs) {
      const id = r.product.toString();
      if (!ratingMap[id]) ratingMap[id] = { sum: 0, count: 0 };
      ratingMap[id].sum   += r.rating;
      ratingMap[id].count += 1;
    }
    await Promise.all(
      Object.entries(ratingMap).map(([id, { sum, count }]) =>
        Product.findByIdAndUpdate(id, {
          ratings: parseFloat((sum / count).toFixed(1)),
          numReviews: count,
        })
      )
    );
    console.log('Updated product ratings');

    // ── Orders ──
    const orderRows = [];
    for (let i = 0; i < customers.length; i++) {
      const customer  = customers[i];
      const orderCount = ri(1, 2);
      for (let o = 0; o < orderCount; o++) {
        const itemCount  = ri(1, 3);
        const items = pick(productDocs, itemCount).map((p) => ({
          product: p._id,
          quantity: ri(1, 2),
          price: p.price,
        }));
        const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

        orderRows.push({
          user: customer._id,
          items,
          address: ADDRESSES[i % ADDRESSES.length],
          payment: {
            method: PAYMENT_METHODS[ri(0, PAYMENT_METHODS.length - 1)],
            status: 'completed',
            transactionId: `TXN${Date.now()}${ri(1000, 9999)}`,
          },
          status: ORDER_STATUSES[ri(0, ORDER_STATUSES.length - 1)],
          total,
        });
      }
    }
    await Order.insertMany(orderRows);
    console.log(`Created ${orderRows.length} orders`);

    // ── Wishlists ──
    for (let i = 0; i < customers.length; i++) {
      const wishlistItems = pick(productDocs, ri(2, 5)).map((p) => p._id);
      await User.findByIdAndUpdate(customers[i]._id, { wishlist: wishlistItems });
    }
    console.log('Updated customer wishlists');

    // ── Carts (a few active carts) ──
    const cartCustomers = pick(customers, 4);
    await Promise.all(
      cartCustomers.map((customer) =>
        Cart.create({
          user: customer._id,
          items: pick(productDocs, ri(1, 3)).map((p) => ({ product: p._id, quantity: ri(1, 2) })),
        })
      )
    );
    console.log('Created sample carts');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n--- Login Credentials ---');
    console.log('Admin : admin@flipkart.com  / Admin@1234');
    customerNames.forEach((name, i) =>
      console.log(`User ${i + 1}: user${i + 1}@flipkart.com / User@1234  (${name})`)
    );
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
