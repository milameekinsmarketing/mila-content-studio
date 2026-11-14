-- Content Studio · Bloquear el guardado de pestañas con código viejo
--
-- Cada guardado de la app (desde la versión del 14-11-2026) manda una marca nueva en
-- la columna «escritura». Esta regla rechaza las escrituras que no la cambian: son las
-- de pestañas abiertas con una versión anterior de la app, que combinaban mal y
-- pisaban lo que se había guardado desde otra pestaña.
--
-- Se ejecuta una sola vez en Supabase → SQL Editor. Se puede repetir sin problema.

alter table public.workspace_state add column if not exists escritura text;

create or replace function public.exigir_escritura_nueva()
returns trigger language plpgsql as $$
begin
  if new.escritura is null or new.escritura is not distinct from old.escritura then
    raise exception 'Esta pestaña tiene una versión vieja del Content Studio: recárgala para guardar.';
  end if;
  return new;
end $$;

drop trigger if exists exigir_escritura_nueva on public.workspace_state;
create trigger exigir_escritura_nueva
  before update on public.workspace_state
  for each row execute function public.exigir_escritura_nueva();

-- Para quitar la regla:
--   drop trigger if exists exigir_escritura_nueva on public.workspace_state;
