# 🚀 Guia de Deploy - Fundo Do Baú para Hostgator

## 📋 Resumo das Funcionalidades Implementadas

### ✅ **Sistema Completo:**
- **Carrossel Superior** - Gerenciamento via painel admin
- **Sliders Dinâmicos** - Sistema completo de CRUD
- **Autenticação** - Login de admin e usuários
- **Gerenciamento de Filmes** - CRUD completo
- **Upload de Imagens** - Para filmes e carrossel
- **API PHP** - Endpoints para todas as funcionalidades

## 🔧 Preparação para Deploy

### 1. **Build da Versão Estática**
```bash
# Na raiz do projeto
npm run build:hostgator
```

### 2. **Arquivos Gerados**
O build gera a pasta `dist/hostgator/` com:
- `index.html` - Página principal
- `assets/` - CSS, JS e recursos
- `images/` - Pasta para imagens
- `api-filmes.php` - API PHP
- `filmes.sql` - Estrutura do banco
- `BUILD_REPORT.md` - Relatório detalhado

## 📁 Estrutura de Arquivos para Upload

```
public_html/
├── index.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── images/
│   ├── filmes/
│   └── carrossel/
├── api-filmes.php
├── .htaccess
└── filmes.sql
```

## 🗄️ Configuração do Banco MySQL

### 1. **Acessar phpMyAdmin**
- Login no cPanel do Hostgator
- Acessar "phpMyAdmin"

### 2. **Criar Banco de Dados**
```sql
-- Criar banco de dados
CREATE DATABASE fundodobau_db;
USE fundodobau_db;

-- Importar estrutura
SOURCE filmes.sql;
```

### 3. **Configurar API PHP**
Editar `api-filmes.php` com suas credenciais:
```php
$host = 'localhost';
$dbname = 'fundodobau_db';
$username = 'seu_usuario';
$password = 'sua_senha';
```

## 🔐 Configuração de Autenticação

### **Credenciais de Administrador:**
- **Email:** admin@fundodobau.com.br
- **Senha:** admin123

### **Credenciais de Usuário:**
- **Email:** joao@email.com
- **Senha:** 123456

## 📤 Processo de Upload

### 1. **Via FTP/cPanel File Manager**
```bash
# Upload de todos os arquivos de dist/hostgator/
# para public_html/
```

### 2. **Configurar .htaccess**
```apache
RewriteEngine On
RewriteBase /

# Redirecionar todas as rotas para index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Permitir CORS para API
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

## 🎯 Funcionalidades Disponíveis

### **Página Inicial:**
- ✅ Carrossel superior configurável
- ✅ Sliders dinâmicos por categoria/década
- ✅ Sliders personalizados
- ✅ Navegação responsiva

### **Painel Administrativo:**
- ✅ Login de administrador
- ✅ Gerenciamento de filmes
- ✅ Configuração do carrossel
- ✅ Criação/edição de sliders
- ✅ Upload de imagens

### **Sistema de Filmes:**
- ✅ Catálogo completo
- ✅ Filtros por categoria/década
- ✅ Busca de filmes
- ✅ Páginas de detalhes

## 🔧 Configurações Específicas

### **1. Carrossel Superior**
- Acesse `/admin` → "Carrossel Superior"
- Selecione filmes e faça upload de imagens
- Ative/desative posições conforme necessário

### **2. Sliders Dinâmicos**
- Acesse `/admin` → "Sliders"
- Crie sliders por categoria, década ou personalizados
- Configure títulos e selecione filmes

### **3. Gerenciamento de Filmes**
- Acesse `/admin` → "Gerenciar Filmes"
- Adicione, edite ou remova filmes
- Configure categorias, sinopses e imagens

## 🚨 Troubleshooting

### **Problema: API não responde**
```bash
# Verificar permissões
chmod 644 api-filmes.php
chmod 755 images/

# Verificar logs de erro
tail -f /home/usuario/public_html/error_log
```

### **Problema: Imagens não carregam**
```bash
# Verificar permissões das pastas
chmod 755 images/filmes/
chmod 755 images/carrossel/
chmod 644 images/filmes/*
chmod 644 images/carrossel/*
```

### **Problema: Login não funciona**
- Verificar se o banco está configurado
- Confirmar credenciais no `api-filmes.php`
- Testar conexão MySQL

## 📊 Monitoramento

### **Logs Importantes:**
- `/home/usuario/public_html/error_log`
- `/home/usuario/logs/access_log`

### **Métricas a Acompanhar:**
- Performance da API
- Upload de imagens
- Acesso ao painel admin
- Uso do banco de dados

## 🔄 Atualizações

### **Para atualizar o site:**
1. Fazer build local: `npm run build:hostgator`
2. Fazer backup dos dados no banco
3. Upload dos novos arquivos
4. Testar funcionalidades

### **Para atualizar configurações:**
- Carrossel: Via painel admin
- Sliders: Via painel admin
- Filmes: Via painel admin

## 📞 Suporte

### **Em caso de problemas:**
1. Verificar logs de erro
2. Testar conectividade do banco
3. Verificar permissões de arquivos
4. Consultar documentação do Hostgator

---

## 🎉 Deploy Concluído!

Após seguir este guia, você terá:
- ✅ Site totalmente funcional
- ✅ Painel administrativo ativo
- ✅ Sistema de carrossel e sliders
- ✅ Gerenciamento completo de filmes
- ✅ Autenticação de usuários

**URLs importantes:**
- **Site:** https://seudominio.com
- **Admin:** https://seudominio.com/admin
- **Login:** https://seudominio.com/auth 