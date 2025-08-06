#!/bin/bash

echo "🚀 Fazendo upload da API para o servidor..."

# Configurações do servidor
SERVER="162.241.2.56"
USER="fundod14_fundodobau"
REMOTE_PATH="/home/fundod14/public_html/"

# Fazer upload do arquivo
echo "📤 Enviando api-filmes.php..."
scp hostgator/api-filmes.php $USER@$SERVER:$REMOTE_PATH

if [ $? -eq 0 ]; then
    echo "✅ Upload realizado com sucesso!"
    echo "🌐 Criando tabela no banco..."
    curl -s "https://www.fundodobaufilmes.com/api-filmes.php" -X POST -H "Content-Type: application/json" -d '{"action":"create_table"}'
    echo ""
    echo "🧪 Testando API..."
    curl -s "https://www.fundodobaufilmes.com/api-filmes.php?action=list"
else
    echo "❌ Erro no upload"
fi 