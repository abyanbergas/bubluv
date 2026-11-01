import fs from 'fs';
import path from 'path';

const items = [
  { name: 'strawberry', title: 'Strawberry Series', bg1: '#FF9EB5', bg2: '#F5A8D0', drink: '#FF4D80', cup: '#FFF0F5' },
  { name: 'matcha', title: 'Matcha Series', bg1: '#98D8AA', bg2: '#4E9F3D', drink: '#5B8C51', cup: '#F0FFF4' },
  { name: 'creamy', title: 'Creamy Series', bg1: '#D8B4F8', bg2: '#7652A8', drink: '#9D65C9', cup: '#FAF5FF' },
  { name: 'chocolate', title: 'Chocolate Series', bg1: '#C89666', bg2: '#5C3D2E', drink: '#4A2E1B', cup: '#FFF8F0' },
  { name: 'fruit', title: 'Fruit Series', bg1: '#FFD369', bg2: '#FF9F45', drink: '#FFA41B', cup: '#FFFDF0' },
  { name: 'coffee', title: 'Coffee Series', bg1: '#E0C097', bg2: '#8E5A36', drink: '#633919', cup: '#FAF6F0' },
];

const products = [
  { file: 'strawberry-milk', title: 'Strawberry Milk', color1: '#FF8FAB', color2: '#FB6F92', accent: '#FFF0F5', boba: '#35264A' },
  { file: 'matcha-latte', title: 'Matcha Latte', color1: '#88C070', color2: '#558B2F', accent: '#EDF7ED', boba: '#2E4C1E' },
  { file: 'taro-milk', title: 'Taro Milk', color1: '#BA90C6', color2: '#7652A8', accent: '#F6EDF8', boba: '#35264A' },
  { file: 'dark-chocolate', title: 'Dark Chocolate', color1: '#795548', color2: '#3E2723', accent: '#ECEFF1', boba: '#1F110B' },
  { file: 'red-velvet', title: 'Red Velvet', color1: '#E53935', color2: '#880E4F', accent: '#FFEBEE', boba: '#420612' },
  { file: 'vanilla-milk', title: 'Vanilla Milk', color1: '#FFF3B0', color2: '#E0A96D', accent: '#FFFFFF', boba: '#35264A' },
  { file: 'chocolate-hazelnut', title: 'Choco Hazelnut', color1: '#A1887F', color2: '#4E342E', accent: '#F5EBE6', boba: '#26140D' },
  { file: 'mango-tango', title: 'Mango Tango', color1: '#FFCA28', color2: '#F57C00', accent: '#FFF8E1', boba: '#BF360C' },
  { file: 'caramel-macchiato', title: 'Caramel Macchiato', color1: '#D7CCC8', color2: '#6D4C41', accent: '#EFEBE9', boba: '#3E2723' },
];

