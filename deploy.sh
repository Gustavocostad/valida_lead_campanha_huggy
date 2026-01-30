#!/bin/bash

# Script para fazer deploy da API no Docker Swarm

# Verifica se a API_KEY está configurada
if [ -z "$API_KEY" ]; then
    echo "⚠️  AVISO: API_KEY não está configurada!"
    echo "   Configure a variável de ambiente API_KEY antes do deploy:"
    echo "   export API_KEY=\$(openssl rand -hex 32)"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo "🔨 Construindo a imagem Docker..."
docker build -t valida_lead_campanha_huggy-api-convenio:latest .

if [ $? -ne 0 ]; then
    echo "❌ Erro ao construir a imagem"
    exit 1
fi

echo "🚀 Fazendo deploy no Docker Swarm..."
docker stack deploy -c docker-compose.swarm.yml api-convenio-stack

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer deploy"
    exit 1
fi

echo "⏳ Aguardando o serviço iniciar..."
sleep 5

echo "✅ Verificando status do serviço..."
docker service ps api-convenio-stack_api-convenio --no-trunc

echo ""
echo "📋 Para ver os logs:"
echo "   docker service logs -f api-convenio-stack_api-convenio"
echo ""
echo "📋 Para remover o serviço:"
echo "   docker stack rm api-convenio-stack"
echo ""
echo "✅ Deploy concluído!"

