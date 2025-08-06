-- Criar tabela filmes
CREATE TABLE IF NOT EXISTS filmes (
    GUID VARCHAR(36) PRIMARY KEY,
    nomeOriginal VARCHAR(255) NOT NULL,
    nomePortugues VARCHAR(255) NOT NULL,
    ano VARCHAR(4) NOT NULL,
    categoria JSON NOT NULL,
    duracao VARCHAR(10) NOT NULL,
    sinopse TEXT,
    embedLink TEXT,
    imagemUrl VARCHAR(500),
    assistencias INT DEFAULT 0,
    avaliacoes JSON,
    videoGUID VARCHAR(100),
    videoStatus VARCHAR(50) DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 