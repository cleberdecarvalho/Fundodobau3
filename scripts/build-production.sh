#!/bin/bash

# =====================================================
# Script de Build para Produção - Fundo Do Baú
# =====================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# =====================================================
# Verificações Iniciais
# =====================================================

log "🚀 Iniciando build de produção..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    warn "node_modules não encontrado. Instalando dependências..."
    npm install
fi

# =====================================================
# Limpeza
# =====================================================

log "🧹 Limpando builds anteriores..."

# Remover builds anteriores
if [ -d "dist" ]; then
    rm -rf dist
    log "✅ Pasta dist removida"
fi

if [ -d "build" ]; then
    rm -rf build
    log "✅ Pasta build removida"
fi

# =====================================================
# Build do Frontend
# =====================================================

log "🔨 Gerando build do frontend..."

# Definir variáveis de ambiente para produção
export NODE_ENV=production
export VITE_APP_ENV=production

# Build do frontend
npm run build:client

if [ $? -eq 0 ]; then
    log "✅ Build do frontend concluído"
else
    error "❌ Erro no build do frontend"
    exit 1
fi

# =====================================================
# Verificações do Build
# =====================================================

log "🔍 Verificando arquivos gerados..."

# Verificar se os arquivos principais existem
if [ ! -f "dist/spa/index.html" ]; then
    error "index.html não encontrado"
    exit 1
fi

if [ ! -d "dist/spa/assets" ]; then
    error "Pasta assets não encontrada"
    exit 1
fi

# Contar arquivos gerados
HTML_COUNT=$(find dist/spa -name "*.html" | wc -l)
CSS_COUNT=$(find dist/spa -name "*.css" | wc -l)
JS_COUNT=$(find dist/spa -name "*.js" | wc -l)

log "📊 Arquivos gerados:"
log "   - HTML: $HTML_COUNT"
log "   - CSS: $CSS_COUNT"
log "   - JS: $JS_COUNT"

# =====================================================
# Otimizações
# =====================================================

log "⚡ Aplicando otimizações..."

# Criar pasta para upload de imagens
mkdir -p dist/spa/images/filmes
log "✅ Pasta images/filmes criada"

# Copiar arquivo .htaccess se existir
if [ -f ".htaccess" ]; then
    cp .htaccess dist/spa/
    log "✅ .htaccess copiado"
fi

# =====================================================
# Preparar arquivos para Hostgator
# =====================================================

log "📦 Preparando arquivos para Hostgator..."

# Criar pasta de deploy
mkdir -p dist/hostgator

# Copiar arquivos do frontend
cp -r dist/spa/* dist/hostgator/

# Copiar arquivo PHP da API
if [ -f "hostgator/api-filmes.php" ]; then
    cp hostgator/api-filmes.php dist/hostgator/
    log "✅ api-filmes.php copiado"
else
    warn "⚠️  api-filmes.php não encontrado em hostgator/"
fi

# Copiar arquivo SQL se existir
if [ -f "hostgator/filmes.sql" ]; then
    cp hostgator/filmes.sql dist/hostgator/
    log "✅ filmes.sql copiado"
fi

# =====================================================
# Gerar relatório
# =====================================================

log "📋 Gerando relatório de build..."

# Calcular tamanhos
FRONTEND_SIZE=$(du -sh dist/spa | cut -f1)
TOTAL_SIZE=$(du -sh dist/hostgator | cut -f1)

# Criar arquivo de relatório
cat > dist/hostgator/BUILD_REPORT.md << EOF
# Relatório de Build - Fundo Do Baú

## 📊 Informações do Build

- **Data**: $(date)
- **Ambiente**: Produção
- **Frontend**: $FRONTEND_SIZE
- **Total**: $TOTAL_SIZE

## 📁 Estrutura de Arquivos

\`\`\`
$(find dist/hostgator -type f | sort)
\`\`\`

## 🚀 Instruções de Deploy

1. **Upload para Hostgator**:
   - Faça upload de todos os arquivos para \`public_html/\`
   - Mantenha a estrutura de pastas

2. **Configurar Banco**:
   - Importe \`filmes.sql\` no phpMyAdmin
   - Configure \`api-filmes.php\` com suas credenciais

3. **Testar**:
   - Acesse seu domínio
   - Teste login: admin@fundodobau.com.br / admin123

## 📝 Notas

- Build gerado automaticamente
- Otimizado para produção
- Compatível com Hostgator
EOF

log "✅ Relatório gerado: dist/hostgator/BUILD_REPORT.md"

# =====================================================
# Verificação Final
# =====================================================

log "🔍 Verificação final..."

# Verificar se tudo está no lugar
if [ -f "dist/hostgator/index.html" ] && [ -f "dist/hostgator/api-filmes.php" ]; then
    log "✅ Todos os arquivos estão prontos para deploy"
else
    error "❌ Arquivos essenciais não encontrados"
    exit 1
fi

# =====================================================
# Resumo Final
# =====================================================

echo ""
log "🎉 Build de produção concluído com sucesso!"
echo ""
info "📁 Arquivos prontos para deploy:"
info "   - Frontend: dist/spa/"
info "   - Hostgator: dist/hostgator/"
echo ""
info "📋 Próximos passos:"
info "   1. Upload dos arquivos para Hostgator"
info "   2. Configurar banco MySQL"
info "   3. Testar funcionalidades"
echo ""
info "📖 Consulte HOSTGATOR_DEPLOY_GUIDE.md para instruções detalhadas"
echo ""

# =====================================================
# Estatísticas Finais
# =====================================================

log "📊 Estatísticas finais:"
log "   - Tempo total: $SECONDS segundos"
log "   - Tamanho total: $TOTAL_SIZE"
log "   - Arquivos gerados: $(find dist/hostgator -type f | wc -l)"

echo ""
log "✨ Build concluído! Pronto para deploy no Hostgator." 