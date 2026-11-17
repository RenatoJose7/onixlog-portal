-- Execute uma vez no SQL Editor do Supabase.
-- Nenhum acesso anônimo é concedido. Somente a aplicação no servidor,
-- utilizando SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY em projetos
-- antigos), pode ler e salvar os dados.
create table if not exists public.project_progress (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.project_progress enable row level security;
revoke all on public.project_progress from anon, authenticated;
