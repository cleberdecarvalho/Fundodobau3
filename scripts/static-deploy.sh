#!/bin/bash

# Script para deploy da versão estática do Fundo Do Baú
# Uso: ./scripts/static-deploy.sh [start|stop|restart|status]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_PID_FILE="$PROJECT_DIR/.server.pid"
PORT=3000

# Função para obter PID do servidor
get_server_pid() {
    if [ -f "$SERVER_PID_FILE" ]; then
        cat "$SERVER_PID_FILE"
    else
        ps aux | grep "node-build.mjs" | grep -v grep | awk '{print $2}' | head -1
    fi
}

# Função para verificar se o servidor está rodando
is_server_running() {
    local pid=$(get_server_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Função para iniciar o servidor
start_server() {
    echo "🚀 Iniciando servidor de produção..."
    
    if is_server_running; then
        echo "⚠️  Servidor já está rodando (PID: $(get_server_pid))"
        return 1
    fi
    
    # Fazer build se necessário
    if [ ! -d "$PROJECT_DIR/dist" ]; then
        echo "📦 Fazendo build de produção..."
        cd "$PROJECT_DIR"
        npm run build
    fi
    
    # Iniciar servidor
    cd "$PROJECT_DIR"
    nohup node dist/server/node-build.mjs > .server.log 2>&1 &
    echo $! > "$SERVER_PID_FILE"
    
    # Aguardar servidor inicializar
    echo "⏳ Aguardando servidor inicializar..."
    sleep 3
    
    if is_server_running; then
        echo "✅ Servidor iniciado com sucesso!"
        echo "📱 Frontend: http://localhost:$PORT"
        echo "🔧 API: http://localhost:$PORT/api"
        echo "📋 Logs: $PROJECT_DIR/.server.log"
    else
        echo "❌ Erro ao iniciar servidor"
        return 1
    fi
}

# Função para parar o servidor
stop_server() {
    echo "🛑 Parando servidor..."
    
    local pid=$(get_server_pid)
    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null || true
        rm -f "$SERVER_PID_FILE"
        echo "✅ Servidor parado"
    else
        echo "ℹ️  Servidor não estava rodando"
    fi
}

# Função para reiniciar o servidor
restart_server() {
    echo "🔄 Reiniciando servidor..."
    stop_server
    sleep 2
    start_server
}

# Função para mostrar status
show_status() {
    if is_server_running; then
        local pid=$(get_server_pid)
        echo "✅ Servidor está rodando (PID: $pid)"
        echo "📱 Frontend: http://localhost:$PORT"
        echo "🔧 API: http://localhost:$PORT/api"
        
        # Testar conectividade
        if curl -s http://localhost:$PORT > /dev/null 2>&1; then
            echo "🌐 Conectividade: OK"
        else
            echo "❌ Conectividade: FALHA"
        fi
    else
        echo "❌ Servidor não está rodando"
    fi
}

# Função para mostrar logs
show_logs() {
    if [ -f "$PROJECT_DIR/.server.log" ]; then
        tail -f "$PROJECT_DIR/.server.log"
    else
        echo "ℹ️  Nenhum log encontrado"
    fi
}

# Função para fazer build
build_project() {
    echo "📦 Fazendo build de produção..."
    cd "$PROJECT_DIR"
    npm run build
    echo "✅ Build concluído!"
}

# Função para mostrar ajuda
show_help() {
    echo "🎬 Fundo Do Baú - Script de Deploy Estático"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  start     - Iniciar servidor de produção"
    echo "  stop      - Parar servidor"
    echo "  restart   - Reiniciar servidor"
    echo "  status    - Mostrar status do servidor"
    echo "  logs      - Mostrar logs em tempo real"
    echo "  build     - Fazer build de produção"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 start    # Iniciar servidor"
    echo "  $0 status   # Verificar status"
    echo "  $0 logs     # Ver logs"
}

# Main
case "${1:-help}" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    build)
        build_project
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Comando inválido: $1"
        show_help
        exit 1
        ;;
esac 