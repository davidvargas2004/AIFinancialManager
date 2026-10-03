-- Esquema inicial para Supabase. El usuario de la aplicacion es auth.users.id.
create extension if not exists pgcrypto;

do $$ begin
  create type public.estado_meta as enum ('ACTIVA', 'CUMPLIDA', 'CANCELADA');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tipo_inversion as enum ('ACCIONES', 'BONOS', 'FONDOS', 'CRIPTOMONEDAS', 'INMUEBLES', 'OTRO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.estado_inversion as enum ('ACTIVA', 'CERRADA', 'PAUSADA');
exception when duplicate_object then null;
end $$;

create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email varchar(320) not null unique,
  nombre varchar(120),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  nombre varchar(80) not null,
  color varchar(20),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint categorias_nombre_no_vacio check (length(btrim(nombre)) > 0),
  constraint categorias_usuario_nombre_unico unique (usuario_id, nombre),
  constraint categorias_usuario_id_unico unique (usuario_id, id)
);

create table if not exists public.ingresos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  categoria_id uuid not null,
  monto numeric(14, 2) not null,
  descripcion varchar(500),
  ocurrido_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint ingresos_categoria_del_usuario foreign key (usuario_id, categoria_id)
    references public.categorias (usuario_id, id) on delete restrict,
  constraint ingresos_monto_positivo check (monto > 0),
  constraint ingresos_descripcion_no_vacia check (descripcion is null or length(btrim(descripcion)) > 0)
);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  categoria_id uuid not null,
  monto numeric(14, 2) not null,
  descripcion varchar(500),
  ocurrido_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint gastos_categoria_del_usuario foreign key (usuario_id, categoria_id)
    references public.categorias (usuario_id, id) on delete restrict,
  constraint gastos_monto_positivo check (monto > 0),
  constraint gastos_descripcion_no_vacia check (descripcion is null or length(btrim(descripcion)) > 0)
);

create table if not exists public.metas_ahorro (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  nombre varchar(120) not null,
  descripcion varchar(500),
  monto_objetivo numeric(14, 2) not null,
  fecha_objetivo date,
  estado public.estado_meta not null default 'ACTIVA',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint metas_nombre_no_vacio check (length(btrim(nombre)) > 0),
  constraint metas_monto_objetivo_positivo check (monto_objetivo > 0),
  constraint metas_descripcion_no_vacia check (descripcion is null or length(btrim(descripcion)) > 0),
  constraint metas_usuario_id_unico unique (usuario_id, id)
);

create table if not exists public.aportes_ahorro (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  meta_id uuid not null,
  monto numeric(14, 2) not null,
  descripcion varchar(500),
  ocurrido_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  constraint aportes_meta_del_usuario foreign key (usuario_id, meta_id)
    references public.metas_ahorro (usuario_id, id) on delete cascade,
  constraint aportes_monto_positivo check (monto > 0),
  constraint aportes_descripcion_no_vacia check (descripcion is null or length(btrim(descripcion)) > 0)
);

create table if not exists public.inversiones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  nombre varchar(120) not null,
  tipo public.tipo_inversion not null,
  monto_invertido numeric(14, 2) not null,
  valor_actual numeric(14, 2) not null,
  estado public.estado_inversion not null default 'ACTIVA',
  fecha_inicio date not null default current_date,
  fecha_cierre date,
  descripcion varchar(500),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint inversiones_nombre_no_vacio check (length(btrim(nombre)) > 0),
  constraint inversiones_monto_positivo check (monto_invertido > 0),
  constraint inversiones_valor_no_negativo check (valor_actual >= 0),
  constraint inversiones_fechas_validas check (fecha_cierre is null or fecha_cierre >= fecha_inicio),
  constraint inversiones_descripcion_no_vacia check (descripcion is null or length(btrim(descripcion)) > 0)
);

create index if not exists categorias_usuario_id_idx on public.categorias (usuario_id);
create index if not exists ingresos_usuario_fecha_idx on public.ingresos (usuario_id, ocurrido_en desc);
create index if not exists ingresos_categoria_id_idx on public.ingresos (categoria_id);
create index if not exists gastos_usuario_fecha_idx on public.gastos (usuario_id, ocurrido_en desc);
create index if not exists gastos_categoria_id_idx on public.gastos (categoria_id);
create index if not exists metas_usuario_estado_idx on public.metas_ahorro (usuario_id, estado);
create index if not exists aportes_meta_fecha_idx on public.aportes_ahorro (usuario_id, meta_id, ocurrido_en desc);
create index if not exists inversiones_usuario_estado_idx on public.inversiones (usuario_id, estado);

create or replace function public.actualizar_fecha_modificacion()
returns trigger language plpgsql set search_path = public as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

do $triggers$
declare tabla text;
begin
  foreach tabla in array array['usuarios', 'categorias', 'ingresos', 'gastos', 'metas_ahorro', 'inversiones'] loop
    execute format('drop trigger if exists %I on public.%I', tabla || '_actualizar_fecha', tabla);
    execute format('create trigger %I before update on public.%I for each row execute function public.actualizar_fecha_modificacion()', tabla || '_actualizar_fecha', tabla);
  end loop;
end
$triggers$;

alter table public.usuarios enable row level security;
alter table public.categorias enable row level security;
alter table public.ingresos enable row level security;
alter table public.gastos enable row level security;
alter table public.metas_ahorro enable row level security;
alter table public.aportes_ahorro enable row level security;
alter table public.inversiones enable row level security;

drop policy if exists usuarios_propios_select on public.usuarios;
create policy usuarios_propios_select on public.usuarios for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists usuarios_propios_update on public.usuarios;
create policy usuarios_propios_update on public.usuarios for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists categorias_propias on public.categorias;
create policy categorias_propias on public.categorias for all to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

drop policy if exists ingresos_propios on public.ingresos;
create policy ingresos_propios on public.ingresos for all to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

drop policy if exists gastos_propios on public.gastos;
create policy gastos_propios on public.gastos for all to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

drop policy if exists metas_propias on public.metas_ahorro;
create policy metas_propias on public.metas_ahorro for all to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

drop policy if exists aportes_propios on public.aportes_ahorro;
create policy aportes_propios on public.aportes_ahorro for all to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);

drop policy if exists inversiones_propias on public.inversiones;
create policy inversiones_propias on public.inversiones for all to authenticated
using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);