function makeCategorySvg(item) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
    <defs>
      <linearGradient id="bg_${item.name}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${item.bg1}"/>
        <stop offset="100%" stop-color="${item.bg2}"/>
      </linearGradient>
      <linearGradient id="cup_${item.name}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${item.cup}"/>
        <stop offset="100%" stop-color="${item.drink}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" rx="24" fill="url(#bg_${item.name})"/>
    <circle cx="200" cy="150" r="100" fill="#FFFFFF" opacity="0.2"/>
    <circle cx="90" cy="80" r="30" fill="#FFFFFF" opacity="0.15"/>
    <circle cx="310" cy="220" r="45" fill="#FFFFFF" opacity="0.15"/>

    <!-- Cup -->
    <g transform="translate(140, 50)">
      <!-- Straw -->
      <path d="M70 10 L85 -20 C87 -24 92 -24 94 -20 L96 -16" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="60" cy="40" rx="45" ry="14" fill="#FFFFFF" opacity="0.9"/>
      <path d="M20 40 L35 150 C37 165 50 170 60 170 C70 170 83 165 85 150 L100 40 Z" fill="url(#cup_${item.name})"/>
      <!-- Boba pearls -->
      <circle cx="50" cy="145" r="7" fill="#35264A" opacity="0.8"/>
      <circle cx="70" cy="148" r="8" fill="#35264A" opacity="0.8"/>
      <circle cx="60" cy="130" r="6.5" fill="#35264A" opacity="0.8"/>
      <circle cx="42" cy="125" r="5" fill="#35264A" opacity="0.7"/>
      <circle cx="78" cy="128" r="6" fill="#35264A" opacity="0.7"/>
    </g>

    <text x="200" y="260" text-anchor="middle" font-family="'Poppins', sans-serif" font-weight="700" font-size="20" fill="#FFFFFF" letter-spacing="0.5">
      ${item.title}
    </text>
  </svg>`;
}

function makeProductSvg(prod) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" fill="none">
    <defs>
      <linearGradient id="bg_${prod.file}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FAF5FF"/>
        <stop offset="100%" stop-color="#E9DDFB"/>
      </linearGradient>
      <linearGradient id="pouch_${prod.file}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${prod.color1}"/>
        <stop offset="100%" stop-color="${prod.color2}"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#7652A8" flood-opacity="0.18"/>
      </filter>
    </defs>

    <rect width="500" height="500" rx="32" fill="url(#bg_${prod.file})"/>
    
    <!-- Background sparkles & circles -->
    <circle cx="120" cy="100" r="60" fill="${prod.color1}" opacity="0.18"/>
    <circle cx="380" cy="380" r="80" fill="${prod.color2}" opacity="0.15"/>
    <circle cx="420" cy="130" r="25" fill="#F5A8D0" opacity="0.3"/>
    
    <!-- Drink Pouch Package Illustration -->
    <g transform="translate(130, 70)" filter="url(#shadow)">
      <!-- Standing Pouch Outline -->
      <path d="M30 40 L210 40 L225 310 C226 335 190 350 120 350 C50 350 14 335 15 310 Z" fill="url(#pouch_${prod.file})"/>
      
      <!-- Zipper / Top Seal -->
      <rect x="25" y="25" width="190" height="15" rx="4" fill="#35264A" opacity="0.75"/>
      <line x1="30" y1="32" x2="210" y2="32" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 3" opacity="0.6"/>

      <!-- Center Product Label Badge -->
      <rect x="40" y="80" width="160" height="210" rx="16" fill="#FFFFFF" opacity="0.95"/>
      
      <!-- BubLuv Logo on Pouch -->
      <g transform="translate(65, 95)">
        <text font-family="'Poppins', sans-serif" font-weight="800" font-size="19" fill="#35264A">
          Bub<tspan fill="#7652A8">Luv</tspan>
        </text>
        <text y="14" font-family="'Poppins', sans-serif" font-weight="600" font-size="6.5" fill="#746A7E" letter-spacing="1.5">
          POWDER DRINK
        </text>
      </g>
      
      <!-- Drink Glass Graphic on Badge -->
      <g transform="translate(85, 140)">
        <rect x="15" y="5" width="40" height="65" rx="8" fill="${prod.color1}"/>
        <path d="M15 35 Q 35 42 55 35 L 55 62 C 55 68 50 70 35 70 C 20 70 15 68 15 62 Z" fill="${prod.color2}"/>
        <circle cx="28" cy="60" r="3.5" fill="${prod.boba}"/>
        <circle cx="42" cy="62" r="4" fill="${prod.boba}"/>
        <circle cx="35" cy="52" r="3" fill="${prod.boba}"/>
        <!-- Straw -->
        <line x1="35" y1="5" x2="42" y2="-12" stroke="#F5A8D0" stroke-width="3.5" stroke-linecap="round"/>
      </g>

      <!-- Flavor Name on Badge -->
      <text x="120" y="235" text-anchor="middle" font-family="'Poppins', sans-serif" font-weight="700" font-size="12" fill="#35264A">
        ${prod.title}
      </text>

      <!-- Weight badge -->
      <rect x="80" y="252" width="80" height="20" rx="10" fill="#E9DDFB"/>
      <text x="120" y="266" text-anchor="middle" font-family="'Poppins', sans-serif" font-weight="600" font-size="9" fill="#7652A8">
        NETTO 500g
      </text>
    </g>

    <!-- Fresh garnish / heart icon -->
    <g transform="translate(345, 140)">
      <circle cx="25" cy="25" r="25" fill="#FFFFFF" filter="url(#shadow)"/>
      <path d="M25 20 C23 16 19 17 19 21 C19 25 25 29 25 29 C25 29 31 25 31 21 C31 17 27 16 25 20 Z" fill="#F5A8D0"/>
    </g>
  </svg>`;
}

const frontendImg = 'd:/BUBLUV/frontend/public/images';
const backendImg = 'd:/BUBLUV/backend/public/images';

items.forEach(cat => {
  const svg = makeCategorySvg(cat);
  ['categories'].forEach(folder => {
    fs.writeFileSync(path.join(frontendImg, folder, `${cat.name}.png`), svg);
    fs.writeFileSync(path.join(frontendImg, folder, `${cat.name}.svg`), svg);
    fs.writeFileSync(path.join(backendImg, folder, `${cat.name}.png`), svg);
    fs.writeFileSync(path.join(backendImg, folder, `${cat.name}.svg`), svg);
  });
});

products.forEach(prod => {
  const svg = makeProductSvg(prod);
  ['products'].forEach(folder => {
    fs.writeFileSync(path.join(frontendImg, folder, `${prod.file}.png`), svg);
    fs.writeFileSync(path.join(frontendImg, folder, `${prod.file}.svg`), svg);
    fs.writeFileSync(path.join(backendImg, folder, `${prod.file}.png`), svg);
    fs.writeFileSync(path.join(backendImg, folder, `${prod.file}.svg`), svg);
  });
});

console.log('All product and category images generated successfully!');
