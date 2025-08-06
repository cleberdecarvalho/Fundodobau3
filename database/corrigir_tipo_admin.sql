-- Corrigir o tipo do admin para 'admin'
UPDATE usuarios 
SET tipo = 'admin' 
WHERE email = 'admin@fundodobau.com.br';

-- Verificar se foi corrigido
SELECT id, nome, email, tipo FROM usuarios WHERE email = 'admin@fundodobau.com.br';
