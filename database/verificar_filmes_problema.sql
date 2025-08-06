-- Verificar filmes com problemas
USE fundod14_fundodobau;

-- Verificar filmes com campos vazios ou NULL
SELECT 
    GUID,
    nomeOriginal,
    nomePortugues,
    ano,
    categoria,
    duracao
FROM filmes 
WHERE nomeOriginal IS NULL 
   OR nomeOriginal = '' 
   OR nomePortugues IS NULL 
   OR nomePortugues = '' 
   OR ano IS NULL 
   OR ano = '' 
   OR categoria IS NULL 
   OR duracao IS NULL 
   OR duracao = '';

-- Contar total de filmes
SELECT COUNT(*) as total_filmes FROM filmes;

-- Verificar alguns filmes para debug
SELECT 
    GUID,
    nomeOriginal,
    nomePortugues,
    ano,
    categoria,
    duracao
FROM filmes 
LIMIT 5;
