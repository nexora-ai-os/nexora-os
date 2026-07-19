begin;

create or replace function public.reserve_sandbox_request(p_owner_id uuid, p_idempotency_key text, p_estimated_cost_usd numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month text := to_char(now(), 'YYYY-MM');
  v_month_start timestamptz := date_trunc('month', now());
  v_month_end timestamptz := date_trunc('month', now()) + interval '1 month';
  v_usage public.sandbox_usage_monthly;
  v_existing public.sandbox_request_reservations;
  v_reservation public.sandbox_request_reservations;
  v_reconciled_reserved numeric := 0;
begin
  if p_owner_id is null or p_idempotency_key is null or btrim(p_idempotency_key) = '' or p_estimated_cost_usd < 0 or p_estimated_cost_usd > 0.03 then raise exception 'authorization_or_request_limit'; end if;
  if not exists (select 1 from public.owner_profiles where owner_id = p_owner_id and role = 'owner' and status = 'active') then raise exception 'owner_not_active'; end if;

  insert into public.sandbox_usage_monthly(owner_id, month_key) values (p_owner_id, v_month) on conflict do nothing;
  select * into v_existing from public.sandbox_request_reservations where idempotency_key = p_idempotency_key for update;
  if found and v_existing.owner_id <> p_owner_id then raise exception 'authorization_or_request_limit'; end if;
  if found and v_existing.status in ('reserved', 'committed') then raise exception 'duplicate_request'; end if;

  select * into v_usage from public.sandbox_usage_monthly where owner_id = p_owner_id and month_key = v_month for update;
  select coalesce(sum(estimated_cost_usd), 0) into v_reconciled_reserved from public.sandbox_request_reservations where owner_id = p_owner_id and status = 'reserved' and created_at >= v_month_start and created_at < v_month_end;
  v_reconciled_reserved := greatest(0, v_reconciled_reserved);
  if v_usage.estimated_cost_usd + v_reconciled_reserved + p_estimated_cost_usd > 1.00 then raise exception 'monthly_limit'; end if;

  if v_existing.reservation_id is not null then
    update public.sandbox_request_reservations set estimated_cost_usd = p_estimated_cost_usd, status = 'reserved', expires_at = now() + interval '10 minutes', created_at = now(), updated_at = now() where reservation_id = v_existing.reservation_id returning * into v_reservation;
  else
    insert into public.sandbox_request_reservations(owner_id, idempotency_key, estimated_cost_usd, status, expires_at) values (p_owner_id, p_idempotency_key, p_estimated_cost_usd, 'reserved', now() + interval '10 minutes') returning * into v_reservation;
  end if;

  update public.sandbox_usage_monthly set reserved_cost_usd = greatest(0, v_reconciled_reserved) + p_estimated_cost_usd, updated_at = now() where owner_id = p_owner_id and month_key = v_month;
  return jsonb_build_object('reservationId', v_reservation.reservation_id);
end
$$;

revoke all on function public.reserve_sandbox_request(uuid,text,numeric) from public;
revoke all on function public.reserve_sandbox_request(uuid,text,numeric) from anon;
revoke all on function public.reserve_sandbox_request(uuid,text,numeric) from authenticated;
grant execute on function public.reserve_sandbox_request(uuid,text,numeric) to service_role;

commit;
