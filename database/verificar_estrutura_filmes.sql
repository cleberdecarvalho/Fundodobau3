-- Verificar estrutura da tabela filmes
USE fundod14_fundodobau;
DESCRIBE filmes;

-- Verificar se há constraints NOT NULL
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'fundod14_fundodobau' 
AND TABLE_NAME = 'filmes'
ORDER BY ORDINAL_POSITION;

-- Verificar se há constraints de integridade
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'fundod14_fundodobau' 
AND TABLE_NAME = 'filmes';

-- Verificar se há constraints CHECK
SELECT 
    CONSTRAINT_NAME,
    CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'fundod14_fundodobau';
