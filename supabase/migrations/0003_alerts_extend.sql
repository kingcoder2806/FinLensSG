-- 0003 — extend the alerts table for the Alerts feature.
-- Adds tenor (for FD alerts), a human label, and notification bookkeeping.
-- All additive and idempotent.

alter table alerts add column if not exists tenor_months    integer;
alter table alerts add column if not exists label            text;
alter table alerts add column if not exists last_triggered_at timestamptz;
alter table alerts add column if not exists last_value       numeric;

create index if not exists alerts_email_idx on alerts (email);
create index if not exists alerts_active_idx on alerts (active);
