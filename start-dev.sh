#!/bin/bash

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Matar processos existentes
echo "🔄 Parando processos existentes..."
pkill -f filmes-api 2>/dev/null || true

# Aguardar um pouco
sleep 2

# Iniciar servidor SQLite
echo "🔄 Iniciando servidor SQLite..."
npx tsx server/filmes-api.ts &
SERVER_PID=$!

# Aguardar servidor iniciar
echo "⏳ Aguardando servidor iniciar..."
sleep 3

# Testar se servidor está funcionando
echo "🧪 Testando servidor..."
if curl -s http://localhost:3333/api/filmes > /dev/null; then
    echo "✅ Servidor SQLite funcionando!"
else
    echo "❌ Erro: Servidor não está respondendo"
    exit 1
fi

echo "🎯 Ambiente pronto! Agora execute: npm run dev"
echo "📊 Servidor SQLite rodando na porta 3333"
echo "🌐 Frontend será iniciado na porta 8080/8081/8082"

# Manter script rodando
wait $SERVER_PID 