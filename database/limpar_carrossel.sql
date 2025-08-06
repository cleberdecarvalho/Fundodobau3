-- Limpar completamente a tabela carrossel
USE fundod14_fundodobau;

-- Deletar todos os registros da tabela carrossel
DELETE FROM carrossel;

-- Verificar se a tabela está vazia
SELECT COUNT(*) as total_registros FROM carrossel;

-- Verificar estrutura da tabela
DESCRIBE carrossel;
