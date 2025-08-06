# 🎬 Fundo Do Baú - Guia de Deploy no Hostgator

## 📋 Visão Geral

Este guia explica como fazer o deploy da plataforma **Fundo Do Baú** no Hostgator usando uma arquitetura híbrida:

- **Frontend**: React estático (HTML/CSS/JS)
- **Backend**: PHP + MySQL
- **Upload de Vídeos**: Bunny.net (API externa)

## 🏗️ Arquitetura da Solução

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend PHP   │    │   MySQL         │
│   (Estático)    │◄──►│   (Hostgator)   │◄──►│   (Hostgator)   │
│   React/Vite    │    │   api-filmes.php│    │   fundodobau    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Bunny.net     │    │   Upload de     │    │   Dados dos     │
│   (Vídeos)      │    │   Imagens       │    │   Usuários      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Passo a Passo do Deploy

### 1. Preparação do Banco de Dados

#### 1.1. Criar Banco MySQL
1. Acesse o **cPanel** do Hostgator
2. Vá em **MySQL Databases**
3. Crie um novo banco de dados:
   - **Nome do banco**: `fundodobau`
   - **Usuário**: `fundodobau_user` (ou similar)
   - **Senha**: Senha forte (guarde para usar depois)

#### 1.2. Importar Estrutura
1. Acesse o **phpMyAdmin**
2. Selecione o banco `fundodobau`
3. Vá na aba **SQL**
4. Cole o conteúdo do arquivo `hostgator/filmes.sql`
5. Clique em **Executar**

### 2. Configuração do Backend PHP

#### 2.1. Upload do Arquivo PHP
1. Faça upload do arquivo `hostgator/api-filmes.php` para a raiz do seu site
2. **Localização**: `public_html/api-filmes.php`

#### 2.2. Configurar Conexão com Banco
Edite o arquivo `api-filmes.php` e altere as configurações:

```php
// Configuração do banco
$host = 'localhost';
$db = 'fundodobau'; // Nome do seu banco
$user = 'fundodobau_user'; // Seu usuário MySQL
$pass = 'SUA_SENHA_AQUI'; // Sua senha MySQL
```

### 3. Build do Frontend

#### 3.1. Configurar Ambiente de Produção
No arquivo `client/lib/api.ts`, verifique se a configuração está correta:

```typescript
production: {
  baseURL: '/api-filmes.php', // Relativo ao domínio
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
}
```

#### 3.2. Gerar Build Estático
```bash
# No diretório do projeto
npm run build:client
```

Isso gerará os arquivos estáticos em `dist/spa/`

### 4. Upload do Frontend

#### 4.1. Upload dos Arquivos
1. Acesse o **File Manager** do cPanel
2. Navegue até `public_html`
3. Faça upload de **todos** os arquivos da pasta `dist/spa/`
4. **Importante**: Mantenha a estrutura de pastas

#### 4.2. Verificar Estrutura
A estrutura final deve ficar assim:
```
public_html/
├── index.html
├── assets/
│   ├── index-*.css
│   └── index-*.js
├── favicon.ico
├── robots.txt
└── api-filmes.php
```

### 5. Configuração de Domínio

#### 5.1. Configurar .htaccess (Opcional)
Crie um arquivo `.htaccess` na raiz para melhorar o roteamento:

```apache
RewriteEngine On
RewriteBase /

# Redirecionar API para PHP
RewriteRule ^api/(.*)$ api-filmes.php/$1 [L,QSA]

# Para SPA React - redirecionar tudo para index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 🔧 Configurações Específicas

### 1. Upload de Imagens
- **Pasta**: `public_html/images/filmes/`
- **Permissões**: 755
- **Formatos**: JPG, PNG, WebP

### 2. Bunny.net
- **API Key**: Configure no painel admin
- **Library ID**: 256964 (ou sua biblioteca)
- **Zona**: Sua zona de CDN

### 3. Segurança
- **HTTPS**: Ative SSL no cPanel
- **Permissões**: Configure corretamente as permissões dos arquivos
- **Backup**: Configure backup automático do banco

## 🧪 Testes Pós-Deploy

### 1. Testar Frontend
```bash
# Acesse seu domínio
https://seudominio.com

