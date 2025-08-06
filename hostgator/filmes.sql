-- =====================================================
-- Banco de Dados: Fundo Do Baú - Sistema de Filmes
-- =====================================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS fundodobau CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fundodobau;

-- =====================================================
-- TABELA: filmes
-- =====================================================
CREATE TABLE IF NOT EXISTS filmes (
    GUID VARCHAR(36) PRIMARY KEY,
    nomeOriginal VARCHAR(255) NOT NULL,
    nomePortugues VARCHAR(255) NOT NULL,
    ano VARCHAR(4) NOT NULL,
    categoria JSON NOT NULL, -- Array de categorias
    duracao VARCHAR(10) NOT NULL,
    sinopse TEXT,
    embedLink TEXT,
    imagemUrl VARCHAR(500),
    assistencias INT DEFAULT 0,
    avaliacoes JSON, -- {user_id: rating}
    videoGUID VARCHAR(100),
    videoStatus VARCHAR(50) DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ano (ano),
    INDEX idx_categoria ((CAST(categoria AS CHAR(100)))),
    INDEX idx_assistencias (assistencias DESC)
);

-- =====================================================
-- TABELA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Hash bcrypt
    avatar VARCHAR(500),
    tipo ENUM('admin', 'usuario') DEFAULT 'usuario',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_tipo (tipo)
);

-- =====================================================
-- TABELA: filmes_assistidos
-- =====================================================
CREATE TABLE IF NOT EXISTS filmes_assistidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    filme_guid VARCHAR(36) NOT NULL,
    assistido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (filme_guid) REFERENCES filmes(GUID) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_filme (usuario_id, filme_guid),
    INDEX idx_usuario (usuario_id),
    INDEX idx_filme (filme_guid)
);

-- =====================================================
-- TABELA: filmes_para_assistir
-- =====================================================
CREATE TABLE IF NOT EXISTS filmes_para_assistir (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    filme_guid VARCHAR(36) NOT NULL,
    adicionado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (filme_guid) REFERENCES filmes(GUID) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_filme (usuario_id, filme_guid),
    INDEX idx_usuario (usuario_id),
    INDEX idx_filme (filme_guid)
);

-- =====================================================
-- TABELA: avaliacoes
-- =====================================================
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    filme_guid VARCHAR(36) NOT NULL,
    avaliacao ENUM('gostei', 'gostei-muito', 'nao-gostei') NOT NULL,
    avaliado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (filme_guid) REFERENCES filmes(GUID) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_filme (usuario_id, filme_guid),
    INDEX idx_usuario (usuario_id),
    INDEX idx_filme (filme_guid),
    INDEX idx_avaliacao (avaliacao)
);

-- =====================================================
-- TABELA: categorias
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#FFD700', -- Cor em hex
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir categorias padrão
INSERT IGNORE INTO categorias (nome, descricao, cor) VALUES
('Ação', 'Filmes de ação e aventura', '#FF4444'),
('Comédia', 'Filmes de comédia', '#44FF44'),
('Drama', 'Filmes dramáticos', '#4444FF'),
('Terror', 'Filmes de terror e suspense', '#FF44FF'),
('Ficção Científica', 'Filmes de ficção científica', '#44FFFF'),
('Romance', 'Filmes românticos', '#FFFF44'),
('Documentário', 'Documentários', '#888888'),
('Animação', 'Filmes animados', '#FF8844'),
('Western', 'Filmes de faroeste', '#8B4513'),
('Guerra', 'Filmes de guerra', '#654321');

-- Inserir usuário admin padrão
-- Senha: admin123 (hash bcrypt)
INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES
('Administrador', 'admin@fundodobau.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Inserir usuário de teste
-- Senha: 123456 (hash bcrypt)
INSERT IGNORE INTO usuarios (nome, email, senha, tipo) VALUES
('João Cinéfilo', 'joao@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario');

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: filmes com estatísticas
CREATE OR REPLACE VIEW filmes_stats AS
SELECT 
    f.*,
    COUNT(DISTINCT fa.usuario_id) as total_assistidos,
    COUNT(DISTINCT fpa.usuario_id) as total_para_assistir,
    COUNT(DISTINCT av.usuario_id) as total_avaliacoes,
    AVG(CASE WHEN av.avaliacao = 'gostei-muito' THEN 3 
             WHEN av.avaliacao = 'gostei' THEN 2 
             WHEN av.avaliacao = 'nao-gostei' THEN 1 
             ELSE NULL END) as media_avaliacao
FROM filmes f
LEFT JOIN filmes_assistidos fa ON f.GUID = fa.filme_guid
LEFT JOIN filmes_para_assistir fpa ON f.GUID = fpa.filme_guid
LEFT JOIN avaliacoes av ON f.GUID = av.filme_guid
GROUP BY f.GUID;

-- =====================================================
-- PROCEDURES ÚTEIS
-- =====================================================

-- Procedure: Adicionar filme assistido
DELIMITER //
CREATE PROCEDURE AdicionarFilmeAssistido(
    IN p_usuario_id INT,
    IN p_filme_guid VARCHAR(36)
)
BEGIN
    INSERT IGNORE INTO filmes_assistidos (usuario_id, filme_guid)
    VALUES (p_usuario_id, p_filme_guid);
    
    -- Remover da lista "para assistir" se existir
    DELETE FROM filmes_para_assistir 
    WHERE usuario_id = p_usuario_id AND filme_guid = p_filme_guid;
    
    -- Incrementar contador de assistências
    UPDATE filmes SET assistencias = assistencias + 1 
    WHERE GUID = p_filme_guid;
END //
DELIMITER ;

-- Procedure: Obter filmes do usuário
DELIMITER //
CREATE PROCEDURE ObterFilmesUsuario(
    IN p_usuario_id INT
)
BEGIN
    SELECT 
        f.*,
        CASE WHEN fa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as assistido,
        CASE WHEN fpa.usuario_id IS NOT NULL THEN 1 ELSE 0 END as para_assistir,
        av.avaliacao
    FROM filmes f
    LEFT JOIN filmes_assistidos fa ON f.GUID = fa.filme_guid AND fa.usuario_id = p_usuario_id
    LEFT JOIN filmes_para_assistir fpa ON f.GUID = fpa.filme_guid AND fpa.usuario_id = p_usuario_id
    LEFT JOIN avaliacoes av ON f.GUID = av.filme_guid AND av.usuario_id = p_usuario_id
    ORDER BY f.nomePortugues;
END //
DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Atualizar timestamp de filmes
DELIMITER //
CREATE TRIGGER filmes_update_trigger
BEFORE UPDATE ON filmes
FOR EACH ROW
BEGIN
    SET NEW.updatedAt = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índices para busca por texto
CREATE FULLTEXT INDEX idx_filmes_busca ON filmes(nomeOriginal, nomePortugues, sinopse);

-- Índices para ordenação
CREATE INDEX idx_filmes_criado ON filmes(createdAt DESC);
CREATE INDEX idx_filmes_atualizado ON filmes(updatedAt DESC);

-- =====================================================
-- PRIVILEGIOS (ajustar conforme necessário)
-- =====================================================

-- Conceder privilégios ao usuário da aplicação
-- GRANT SELECT, INSERT, UPDATE, DELETE ON fundodobau.* TO 'app_user'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- FIM DA ESTRUTURA
-- =====================================================
