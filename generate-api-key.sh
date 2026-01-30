#!/bin/bash

# Script para gerar uma API Key segura

echo "🔐 Gerando API Key segura..."
API_KEY=$(openssl rand -hex 32)

echo ""
echo "✅ API Key gerada:"
echo "   $API_KEY"
echo ""
echo "📋 Para usar no deploy, execute:"
echo "   export API_KEY=\"$API_KEY\""
echo "   ./deploy.sh"
echo ""
echo "📋 Ou adicione ao seu .env:"
echo "   API_KEY=$API_KEY"
echo ""

