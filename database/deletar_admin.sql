-- Script para deletar o admin atual
DELETE FROM usuarios WHERE email = 'admin@fundodobau.com.br';

-- Verificar se foi deletado
SELECT * FROM usuarios WHERE email = 'admin@fundodobau.com.br';
