-- Tabela para armazenar avaliações e interações dos usuários com filmes
CREATE TABLE IF NOT EXISTS `avaliacoes_usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` varchar(255) NOT NULL,
  `filme_guid` varchar(255) NOT NULL,
  `tipo_interacao` enum('assistido', 'quero_ver', 'favorito', 'avaliacao') NOT NULL,
  `valor` int(11) DEFAULT NULL COMMENT 'Para avaliações: 1-5 estrelas',
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_filme_tipo` (`usuario_id`, `filme_guid`, `tipo_interacao`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_filme` (`filme_guid`),
  KEY `idx_tipo` (`tipo_interacao`),
  KEY `idx_data` (`data_criacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para estatísticas agregadas dos filmes
CREATE TABLE IF NOT EXISTS `estatisticas_filmes` (
  `filme_guid` varchar(255) NOT NULL,
  `total_assistidos` int(11) DEFAULT 0,
  `total_quero_ver` int(11) DEFAULT 0,
  `total_favoritos` int(11) DEFAULT 0,
  `total_avaliacoes` int(11) DEFAULT 0,
  `media_avaliacao` decimal(3,2) DEFAULT 0.00,
  `soma_avaliacoes` int(11) DEFAULT 0,
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`filme_guid`),
  KEY `idx_media_avaliacao` (`media_avaliacao`),
  KEY `idx_total_assistidos` (`total_assistidos`),
  KEY `idx_total_favoritos` (`total_favoritos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger para atualizar estatísticas quando uma avaliação é inserida/atualizada
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `atualizar_estatisticas_inserir`
AFTER INSERT ON `avaliacoes_usuarios`
FOR EACH ROW
BEGIN
    INSERT INTO `estatisticas_filmes` (`filme_guid`, `total_assistidos`, `total_quero_ver`, `total_favoritos`, `total_avaliacoes`, `media_avaliacao`, `soma_avaliacoes`)
    VALUES (NEW.filme_guid, 
            IF(NEW.tipo_interacao = 'assistido', 1, 0),
            IF(NEW.tipo_interacao = 'quero_ver', 1, 0),
            IF(NEW.tipo_interacao = 'favorito', 1, 0),
            IF(NEW.tipo_interacao = 'avaliacao', 1, 0),
            IF(NEW.tipo_interacao = 'avaliacao', NEW.valor, 0),
            IF(NEW.tipo_interacao = 'avaliacao', NEW.valor, 0))
    ON DUPLICATE KEY UPDATE
        `total_assistidos` = `total_assistidos` + IF(NEW.tipo_interacao = 'assistido', 1, 0),
        `total_quero_ver` = `total_quero_ver` + IF(NEW.tipo_interacao = 'quero_ver', 1, 0),
        `total_favoritos` = `total_favoritos` + IF(NEW.tipo_interacao = 'favorito', 1, 0),
        `total_avaliacoes` = `total_avaliacoes` + IF(NEW.tipo_interacao = 'avaliacao', 1, 0),
        `soma_avaliacoes` = `soma_avaliacoes` + IF(NEW.tipo_interacao = 'avaliacao', NEW.valor, 0),
        `media_avaliacao` = CASE 
            WHEN NEW.tipo_interacao = 'avaliacao' THEN 
                (`soma_avaliacoes` + NEW.valor) / (`total_avaliacoes` + 1)
            ELSE `media_avaliacao`
        END;
END//

CREATE TRIGGER IF NOT EXISTS `atualizar_estatisticas_atualizar`
AFTER UPDATE ON `avaliacoes_usuarios`
FOR EACH ROW
BEGIN
    -- Se mudou o tipo de interação, decrementar o antigo e incrementar o novo
    IF OLD.tipo_interacao != NEW.tipo_interacao THEN
        UPDATE `estatisticas_filmes` SET
            `total_assistidos` = `total_assistidos` - IF(OLD.tipo_interacao = 'assistido', 1, 0) + IF(NEW.tipo_interacao = 'assistido', 1, 0),
            `total_quero_ver` = `total_quero_ver` - IF(OLD.tipo_interacao = 'quero_ver', 1, 0) + IF(NEW.tipo_interacao = 'quero_ver', 1, 0),
            `total_favoritos` = `total_favoritos` - IF(OLD.tipo_interacao = 'favorito', 1, 0) + IF(NEW.tipo_interacao = 'favorito', 1, 0),
            `total_avaliacoes` = `total_avaliacoes` - IF(OLD.tipo_interacao = 'avaliacao', 1, 0) + IF(NEW.tipo_interacao = 'avaliacao', 1, 0),
            `soma_avaliacoes` = `soma_avaliacoes` - IF(OLD.tipo_interacao = 'avaliacao', OLD.valor, 0) + IF(NEW.tipo_interacao = 'avaliacao', NEW.valor, 0)
        WHERE `filme_guid` = NEW.filme_guid;
        
        -- Recalcular média se envolve avaliação
        IF NEW.tipo_interacao = 'avaliacao' OR OLD.tipo_interacao = 'avaliacao' THEN
            UPDATE `estatisticas_filmes` SET
                `media_avaliacao` = CASE 
                    WHEN `total_avaliacoes` > 0 THEN `soma_avaliacoes` / `total_avaliacoes`
                    ELSE 0
                END
            WHERE `filme_guid` = NEW.filme_guid;
        END IF;
    ELSE
        -- Se só mudou o valor da avaliação
        IF NEW.tipo_interacao = 'avaliacao' AND OLD.valor != NEW.valor THEN
            UPDATE `estatisticas_filmes` SET
                `soma_avaliacoes` = `soma_avaliacoes` - OLD.valor + NEW.valor,
                `media_avaliacao` = `soma_avaliacoes` / `total_avaliacoes`
            WHERE `filme_guid` = NEW.filme_guid;
        END IF;
    END IF;
END//

CREATE TRIGGER IF NOT EXISTS `atualizar_estatisticas_deletar`
AFTER DELETE ON `avaliacoes_usuarios`
FOR EACH ROW
BEGIN
    UPDATE `estatisticas_filmes` SET
        `total_assistidos` = `total_assistidos` - IF(OLD.tipo_interacao = 'assistido', 1, 0),
        `total_quero_ver` = `total_quero_ver` - IF(OLD.tipo_interacao = 'quero_ver', 1, 0),
        `total_favoritos` = `total_favoritos` - IF(OLD.tipo_interacao = 'favorito', 1, 0),
        `total_avaliacoes` = `total_avaliacoes` - IF(OLD.tipo_interacao = 'avaliacao', 1, 0),
        `soma_avaliacoes` = `soma_avaliacoes` - IF(OLD.tipo_interacao = 'avaliacao', OLD.valor, 0)
    WHERE `filme_guid` = OLD.filme_guid;
    
    -- Recalcular média se envolve avaliação
    IF OLD.tipo_interacao = 'avaliacao' THEN
        UPDATE `estatisticas_filmes` SET
            `media_avaliacao` = CASE 
                WHEN `total_avaliacoes` > 0 THEN `soma_avaliacoes` / `total_avaliacoes`
                ELSE 0
            END
        WHERE `filme_guid` = OLD.filme_guid;
    END IF;
END//
DELIMITER ;

-- Inserir dados de exemplo (opcional)
INSERT INTO `avaliacoes_usuarios` (`usuario_id`, `filme_guid`, `tipo_interacao`, `valor`) VALUES
('joao@email.com', 'filme1-guid', 'assistido', NULL),
('joao@email.com', 'filme2-guid', 'favorito', NULL),
('joao@email.com', 'filme3-guid', 'avaliacao', 5),
('maria@email.com', 'filme1-guid', 'quero_ver', NULL),
('maria@email.com', 'filme2-guid', 'avaliacao', 4);
