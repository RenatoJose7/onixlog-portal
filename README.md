# ONIXLOG × MIREVA — Portal de Acompanhamento

Portal **funcional** com uma página pública de acompanhamento e uma área de administração protegida por senha. Foi desenvolvido com **HTML/CSS/JS e funções Node.js**, sem dependências de terceiros. Funciona localmente e pode ser publicado na Vercel.

## Funcionalidades

- Visual público responsivo (seis etapas, barra de progresso, próximas ações, datas e histórico)
- Painel `/admin` com senha única, protegida no servidor
- Edição de título, resumo, etapa atual, próximo passo, previsão e status/descrição/prazo de cada etapa
- Histórico de atualizações com data de publicação
- Progresso calculado automaticamente pela quantidade de etapas concluídas
- Supabase para persistência em produção ou JSON local em ambiente de desenvolvimento
- Página pública sem dados sensíveis e instrução `noindex` para buscadores

## Teste local

Requer Node.js 20+.

1. Execute `npm run setup` para gerar uma senha exclusiva e salvar a configuração local. Guarde a senha mostrada no terminal.
2. Execute `npm run dev`.
3. Abra `http://localhost:3000/` (página pública) e `http://localhost:3000/admin` (admin).

No ambiente local os dados são gravados em `.local-data/project.json` após o primeiro salvamento. Esse arquivo não entra no Git.

## Publicar na Vercel com persistência

1. Crie um projeto Supabase. No **SQL Editor**, execute `supabase.sql`.
2. Publique este diretório em um projeto na Vercel (framework **Other**, com funções Node.js no diretório `api/`).
3. Configure as seguintes variáveis **apenas no servidor** na Vercel:
   - `ADMIN_PASSWORD` — sua senha forte; **nunca publique no frontend**.
   - `SESSION_SECRET` — string aleatória secreta com pelo menos 32 caracteres.
   - `SUPABASE_URL` — URL do projeto Supabase.
   - `SUPABASE_SECRET_KEY` — chave secreta do Supabase para operações do servidor (nunca use `NEXT_PUBLIC_`). Projetos antigos também podem usar `SUPABASE_SERVICE_ROLE_KEY`.
4. Faça o deploy, abra `/admin`, entre com a senha e salve a primeira atualização.
5. Compartilhe o endereço da **página pública `/`** com Marcelo; mantenha a senha somente com você.

> **Atenção:** sem Supabase configurado, o armazenamento no servidor da Vercel não é persistente. Por segurança, a API apresenta erro de configuração em produção em vez de aceitar atualizações que seriam perdidas.

## Segurança e limites

- A página pública não tem login. **Qualquer pessoa com a URL poderá visualizar o conteúdo**. Não publique valores comerciais, dados de clientes, credenciais ou documentos pessoais.
- A senha é conferida no servidor e nunca enviada ao navegador, exceto na requisição de login por HTTPS.
- Sessão via cookie `HttpOnly; SameSite=Strict; Secure` na Vercel, com duração de 8 horas.
- Senhas e tokens não devem ser incluídos no repositório. Não divulgue `.env.local`.
- Controle básico de tentativas de login implementado na memória do processo; para produção recomenda-se proteção adicional de requisições pelo firewall/rate limit da plataforma, pois funções serverless podem usar diferentes instâncias.
- O projeto usa uma única conta administrativa. Não é sistema de gestão de usuários.
- A Vercel e o Supabase têm seus respectivos limites/custos. Planos gratuitos podem ser suficientes para este uso pequeno, mas não há garantia de preço ou disponibilidade.

## Estrutura

```
public/index.html    - página pública
public/admin.html    - interface administrativa
public/styles.css    - identidade visual e responsividade
public/main.js       - renderização do andamento
public/admin.js      - edição e autenticação
api/*.js             - rotas da API Vercel
lib/project.js       - banco, validação e progresso
lib/auth.js          - sessão por senha e cookie seguro
server.js            - servidor local
supabase.sql         - tabela necessária para a produção
```

## Evoluções opcionais

- Eventos por etapa e anexos de aprovação
- Uma tela multi-projetos para Mireva
- Acesso restrito também para Marcelo, se o projeto deixar de ser público
