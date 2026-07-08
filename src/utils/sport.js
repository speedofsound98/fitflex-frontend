// src/utils/sport.js
// Shared helpers for rendering sport-type icons + soft colored chips.

const SPORT_ICONS = {
  yoga: '🧘', pilates: '🤸', hiit: '🔥', cycling: '🚴', boxing: '🥊',
  swimming: '🏊', crossfit: '💪', dance: '💃', 'martial arts': '🥋',
  shiatsu: '🙌', running: '🏃', default: '🏃',
};

const CHIP_STYLES = [
  'bg-brand-100 text-brand-700',
  'bg-ink-100 text-ink-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
];

export function sportIcon(type) {
  if (!type) return SPORT_ICONS.default;
  return SPORT_ICONS[type.toLowerCase()] || SPORT_ICONS.default;
}

export function chipStyle(type) {
  const key = (type || 'default').toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return CHIP_STYLES[Math.abs(hash) % CHIP_STYLES.length];
}
