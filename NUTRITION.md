# Nutrition — plan & spec

Living doc for the `/nutrition` feature. Update as pieces ship.

## Shipped (v1)
- Per-user daily food log (`nutrition_entries`) with **estimate** (preset food × servings) and **exact** (manual macros) input modes.
- Daily totals vs. **manually-set** goals (protein / carbs / fat / calories), editable inline.
- Backend: `GET/POST/DELETE /api/nutrition`, `PATCH /api/nutrition/goal`; `users.nutrition_goal` JSONB.

## Planned (next): auto-configured goals from a body + training profile

Instead of typing goal numbers, the user fills a short **profile** and we compute their daily targets. Manual override still allowed (computed values just pre-fill the goal, which they can then tweak).

### Profile inputs
| Field | Notes |
|-------|-------|
| Sex (male / female) | **Yes, it matters** — the standard BMR formula differs by ~166 kcal/day. Offer a "prefer not to say" that defaults to the average of the two constants. |
| Weight (kg) | Drives BMR **and** protein-per-kg. Support lb → kg convert. |
| Height (cm) | BMR input. Support ft/in → cm. |
| Age (years) | **Required** by the Mifflin-St Jeor formula — the user didn't list it but we can't compute BMR without it. Ask for it. |
| Runs / week | count **and** typical duration (min) each → weekly running minutes |
| Strength sessions / week | count **and** typical duration (min) each → weekly strength minutes |
| Goal direction (optional) | maintain / lose / gain → −15% / +10% calorie adjust. v1 can default to **maintain**. |

### Formula (evidence-based, keep it in one place)
1. **BMR** — Mifflin-St Jeor:
   `BMR = 10·weight(kg) + 6.25·height(cm) − 5·age + s`, where `s = +5` (male), `−161` (female), `−78` (unspecified ≈ average).
2. **Training calories** from the actual weekly load (MET method), not a coarse "activity level" dropdown:
   `kcal/min = MET · 3.5 · weight(kg) / 200`
   - Running MET ≈ **9.8** (moderate/vigorous continuous)
   - Strength MET ≈ **5.0** (typical resistance session)
   - `weeklyTrainingKcal = runMin·runKcalPerMin + strengthMin·strengthKcalPerMin`
   - `trainingKcalPerDay = weeklyTrainingKcal / 7`
3. **TDEE** = `BMR · 1.2` (baseline NEAT for a non-training day) `+ trainingKcalPerDay`.
   Apply the optional goal-direction adjustment to get the **calorie target**.
4. **Protein** — scale g/kg with strength volume: `1.6 g/kg` (little/no lifting) → `2.2 g/kg` (frequent lifting). Interpolate on weekly strength minutes. `proteinG = clamp(1.6..2.2) · weight`.
5. **Fat** — `~27.5%` of calories, floor at `0.8 g/kg`. `fatG = max(0.275·kcal/9, 0.8·weight)`.
6. **Carbs** — remainder: `carbsG = (kcal − 4·proteinG − 9·fatG) / 4` (floor at 0).

Round protein/carbs/fat to whole grams, calories to nearest 10. Show the breakdown ("Here's why") so it's not a black box.

### Data / API
- Add `users.nutrition_profile` JSONB `{ sex, weight, height, age, runsPerWeek, runMin, strengthPerWeek, strengthMin, goalDir }`.
- **Compute server-side** (single source of truth): `PATCH /api/nutrition/profile` saves the profile, computes goals via the formula, writes `nutrition_goal`, and returns both. Keeps the math off the client and consistent.
- Keep the existing manual `PATCH /api/nutrition/goal` so users can still override after auto-calc.

### Frontend
- A "Set up my targets" panel on `/nutrition` (or a small profile modal): the inputs above, a live preview of the computed targets, and an **Apply** button that saves the profile and adopts the goals.
- Reuse `inputClass`, `Toggle`; unit toggles (kg/lb, cm/ft-in) are nice-to-have.

### Open questions to confirm before building
- **Age** — okay to require it? (Needed for BMR; alternative formulas that skip age are less accurate.)
- **Goal direction** — ship with maintain-only first, or include lose/gain from the start?
- **Units** — metric-only v1, or metric + imperial toggle?

### Verify
- `npm run build` passes; spot-check a couple of profiles against a known TDEE calculator to sanity-check the numbers.
