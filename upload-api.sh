#!/bin/bash

# Script para fazer upload do arquivo API para o Hostgator
echo "🚀 Fazendo upload do arquivo API para o Hostgator..."

# Configurações do Hostgator
HOST="fundodobau.com.br"
USER="fundod14"
REMOTE_DIR="public_html"

# Fazer upload do arquivo API
echo "📤 Enviando api-filmes.php..."
scp hostgator/api-filmes.php $USER@$HOST:$REMOTE_DIR/

if [ $? -eq 0 ]; then
    echo "✅ Upload realizado com sucesso!"
    echo "🌐 API disponível em: https://fundodobau.com.br/api-filmes.php"
else
    echo "❌ Erro no upload. Verifique as credenciais SSH."
    echo "💡 Alternativa: Faça upload manual via cPanel File Manager"
fi

echo ""
echo "📋 Próximos passos:"
echo "1. Execute o script SQL: database/remover_preferencias.sql"
echo "2. Teste a API: http://localhost:8082/test-api-auth.html"
echo "3. Teste o frontend: http://localhost:8081" 