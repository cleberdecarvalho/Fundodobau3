-- Script para criar as tabelas de avaliações no banco de dados
-- Execute este script no phpMyAdmin ou via linha de comando

-- Conectar ao banco
USE fundod14_fundodobau;

-- Executar o script de avaliações
SOURCE avaliacoes.sql;

-- Verificar se as tabelas foram criadas
SHOW TABLES LIKE '%avaliacao%';

-- Verificar estrutura das tabelas
DESCRIBE avaliacoes_usuarios;
DESCRIBE estatisticas_filmes;

-- Verificar triggers criados
SHOW TRIGGERS;
