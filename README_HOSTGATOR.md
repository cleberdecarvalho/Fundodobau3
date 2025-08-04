# Instalação do Site Estático com Backend PHP/MySQL na HostGator

## 1. Pré-requisitos
- Hospedagem com suporte a PHP e MySQL (ex: HostGator)
- Acesso ao painel de controle (cPanel)
- Acesso ao phpMyAdmin

## 2. Passos para Instalação

### 2.1. Banco de Dados
1. No cPanel, crie um novo banco de dados MySQL.
2. Crie um usuário MySQL e associe ao banco, concedendo todas as permissões.
3. Acesse o phpMyAdmin, selecione o banco criado e importe o arquivo `filmes.sql` (fornecido na pasta `hostgator`).

### 2.2. Backend PHP
1. Edite o arquivo `api-filmes.php` e configure as variáveis `$db`, `$user`, `$pass` com os dados do seu banco.
2. Faça upload do arquivo `api-filmes.php` para a raiz do seu site ou uma subpasta (ex: `/api/`).

### 2.3. Frontend Estático
1. Gere a versão estática do seu frontend (React/Vite/Next/etc).
2. Faça upload dos arquivos estáticos (HTML, JS, CSS, imagens) para a pasta pública do seu site (ex: `public_html`).
3. Certifique-se de que o frontend faz as requisições para o endpoint PHP correto (ex: `/api/api-filmes.php`).

### 2.4. Configuração do Frontend
- No código do frontend, altere as URLs de API para apontar para o endpoint PHP (ex: `/api/api-filmes.php`).
- O frontend deve usar fetch/AJAX para consumir os dados.

### 2.5. Teste
- Acesse o site pelo navegador e verifique se os filmes aparecem e podem ser cadastrados/editados/removidos normalmente.

## 3. Observações
- O arquivo `filmes.sql` cria a tabela de filmes no banco.
- O arquivo `api-filmes.php` faz o CRUD dos filmes.
- O frontend é totalmente estático, mas consome dados via PHP/MySQL.

## 4. Segurança
- Recomenda-se proteger o endpoint PHP com autenticação para uso real.
- Não exponha dados sensíveis no frontend.

---

# Ambiente de Desenvolvimento (.dev)

- No ambiente de desenvolvimento, continue usando o backend Node.js/Express/SQLite ou MySQL para persistência real dos dados.
- O frontend pode apontar para `http://localhost:3001/api/filmes` (ou similar) durante o desenvolvimento.
- Para produção/HostGator, aponte para o endpoint PHP.

---

# Resumo do Fluxo
- **Frontend:** Estático (React, Vite, etc)
- **Backend:** PHP (api-filmes.php)
- **Banco:** MySQL (filmes.sql)
- **Hospedagem:** HostGator (ou similar)

---

# Dúvidas?
Abra um chamado ou consulte a documentação oficial da HostGator para detalhes sobre upload de arquivos, banco de dados e permissões.
