-- Mila Meekins Real Estate — Content Studio
-- Esquema de Supabase para reemplazar/complementar el almacenamiento en localStorage.
-- Ejecutar en: Supabase → SQL Editor → New query → pegar todo → Run.

-- Una sola tabla que guarda el estado completo del workspace como JSON,
-- igual a como hoy vive en localStorage bajo la clave "mila.studio.v1".
-- Se usa una única fila (id = 'default') porque es un workspace compartido,
-- no multi-tenant: todo el equipo y la clienta ven y editan lo mismo.
create table if not exists public.workspace_state (
  id text primary key default 'default',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Solo usuarios autenticados (los que tú invites desde Authentication → Users)
-- pueden leer o escribir. Nadie sin sesión iniciada puede tocar los datos.
alter table public.workspace_state enable row level security;

create policy "Authenticated users can read workspace"
  on public.workspace_state for select
  to authenticated
  using (true);

create policy "Authenticated users can insert workspace"
  on public.workspace_state for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update workspace"
  on public.workspace_state for update
  to authenticated
  using (true)
  with check (true);

-- Habilita Realtime (para que los cambios de una persona se reflejen
-- en la pantalla de las demás sin recargar) sobre esta tabla.
alter publication supabase_realtime add table public.workspace_state;
