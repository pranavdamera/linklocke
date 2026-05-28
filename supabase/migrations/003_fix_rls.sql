-- Allow run creator to always select their own run.
-- Without this, the server action's .insert().select() returns null
-- because is_run_member() is false before run_players is populated.
create policy "runs_select_own_created" on public.runs
  for select using (created_by = auth.uid());

-- Also allow run creator to update (e.g. badge_count) before others join
create policy "runs_update_own_created" on public.runs
  for update using (created_by = auth.uid());
