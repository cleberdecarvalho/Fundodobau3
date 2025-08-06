-- Script para limpar referências ao admin antigo e tornar dados independentes
-- Este script remove qualquer referência a usuários específicos em tabelas de configuração

-- 1. Verificar se existem tabelas com referências a usuários
SHOW TABLES LIKE '%carrossel%';
SHOW TABLES LIKE '%slider%';
SHOW TABLES LIKE '%config%';

-- 2. Se existir tabela carrossel, remover referências a usuários
-- (Assumindo que pode ter uma coluna user_id ou criado_por)
-- UPDATE carrossel SET user_id = NULL WHERE user_id IS NOT NULL;

-- 3. Se existir tabela sliders, remover referências a usuários
-- UPDATE sliders SET user_id = NULL WHERE user_id IS NOT NULL;

-- 4. Verificar filmes (não devem ter referência a usuários)
SELECT COUNT(*) as total_filmes FROM filmes;

-- 5. Verificar se há dados órfãos
-- SELECT * FROM carrossel WHERE user_id NOT IN (SELECT id FROM usuarios);
-- SELECT * FROM sliders WHERE user_id NOT IN (SELECT id FROM usuarios);

-- 6. Criar admin padrão se não existir
INSERT IGNORE INTO usuarios (nome, email, senha, tipo) 
VALUES ('Administrador Sistema', 'sistema@fundodobau.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- 7. Verificar usuários admin
SELECT id, nome, email, tipo FROM usuarios WHERE tipo = 'admin';
