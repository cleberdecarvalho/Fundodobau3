-- Script para corrigir filmes com campos NULL
-- Executar este script no MySQL da Hostgator

-- Atualizar filmes com nomeOriginal NULL
UPDATE filmes 
SET nomeOriginal = '' 
WHERE nomeOriginal IS NULL;

-- Atualizar filmes com nomePortugues NULL
UPDATE filmes 
SET nomePortugues = '' 
WHERE nomePortugues IS NULL;

-- Atualizar filmes com ano NULL
UPDATE filmes 
SET ano = '' 
WHERE ano IS NULL;

-- Atualizar filmes com categoria NULL
UPDATE filmes 
SET categoria = '[]' 
WHERE categoria IS NULL;

-- Atualizar filmes com duracao NULL
UPDATE filmes 
SET duracao = '' 
WHERE duracao IS NULL;

-- Atualizar filmes com sinopse NULL
UPDATE filmes 
SET sinopse = '' 
WHERE sinopse IS NULL;

-- Atualizar filmes com embedLink NULL
UPDATE filmes 
SET embedLink = '' 
WHERE embedLink IS NULL;

-- Atualizar filmes com imagemUrl NULL
UPDATE filmes 
SET imagemUrl = '' 
WHERE imagemUrl IS NULL;

-- Atualizar filmes com videoGUID NULL
UPDATE filmes 
SET videoGUID = '' 
WHERE videoGUID IS NULL;

-- Atualizar filmes com videoStatus NULL
UPDATE filmes 
SET videoStatus = 'Processado' 
WHERE videoStatus IS NULL;

-- Atualizar filmes com assistencias NULL
UPDATE filmes 
SET assistencias = 0 
WHERE assistencias IS NULL;

-- Atualizar filmes com avaliacoes NULL
UPDATE filmes 
SET avaliacoes = '{}' 
WHERE avaliacoes IS NULL;

-- Verificar se ainda há campos NULL
SELECT 
    COUNT(*) as total_filmes,
    SUM(CASE WHEN nomeOriginal IS NULL THEN 1 ELSE 0 END) as nomeOriginal_null,
    SUM(CASE WHEN nomePortugues IS NULL THEN 1 ELSE 0 END) as nomePortugues_null,
    SUM(CASE WHEN ano IS NULL THEN 1 ELSE 0 END) as ano_null,
    SUM(CASE WHEN categoria IS NULL THEN 1 ELSE 0 END) as categoria_null,
    SUM(CASE WHEN duracao IS NULL THEN 1 ELSE 0 END) as duracao_null,
    SUM(CASE WHEN sinopse IS NULL THEN 1 ELSE 0 END) as sinopse_null,
    SUM(CASE WHEN embedLink IS NULL THEN 1 ELSE 0 END) as embedLink_null,
    SUM(CASE WHEN imagemUrl IS NULL THEN 1 ELSE 0 END) as imagemUrl_null,
    SUM(CASE WHEN videoGUID IS NULL THEN 1 ELSE 0 END) as videoGUID_null,
    SUM(CASE WHEN videoStatus IS NULL THEN 1 ELSE 0 END) as videoStatus_null,
    SUM(CASE WHEN assistencias IS NULL THEN 1 ELSE 0 END) as assistencias_null,
    SUM(CASE WHEN avaliacoes IS NULL THEN 1 ELSE 0 END) as avaliacoes_null
FROM filmes;
