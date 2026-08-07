// src/utils/nutritionCalc.js
// Compute daily macro/calorie targets from a body + weekly-training profile.
// Mifflin-St Jeor BMR + MET-based training energy. See NUTRITION.md for rationale.

const SEX_CONSTANT = { male: 5, female: -161, other: -78 };
const GOAL_ADJUST = { maintain: 1, lose: 0.85, gain: 1.1 };
const RUN_MET = 9.8;      // moderate/vigorous continuous running
const STRENGTH_MET = 5.0; // typical resistance session

const num = v => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// Returns { calories, protein, carbs, fat } (whole grams, calories to nearest 10),
// or null if the essential fields (weight/height/age) are missing.
export function computeTargets(p = {}) {
  const weight = num(p.weight);
  const height = num(p.height);
  const age = num(p.age);
  if (!weight || !height || !age) return null;

  const s = SEX_CONSTANT[p.sex] ?? SEX_CONSTANT.other;
  const bmr = 10 * weight + 6.25 * height - 5 * age + s;

  const runWeeklyMin = num(p.runsPerWeek) * num(p.runMin);
  const strengthWeeklyMin = num(p.strengthPerWeek) * num(p.strengthMin);
  const kcalPerMin = met => (met * 3.5 * weight) / 200;
  const trainingKcalWeek =
    runWeeklyMin * kcalPerMin(RUN_MET) + strengthWeeklyMin * kcalPerMin(STRENGTH_MET);

  const tdee = bmr * 1.2 + trainingKcalWeek / 7;
  const calories = tdee * (GOAL_ADJUST[p.goalDir] ?? 1);

  // Protein 1.6→2.2 g/kg, scaling with weekly strength volume (caps at ~180 min/wk).
  const ppk = 1.6 + 0.6 * Math.min(1, strengthWeeklyMin / 180);
  const proteinG = ppk * weight;
  // Fat ~27.5% of calories, floored at 0.8 g/kg.
  const fatG = Math.max((0.275 * calories) / 9, 0.8 * weight);
  // Carbs fill the remainder.
  const carbsG = Math.max(0, (calories - 4 * proteinG - 9 * fatG) / 4);

  return {
    calories: Math.round(calories / 10) * 10,
    protein: Math.round(proteinG),
    carbs: Math.round(carbsG),
    fat: Math.round(fatG),
  };
}
