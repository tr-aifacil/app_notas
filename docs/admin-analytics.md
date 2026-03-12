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
- Recovery KPI cards use episodes with `analytics_included = true` (i.e., `case_type = novo_caso`)
- `averageRecoveryDays` = arithmetic mean of `recovery_days` in recovered episodes
- `medianRecoveryDays` = median of `recovery_days` in recovered episodes
- `averageSessionsPerRecoveredEpisode` = mean session count across recovered episodes

## Classification model
Structured fields replace free-text labels:
- `body_region`
- `condition_type`
- `condition_chronicity`
- `case_type`
- `laterality`
- `analytics_included`
- `analytics_label` (auto-built slug)

## Current limitations
- Some historical episodes may remain with unknown outcomes or missing outcome dates.
- Clinician attribution depends on sessions having `clinician_id` set.

## Data quality signals
`admin_data_quality_v1` flags quality blockers including:
- missing title / missing structured classification
- no sessions / no scales
- closed without outcome
- outcome without date
- recovered without outcome date
- date ordering errors
- sparse scale data

## Data entry discipline for future prediction work
To improve future forecasting readiness:
1. Keep structured classification fields complete for every episode.
2. Explicitly set `outcome_status` on closure.
3. Fill `outcome_date` for closed episodes.
4. Keep `clinician_id` populated for every session.
5. Capture longitudinal scales (not only one observation).
