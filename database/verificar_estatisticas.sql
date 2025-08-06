-- Verificar e criar tabelas para estatísticas

-- 1. Verificar se a tabela avaliacoes_usuarios existe
SHOW TABLES LIKE 'avaliacoes_usuarios';

-- 2. Se não existir, criar a tabela
CREATE TABLE IF NOT EXISTS avaliacoes_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    filme_guid VARCHAR(36) NOT NULL,
    tipo_interacao ENUM('assistido', 'quero_ver', 'favorito', 'avaliacao') NOT NULL,
    valor INT DEFAULT NULL, -- Para avaliações (1-5)
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_interacao (usuario_id, filme_guid, tipo_interacao)
);

-- 3. Verificar usuários ativos
SELECT COUNT(*) as total_usuarios FROM usuarios WHERE ativo = 1;

-- 4. Verificar avaliações recentes
SELECT COUNT(*) as avaliacoes_recentes FROM avaliacoes_usuarios 
WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 5. Inserir alguns dados de exemplo se a tabela estiver vazia
INSERT IGNORE INTO avaliacoes_usuarios (usuario_id, filme_guid, tipo_interacao, valor) VALUES
(5, '98977212-2c1a-4f9c-9201-59e91b437f0f', 'assistido', NULL),
(5, '4c5b618b-e1db-4a38-a7f1-7e41179c1c63', 'avaliacao', 5),
(7, '98977212-2c1a-4f9c-9201-59e91b437f0f', 'favorito', NULL);

-- 6. Verificar estatísticas finais
SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE ativo = 1) as total_usuarios,
    (SELECT COUNT(*) FROM avaliacoes_usuarios WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as novas_avaliacoes;
