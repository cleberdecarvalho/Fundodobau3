-- Script seguro para criar/atualizar tabelas de usuários
-- Execute este script no phpMyAdmin

-- 1. Verificar e criar tabela de usuários (se não existir)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('admin', 'usuario') DEFAULT 'usuario',
  `avatar` varchar(255) DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Adicionar colunas que podem não existir
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'usuarios' 
   AND COLUMN_NAME = 'avatar') = 0,
  'ALTER TABLE usuarios ADD COLUMN avatar varchar(255) DEFAULT NULL',
  'SELECT "Coluna avatar já existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'usuarios' 
   AND COLUMN_NAME = 'data_atualizacao') = 0,
  'ALTER TABLE usuarios ADD COLUMN data_atualizacao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT "Coluna data_atualizacao já existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'usuarios' 
   AND COLUMN_NAME = 'ultimo_login') = 0,
  'ALTER TABLE usuarios ADD COLUMN ultimo_login timestamp NULL DEFAULT NULL',
  'SELECT "Coluna ultimo_login já existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'usuarios' 
   AND COLUMN_NAME = 'ativo') = 0,
  'ALTER TABLE usuarios ADD COLUMN ativo tinyint(1) DEFAULT 1',
  'SELECT "Coluna ativo já existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Adicionar índices se não existirem
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'usuarios' 
   AND INDEX_NAME = 'email') = 0,
  'ALTER TABLE usuarios ADD UNIQUE KEY email (email)',
  'SELECT "Índice email já existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'usuarios' 
   AND INDEX_NAME = 'idx_tipo') = 0,
  'ALTER TABLE usuarios ADD KEY idx_tipo (tipo)',
  'SELECT "Índice idx_tipo já existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'usuarios' 
   AND INDEX_NAME = 'idx_ativo') = 0,
  'ALTER TABLE usuarios ADD KEY idx_ativo (ativo)',
  'SELECT "Índice idx_ativo já existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Criar tabela de preferências
CREATE TABLE IF NOT EXISTS `preferencias_usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tema` enum('vintage', 'dark', 'light') DEFAULT 'vintage',
  `idioma` enum('pt-BR', 'en', 'es') DEFAULT 'pt-BR',
  `qualidade_video` enum('baixa', 'media', 'alta') DEFAULT 'media',
  `autoplay` tinyint(1) DEFAULT 0,
  `legendas` tinyint(1) DEFAULT 1,
  `notificacoes_email` tinyint(1) DEFAULT 1,
  `notificacoes_push` tinyint(1) DEFAULT 0,
  `privacidade_perfil` enum('publico', 'privado', 'amigos') DEFAULT 'publico',
  `compartilhar_historico` tinyint(1) DEFAULT 1,
  `mostrar_estatisticas` tinyint(1) DEFAULT 1,
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS `notificacoes_usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `email_novos_filmes` tinyint(1) DEFAULT 1,
  `email_recomendacoes` tinyint(1) DEFAULT 1,
  `email_atividades` tinyint(1) DEFAULT 0,
  `email_newsletter` tinyint(1) DEFAULT 1,
  `push_novos_filmes` tinyint(1) DEFAULT 0,
  `push_recomendacoes` tinyint(1) DEFAULT 0,
  `push_atividades` tinyint(1) DEFAULT 1,
  `push_lembretes` tinyint(1) DEFAULT 1,
  `frequencia` enum('diaria', 'semanal', 'mensal') DEFAULT 'diaria',
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Criar tabela de privacidade
CREATE TABLE IF NOT EXISTS `privacidade_usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `perfil_visibilidade` enum('publico', 'amigos', 'privado') DEFAULT 'publico',
  `compartilhar_historico` tinyint(1) DEFAULT 1,
  `mostrar_estatisticas` tinyint(1) DEFAULT 1,
  `compartilhar_atividades` tinyint(1) DEFAULT 0,
  `aparecer_pesquisa` tinyint(1) DEFAULT 1,
  `usar_dados_recomendacoes` tinyint(1) DEFAULT 1,
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Inserir usuários de exemplo (apenas se não existirem)
INSERT IGNORE INTO `usuarios` (`nome`, `email`, `senha`, `tipo`) VALUES
('Administrador', 'admin@fundodobau.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('João Silva', 'joao@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario'),
('Maria Santos', 'maria@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario'),
('Pedro Costa', 'pedro@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario');

-- 8. Verificar estrutura final
SELECT 'Estrutura da tabela usuarios:' as info;
DESCRIBE usuarios;

SELECT 'Usuários cadastrados:' as info;
SELECT id, nome, email, tipo, data_criacao FROM usuarios;

SELECT 'Tabelas criadas com sucesso!' as resultado;
