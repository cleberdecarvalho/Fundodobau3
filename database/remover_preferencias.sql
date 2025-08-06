-- Script para remover tabelas de preferências, notificações e privacidade
-- Execute este script no phpMyAdmin

-- 1. Remover tabelas (na ordem correta devido às foreign keys)
DROP TABLE IF EXISTS `privacidade_usuarios`;
DROP TABLE IF EXISTS `notificacoes_usuarios`;
DROP TABLE IF EXISTS `preferencias_usuarios`;

-- 2. Verificar tabelas restantes
SHOW TABLES;

-- 3. Verificar estrutura da tabela usuarios
DESCRIBE usuarios;

-- 4. Verificar usuários
SELECT id, nome, email, tipo, data_criacao FROM usuarios;
