# Produção no Dokploy

A aplicação Vue continua sendo uma SPA. O processo Node serve os arquivos do
frontend, executa todas as rotas de `api/` e encaminha `/v1` e o WebSocket
`/v1/realtime` para o Appwrite existente. Não depende de funções da Vercel.

## Compilação a partir do Git

- Contexto Docker: raiz do repositório.
- Dockerfile: `Dockerfile` da raiz.
- Porta interna: `3000`.
- Health check: `/healthz`.
- Domínios: `www.sitepedagogico.com` e `sitepedagogico.com`, com HTTPS.
- DNS: registros A de `@` e `www` apontando para o IP da VPS.
- Não alterar registros MX, TXT, DKIM ou outros registros de e-mail.

Variáveis de execução, configuradas apenas no Dokploy:

```dotenv
APPWRITE_ENDPOINT=https://appwrite.wsgestao.digital/v1
VITE_APPWRITE_PROJECT_ID=6a1bc2b1000d09c3f5f1
VITE_APPWRITE_DATABASE_ID=pedago-db
FRONTEND_URL=https://www.sitepedagogico.com
APPWRITE_API_KEY=<chave de servidor existente>
RESEND_API_KEY=<chave existente com permissão de envio>
```

As variáveis públicas do frontend estão em `apps/web/.env.production`.
Não colocar chaves de servidor em variáveis `VITE_*` nem nos arquivos estáticos.

## Login Google

O callback cadastrado no Google continua sendo:

```text
https://appwrite.wsgestao.digital/v1/account/sessions/oauth2/callback/google/6a1bc2b1000d09c3f5f1
```

O domínio em que o usuário abre a loja deve constar nas plataformas Web do
projeto Appwrite. O frontend retorna para `/auth/google-callback` no mesmo
domínio e troca o token por uma sessão através do proxy `/v1`.

## Implantação com pouco espaço em disco

A implantação emergencial foi enviada ao Dokploy como ZIP, com o frontend e
o servidor já compilados localmente. O Dockerfile desse artefato usa
`node:24-alpine`, copia somente `public/` e `http.cjs`, usa o usuário `node`
e expõe a porta 3000. Isso evita instalar as dependências de build na VPS.
O código fonte equivalente está neste repositório.

Para gerar os arquivos: `pnpm install --frozen-lockfile`, `pnpm build` e
`pnpm build:server`. Os resultados ficam em `apps/web/dist/` e
`dist-server/http.cjs`. Nunca incluir arquivos de credenciais no ZIP.

## Verificação

```sh
pnpm --filter web test
node scripts/check-dokploy.mjs https://www.sitepedagogico.com
```

O teste de leitura confere frontend, APIs públicas, proteção do envio de
produtos, token de download inválido e proxy Appwrite. O login Google deve
ser concluído com uma conta real para validar também o consentimento do Google.
