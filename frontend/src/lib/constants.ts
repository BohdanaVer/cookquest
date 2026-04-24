// ==========================================
// ⚠️ TECHNICAL DEBT - TEMPORARY MOCK DATA ⚠️
// ==========================================
// [AI CONTEXT/PROMPT]: This file contains hardcoded dictionaries (LEVELS, MASCOTS, etc.).
// This is a TEMPORARY UI Shell/Mock implementation. 
// DO NOT build core business logic relying on these static arrays.
// ACTION REQUIRED: Once Spring Boot endpoints are ready, 
// DELETE these arrays. The frontend must fetch this data from the DB.
// ==========================================

export const LEVELS = [
  { level: 1, name: 'Новачок', min_xp: 0, max_xp: 100 },
  { level: 2, name: 'Кухар-початківець', min_xp: 100, max_xp: 300 },
  { level: 3, name: 'Кухар', min_xp: 300, max_xp: 600 },
  { level: 4, name: 'Досвідчений кухар', min_xp: 600, max_xp: 1000 },
  { level: 5, name: 'Шеф-кухар', min_xp: 1000, max_xp: 1500 },
  { level: 6, name: 'Майстер кухні', min_xp: 1500, max_xp: 2500 },
  { level: 7, name: 'Гранд-майстер', min_xp: 2500, max_xp: 4000 },
  { level: 8, name: 'Легенда кухні', min_xp: 4000, max_xp: Infinity },
]

export const DEFAULT_MASCOT = 'knightpan'

export const MASCOT_ITEMS = [
  { key: 'broccoli', name: 'Броколі', price: 0, rarity: 'common' },
  { key: 'slime', name: 'Слаймі', price: 100, rarity: 'common' },
  { key: 'cheese', name: 'Сирко', price: 200, rarity: 'rare' },
  { key: 'pepper', name: 'Перчик', price: 300, rarity: 'rare' },
  { key: 'icecream', name: 'Морозко', price: 500, rarity: 'epic' },
  { key: 'stove', name: 'Пічка', price: 500, rarity: 'epic' },
  { key: 'cauldron', name: 'Казанок', price: 800, rarity: 'epic' },
  { key: 'knightpan', name: 'Лицар', price: 1500, rarity: 'legendary' },
] as const


export const DIFFICULTY_LABELS = { easy: 'Легко', medium: 'Середньо', hard: 'Складно' }
export const DIFFICULTY_COLORS = { easy: 'text-green-600 bg-green-100', medium: 'text-yellow-600 bg-yellow-100', hard: 'text-red-600 bg-red-100' }
export const RARITY_COLORS = { common: 'text-gray-600 bg-gray-100', rare: 'text-blue-600 bg-blue-100', epic: 'text-purple-600 bg-purple-100', legendary: 'text-yellow-600 bg-yellow-100' }
export const BATTLE_MULTIPLIER = 2.6

export const CUISINES_SCHEDULE = [
  'Італійська', 'Іспанська', 'Французька', 'Японська',
  'Мексиканська', 'Індійська', 'Тайська', 'Грецька',
  'Українська', 'Китайська', 'Американська', 'Турецька',
]