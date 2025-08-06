# 📤 Instruções para Upload da API - Fundo do Baú

## 🚀 **Upload Manual via cPanel**

### **1. Acesse o cPanel do Hostgator**
- URL: `https://fundodobau.com.br/cpanel`
- Usuário: `fundod14`
- Senha: [sua senha]

### **2. Abra o File Manager**
- No cPanel, clique em **"File Manager"**
- Navegue até a pasta `public_html`

### **3. Faça Upload do arquivo**
- Clique em **"Upload"**
- Selecione o arquivo: `hostgator/api-filmes.php`
- Aguarde o upload completar

### **4. Verifique as permissões**
- Clique com botão direito no arquivo `api-filmes.php`
- Selecione **"Change Permissions"**
- Configure para: `644` (rw-r--r--)

## 🗄️ **Configurar Banco de Dados**

### **1. Acesse o phpMyAdmin**
- No cPanel, clique em **"phpMyAdmin"**
- Selecione o banco: `fundod14_fundodobau`

### **2. Execute o script SQL**
- Vá na aba **"SQL"**
- Cole o conteúdo do arquivo: `database/remover_preferencias.sql`
- Clique em **"Executar"**

## 🧪 **Testar a API**

### **1. Teste de conexão**
```bash
curl "https://fundodobau.com.br/api-filmes.php?action=list"
```

### **2. Teste via navegador**
- Acesse: `http://localhost:8082/test-api-auth.html`
- Clique em **"Testar Conexão com API"**

### **3. Teste o frontend**
- Acesse: `http://localhost:8081`
- Teste login/registro

## 🔧 **Configurações da API**

### **Arquivo: `hostgator/api-filmes.php`**
```php
// Configuração do banco
$host = 'localhost';
$db = 'fundod14_fundodobau';
$user = 'fundod14_fundodobau';
$pass = '4z]8(AHekxVr';
```

### **Endpoints disponíveis:**
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de usuário
- `POST /auth/logout` - Logout
- `GET /auth/me` - Verificar sessão
- `PUT /auth/profile` - Atualizar perfil

## 🚨 **Solução de Problemas**

### **Erro 404:**
- Verifique se o arquivo está em `public_html/api-filmes.php`
- Verifique as permissões do arquivo

### **Erro de conexão com banco:**
- Verifique as credenciais no arquivo PHP
- Confirme se o banco existe

### **Erro CORS:**
- O arquivo já inclui headers CORS
- Verifique se não há conflitos no `.htaccess`

## ✅ **Checklist Final**

- [ ] Upload do `api-filmes.php` realizado
- [ ] Permissões configuradas (644)
- [ ] Script SQL executado
- [ ] Tabelas de preferências removidas
- [ ] API respondendo corretamente
- [ ] Login/registro funcionando
- [ ] Frontend conectando com API

## 📞 **Suporte**

Se houver problemas:
1. Verifique os logs de erro do PHP
2. Teste a conexão com o banco
3. Confirme as configurações do Hostgator
