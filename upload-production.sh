#!/bin/bash

echo "🚀 Fazendo upload dos arquivos de produção para o servidor..."

# Configurações do servidor
SERVER="162.241.2.56"
USER="fundod14_fundodobau"
REMOTE_PATH="/home/fundod14/public_html/"

# Verificar se o build existe
if [ ! -d "dist/hostgator" ]; then
    echo "❌ Build não encontrado. Execute 'npm run build:hostgator' primeiro."
    exit 1
fi

# Fazer upload dos arquivos de produção
echo "📤 Enviando arquivos de produção..."
scp -r dist/hostgator/* $USER@$SERVER:$REMOTE_PATH

if [ $? -eq 0 ]; then
    echo "✅ Upload realizado com sucesso!"
    echo "🌐 Testando o site..."
    curl -s "https://www.fundodobaufilmes.com" | head -5
    echo ""
    echo "🧪 Testando API..."
    curl -s "https://www.fundodobaufilmes.com/api-filmes.php?action=list" | head -3
    echo ""
    echo "🎉 Deploy concluído! Acesse: https://www.fundodobaufilmes.com"
else
    echo "❌ Erro no upload"
    exit 1
fi
