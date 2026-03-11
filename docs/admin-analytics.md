# Admin Analytics Foundation

## Scope
This implementation adds a descriptive analytics layer and an admin dashboard. It is **prediction-ready data plumbing**, not a predictive/ML model.

## Outcome semantics
`episode_of_care.outcome_status` is now the analytics outcome field:
- `ongoing`
- `recovered`
- `dropout`
- `referred_out`
- `administrative_close`
- `unknown`

Operational closure (`status` + `end_date`) and analytics outcome are intentionally separate.

## Metric definitions
- `episode_duration_days` = `coalesce(outcome_date, end_date, current_date) - start_date`
- `recovery_days` = `outcome_date - start_date` only when `outcome_status = recovered`
- `averageRecoveryDays` = arithmetic mean of `recovery_days` in recovered episodes
- `medianRecoveryDays` = median of `recovery_days` in recovered episodes
- `averageSessionsPerRecoveredEpisode` = mean session count across recovered episodes

## Backfill policy
Historical `status = alta` was mapped to `outcome_status = unknown` (not recovered by default).
Reason: old records do not reliably encode recovery semantics, and auto-promoting to recovered would bias metrics.

## Current limitations
- `episode_label` is free text and needs human discipline for stable cohorts.
- Some historical episodes may remain with unknown outcomes or missing outcome dates.
- Clinician attribution depends on sessions having `clinician_id` set.

## Data quality signals
`admin_data_quality_v1` flags quality blockers including:
- missing title/label
- no sessions / no scales
- closed without outcome
- outcome without date
- recovered without outcome date
- date ordering errors
- sparse scale data

## Data entry discipline for future prediction work
To improve future forecasting readiness:
1. Always set `episode_label` using consistent terminology.
2. Explicitly set `outcome_status` on closure.
3. Fill `outcome_date` for closed episodes.
4. Keep `clinician_id` populated for every session.
5. Capture longitudinal scales (not only one observation).