# Verifique se carrega sem erros
# Teste navegação entre páginas
```

### 2. Testar API
```bash
# Testar listagem de filmes
curl https://seudominio.com/api-filmes.php/filmes

# Testar autenticação
curl -X POST https://seudominio.com/api-filmes.php/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fundodobau.com.br","senha":"admin123"}'
```

### 3. Testar Funcionalidades
- ✅ Login/Registro de usuários
- ✅ Listagem de filmes
- ✅ Busca e filtros
- ✅ Favoritos e avaliações
- ✅ Upload de imagens
- ✅ Upload de vídeos (Bunny.net)

## 🔍 Troubleshooting

### Problema: API não responde
**Solução:**
1. Verificar permissões do arquivo PHP (644)
2. Verificar configuração do banco
3. Verificar logs de erro do PHP

### Problema: Frontend não carrega
**Solução:**
1. Verificar se todos os arquivos foram uploadados
2. Verificar permissões das pastas (755)
3. Verificar console do navegador para erros

### Problema: Upload não funciona
**Solução:**
1. Verificar permissões da pasta `images/` (755)
2. Verificar configuração do Bunny.net
3. Verificar limite de upload do PHP

### Problema: Banco não conecta
**Solução:**
1. Verificar credenciais no `api-filmes.php`
2. Verificar se o banco foi criado
3. Verificar se o usuário tem permissões

## 📊 Monitoramento

### 1. Logs de Erro
- **PHP**: `/error_log` (configurável)
- **MySQL**: Logs do cPanel
- **Frontend**: Console do navegador

### 2. Métricas
- **Performance**: Google PageSpeed Insights
- **SEO**: Google Search Console
- **Analytics**: Google Analytics

### 3. Backup
- **Banco**: Backup automático via cPanel
- **Arquivos**: Backup manual periódico
- **Configurações**: Documentar todas as configurações

## 🚀 Otimizações

### 1. Performance
- **CDN**: Configure CDN para assets estáticos
- **Cache**: Configure cache do navegador
- **Compressão**: Ative GZIP no servidor

### 2. SEO
- **Meta tags**: Configure corretamente
- **Sitemap**: Gere sitemap.xml
- **Robots.txt**: Configure adequadamente

### 3. Segurança
- **HTTPS**: Sempre use HTTPS
- **Headers**: Configure headers de segurança
- **Backup**: Backup regular dos dados

## 📝 Checklist Final

### ✅ Pré-Deploy
- [ ] Banco MySQL criado
- [ ] Estrutura do banco importada
- [ ] Arquivo PHP configurado
- [ ] Build do frontend gerado
- [ ] Bunny.net configurado

### ✅ Deploy
- [ ] Arquivos PHP uploadados
- [ ] Frontend estático uploadado
- [ ] Permissões configuradas
- [ ] .htaccess configurado (opcional)

### ✅ Pós-Deploy
- [ ] Frontend carrega corretamente
- [ ] API responde adequadamente
- [ ] Login/registro funcionando
- [ ] Upload de mídia funcionando
- [ ] Todas as funcionalidades testadas

### ✅ Otimizações
- [ ] HTTPS configurado
- [ ] Performance otimizada
- [ ] SEO configurado
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🎉 Conclusão

Com este guia, você terá uma plataforma de filmes completa e funcional no Hostgator, com:

- ✅ **Frontend moderno** (React/Vite)
- ✅ **Backend robusto** (PHP/MySQL)
- ✅ **Funcionalidades completas** (usuários, favoritos, avaliações)
- ✅ **Upload de mídia** (imagens + vídeos)
- ✅ **Deploy estático** (compatível com Hostgator)
- ✅ **Performance otimizada**
- ✅ **Segurança implementada**

---

**🎬 Fundo Do Baú - Plataforma de Cinema Vintage**
*Deploy híbrido: Frontend estático + Backend PHP/MySQL* 