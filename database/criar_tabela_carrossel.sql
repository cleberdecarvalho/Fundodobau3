-- Criar tabela de carrossel no banco MySQL
USE fundod14_fundodobau;

-- Criar tabela carrossel se não existir
CREATE TABLE IF NOT EXISTS carrossel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    posicao INT NOT NULL,
    filmeId VARCHAR(36),
    imagemUrl VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_posicao (posicao)
);

-- Inserir dados iniciais do carrossel
INSERT IGNORE INTO carrossel (posicao, filmeId, imagemUrl, ativo) VALUES
(0, '98977212-2c1a-4f9c-9201-59e91b437f0f', '/images/carrossel/carrossel-0-filme1.jpeg', TRUE),
(1, '4c5b618b-e1db-4a38-a7f1-7e41179c1c63', '/images/carrossel/carrossel-1-filme2.png', TRUE),
(2, '11ebbeaa-6ff8-4349-a3b7-92fbe5f58955', '/images/carrossel/carrossel-2-filme3.jpeg', TRUE);

-- Verificar se a tabela foi criada
DESCRIBE carrossel;

-- Verificar dados inseridos
SELECT * FROM carrossel ORDER BY posicao;
