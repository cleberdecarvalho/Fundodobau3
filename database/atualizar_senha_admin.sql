-- Script para atualizar a senha do admin
-- A senha será: admin123

UPDATE usuarios 
SET senha = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email = 'admin@fundodobau.com.br';

-- Verificar se foi atualizado
SELECT id, nome, email, tipo FROM usuarios WHERE email = 'admin@fundodobau.com.br';
