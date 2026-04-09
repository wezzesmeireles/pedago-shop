#!/bin/bash
# Deploy Supabase Edge Functions
# Usage: SUPABASE_ACCESS_TOKEN=seu_token bash deploy-functions.sh

set -e

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Erro: defina SUPABASE_ACCESS_TOKEN antes de rodar"
  echo ""
  echo "Exemplo:"
  echo "  SUPABASE_ACCESS_TOKEN=sbp_xxx... bash deploy-functions.sh"
  echo ""
  echo "Gere seu token em: https://supabase.com/dashboard/account/tokens"
  exit 1
fi

PROJECT_REF="hdldxgbvkjcoesmfoglm"

echo "🚀 Deployando edge functions para projeto $PROJECT_REF..."

npx supabase functions deploy create-order \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

npx supabase functions deploy mp-webhook \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

npx supabase functions deploy reconcile-orders \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

echo ""
echo "✅ Edge functions deployadas com sucesso!"
echo ""
echo "URL do webhook para configurar no Mercado Pago:"
echo "  https://$PROJECT_REF.supabase.co/functions/v1/mp-webhook"
