# Registo Clínico Interno (MVP PWA) – Fisioterapia Músculo-Esquelética

MVP simples com:
- Next.js + TypeScript + Tailwind
- Supabase (Auth + Postgres + RLS)
- OpenAI (transcrição, organização, relatório de alta)
- PWA instalável (manifest + service worker básico)

## 1) Instalação local

```bash
npm install
npm run dev
```

## 2) Configurar Supabase

1. Criar projeto no Supabase.
2. Em **Authentication > Users**, criar o primeiro utilizador (administrador).
3. Em **SQL Editor**, correr as migrações por ordem numérica, incluindo `009_clinical_access_and_archive.sql` e `010_scale_formats.sql`. Os ficheiros antigos `004_*` e `005_*` têm nomes repetidos: correr cada ficheiro apenas uma vez, segundo a lista de migrações do projeto.
4. Antes da migração `009`, criar um `profile` com `role = 'admin'` para o primeiro utilizador. Cada fisioterapeuta precisa igualmente de um `profile` para aceder à app. Nunca disponibilizar a chave `service_role` no navegador.
5. A migração `009` atribui acesso a utentes existentes com base nas sessões que já têm `clinician_id`. Para utentes antigos sem essa associação, o administrador abre o utente e atribui o fisioterapeuta no painel «Administração do utente». Verificar estas atribuições antes de usar a app com vários utilizadores.
6. O acesso clínico de cada fisioterapeuta fica limitado aos utentes atribuídos. O criador de um novo utente recebe acesso automaticamente; o administrador vê todos e pode gerir os acessos. As vistas de métricas ficam disponíveis apenas no endpoint administrativo do servidor.

Se o início de sessão funcionar mas a criação de utentes falhar com `new row violates row-level security policy for table "patient"`, confirmar no SQL Editor se o utilizador autenticado tem um registo em `public.profile` com o mesmo `id` de `auth.users`. A política `patient_create` exige esse perfil. Criar o perfil para a conta certa com o papel adequado, sem desativar RLS nem abrir a criação a qualquer conta autenticada. O SQL Editor não representa a sessão do utilizador da app, pelo que `auth.uid()` pode ser nulo nesse contexto.

Antes de aplicar `009` e `010` em produção, testar numa cópia da base de dados. Com um administrador e dois fisioterapeutas: criar um utente por cada fisioterapeuta; confirmar que o outro não consegue consultar nem modificar os dados pela interface **nem por chamadas diretas à Data API**; atribuir e retirar o acesso no painel administrativo; confirmar que um fisioterapeuta não consegue alterar `profile.role` ou consultar `admin_episode_metrics_v1`; arquivar e recuperar um episódio, uma sessão e uma escala. Testar a criação de QuickDASH, cada subescala KOOS e NDI em pontos e em percentagem; tentar inserir valores fora dos limites diretamente na Data API e confirmar que a base de dados os rejeita. Fazer uma cópia de segurança antes das migrações.

## 3) Variáveis de ambiente

Copiar `.env.example` para `.env.local` e preencher:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

> Nunca colocar segredos no cliente.

> Em produção (Vercel), define `NEXT_PUBLIC_APP_URL` com o domínio público da app (ex.: `https://app.exemplo.com`).

## 4) Fluxo de teste do MVP

1. Login (`/login`)
2. Criar paciente (`internal_code`)
3. Abrir paciente e criar episódio
4. Criar sessão (`/episodes/:id/sessions/new`)
5. Em cada secção:
   - Gravar áudio
   - Parar (transcrição OpenAI)
   - Organizar com AI
   - Editar texto final
6. Clicar **Concluir sessão**: todos os campos são guardados antes de sair da página. Se a gravação falhar, o formulário mantém-se aberto.
7. Inserir a escala com o instrumento, formato e, para KOOS, subescala. Os registos antigos sem formato mantêm-se identificados como «formato anterior por confirmar».
8. Criar e concluir lembretes manuais na página do episódio
9. Gerar relatório de alta
10. Editar e guardar nova versão (opção final)

### Modelos OpenAI

- Organização de notas e relatório de alta: `gpt-6-luna` (Chat Completions, sem raciocínio adicional, para manter o custo baixo). O relatório incompleto não é guardado.
- Transcrição de ficheiros de áudio: `gpt-transcribe`. Mantém o mesmo endpoint e o mesmo formato de resposta da app.
- Antes de disponibilizar a migração, testar com dados fictícios em português de Portugal: transcrição de fala com termos clínicos, organização de cada secção com campos vazios para informação ausente e relatório de alta com as oito secções. Confirmar que números, escalas e nomes não são inventados; o clínico deve rever o resultado.
- A chave `OPENAI_API_KEY` continua apenas no servidor. Confirmar que o projeto OpenAI tem acesso aos modelos e saldo disponível; testar as três funções no ambiente de produção depois do deploy.

## 5) Regras clínicas implementadas

- Dados clínicos estruturados em BD.
- AI apenas apoio à redação e síntese.
- AI não infere escalas.
- Sessão só guarda com ação manual; «Concluir sessão» guarda todos os campos visíveis.
- Lembretes manuais com histórico; avaliação automática de alertas ainda não implementada.
- Arquivo recuperável de episódios, sessões e escalas; apenas o administrador pode recuperar registos arquivados.
- Relatório versionado com `source_snapshot`.
- Áudio não é guardado; apenas transcrição textual. Os pedidos de áudio são limitados a 4 MiB para caberem nos limites de upload das Vercel Functions, e as transcrições não são escritas nos logs.
- O relatório de alta envia à OpenAI apenas o texto clínico revisto e as escalas, sem o código interno, a chave do utente ou as transcrições originais. Identificadores inseridos no texto livre continuam a fazer parte do texto enviado; evita-os e revê o relatório.

## 6) Endpoints

- `POST /api/audio/transcribe` (multipart: section + audio)
- `POST /api/ai/organize` (`{ section, transcricao }`)
- `POST /api/ai/discharge-report` (`{ episode_id }`)
- `POST /api/alerts/evaluate` devolve 501 enquanto a avaliação automática não estiver disponível.

## 7) PWA

- `app/manifest.ts`
- `public/sw.js`
- ícones placeholder em `public/icons/`
- offline básico para páginas/assets já visitadas
