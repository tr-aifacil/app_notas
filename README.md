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
2. Em **SQL Editor**, correr por ordem:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_rls.sql`
3. Em **Authentication > Users**, criar utilizador email/password.
4. Inserir `profile` para esse utilizador (opcional no MVP).

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
6. Clicar **Validar e Guardar**
7. Inserir escala manualmente (END validado 0–10)
8. Ver alertas na página do episódio (ignorar fica em log)
9. Gerar relatório de alta
10. Editar e guardar nova versão (opção final)

## 5) Regras clínicas implementadas

- Dados clínicos estruturados em BD.
- AI apenas apoio à redação e síntese.
- AI não infere escalas.
- Sessão só guarda com ação manual.
- Alertas informativos, ignoráveis, e com histórico.
- Relatório versionado com `source_snapshot`.
- Áudio não é guardado; apenas transcrição textual.

## 6) Endpoints

- `POST /api/audio/transcribe` (multipart: section + audio)
- `POST /api/ai/organize` (`{ section, transcricao }`)
- `POST /api/ai/discharge-report` (`{ episode_id }`)
- `POST /api/alerts/evaluate` (`{ episode_id }`)

## 7) PWA

- `app/manifest.ts`
- `public/sw.js`
- ícones placeholder em `public/icons/`
- offline básico para páginas/assets já visitadas
