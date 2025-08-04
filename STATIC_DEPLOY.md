# 🎬 Fundo Do Baú - Deploy Estático

Este documento descreve como fazer o deploy da versão estática do projeto Fundo Do Baú.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn instalado
- Acesso ao diretório do projeto

## 🚀 Deploy Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Build de Produção
```bash
npm run build
```

### 3. Iniciar Servidor
```bash
npm start
```

O servidor estará disponível em: **http://localhost:3000**

## 🔧 Script de Gerenciamento

Criamos um script para facilitar o gerenciamento da versão estática:

### Uso do Script
```bash
./scripts/static-deploy.sh [comando]
```

### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `start` | Iniciar servidor de produção |
| `stop` | Parar servidor |
| `restart` | Reiniciar servidor |
| `status` | Mostrar status do servidor |
| `logs` | Mostrar logs em tempo real |
| `build` | Fazer build de produção |
| `help` | Mostrar ajuda |

### Exemplos de Uso

```bash
# Iniciar servidor
./scripts/static-deploy.sh start

# Verificar status
./scripts/static-deploy.sh status

# Ver logs
./scripts/static-deploy.sh logs

# Parar servidor
./scripts/static-deploy.sh stop
```

## 📁 Estrutura de Arquivos Gerados

Após o build, a seguinte estrutura é criada:

```
dist/
├── spa/                    # Frontend estático
│   ├── index.html         # Página principal
│   ├── assets/            # CSS e JS otimizados
│   │   ├── index-*.css   # Estilos compilados
│   │   └── index-*.js    # JavaScript compilado
│   ├── favicon.ico        # Ícone do site
│   ├── robots.txt         # Configuração para bots
│   └── placeholder.svg    # Imagem placeholder
└── server/                # Backend compilado
    ├── node-build.mjs     # Servidor Express
    └── node-build.mjs.map # Source maps
```

## 🌐 URLs Disponíveis

### Frontend
- **Página Inicial**: http://localhost:3000/
- **Catálogo**: http://localhost:3000/filmes
- **Detalhes do Filme**: http://localhost:3000/filme/[GUID]
- **Favoritos**: http://localhost:3000/favoritos
- **Admin**: http://localhost:3000/admin

### API
- **Health Check**: http://localhost:3000/api/ping
- **Demo**: http://localhost:3000/api/demo

## 🔍 Verificação de Funcionamento

### 1. Testar Frontend
```bash
curl -s http://localhost:3000 | head -5
```

### 2. Testar API
```bash
curl -s http://localhost:3000/api/ping
```

### 3. Verificar Processo
```bash
ps aux | grep "node-build" | grep -v grep
```

## 📊 Estatísticas do Build

### Tamanho dos Arquivos
- **CSS**: ~71KB (12KB gzipped)
- **JavaScript**: ~488KB (143KB gzipped)
- **HTML**: ~0.4KB (0.3KB gzipped)

### Performance
- **Build Time**: ~4.5 segundos
- **Módulos Transformados**: 1731
- **Target**: Node.js 18

## 🛠️ Configurações

### Variáveis de Ambiente
```bash
PORT=3000                    # Porta do servidor
PING_MESSAGE="ping pong"     # Mensagem do health check
NODE_ENV=production          # Ambiente de produção
```

### Configurações do Vite
- **Client**: Build otimizado para navegadores
- **Server**: Build compatível com Node.js 18
- **Aliases**: `@` para client, `@shared` para shared

## 🔧 Troubleshooting

### Problema: Servidor não inicia
```bash
# Verificar se há processos rodando
ps aux | grep node

# Parar processos conflitantes
pkill -f "node-build"

# Tentar novamente
./scripts/static-deploy.sh start
```

### Problema: Erro de porta
```bash
# Verificar portas em uso
ss -tlnp | grep :3000

# Usar porta alternativa
PORT=3001 ./scripts/static-deploy.sh start
```

### Problema: Build falha
```bash
# Limpar cache
rm -rf node_modules/.cache
rm -rf dist

# Reinstalar dependências
npm install

# Tentar build novamente
npm run build
```

## 📈 Monitoramento

### Logs do Servidor
```bash
# Ver logs em tempo real
./scripts/static-deploy.sh logs

# Ver logs do arquivo
tail -f .server.log
```

### Status do Sistema
```bash
# Verificar status
./scripts/static-deploy.sh status

# Verificar conectividade
curl -s http://localhost:3000/api/ping
```

## 🚀 Deploy em Produção

### Netlify
O projeto está configurado para deploy no Netlify:

1. Conectar repositório no Netlify
2. Build command: `npm run build:client`
3. Publish directory: `dist/spa`
4. Functions: `netlify/functions`

### Vercel
Para deploy no Vercel:

1. Conectar repositório no Vercel
2. Framework preset: Vite
3. Build command: `npm run build:client`
4. Output directory: `dist/spa`

### Servidor Próprio
Para deploy em servidor próprio:

1. Fazer build: `npm run build`
2. Copiar pasta `dist/` para servidor
3. Instalar Node.js no servidor
4. Executar: `node dist/server/node-build.mjs`

## 📝 Notas Importantes

- ✅ **Compatibilidade**: Node.js 18+
- ✅ **Performance**: Build otimizado para produção
- ✅ **SEO**: Configuração para SPA
- ✅ **API**: Endpoints funcionais
- ✅ **Logs**: Sistema de logs implementado
- ✅ **Scripts**: Gerenciamento automatizado

---

*Versão estática do Fundo Do Baú - Plataforma de Cinema Vintage* 