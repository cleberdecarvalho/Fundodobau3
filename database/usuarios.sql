-- Verificar se a tabela usuarios já existe e adicionar colunas se necessário
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

-- Adicionar colunas se não existirem
ALTER TABLE `usuarios` 
ADD COLUMN IF NOT EXISTS `avatar` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `data_atualizacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `ultimo_login` timestamp NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `ativo` tinyint(1) DEFAULT 1;

-- Adicionar índices se não existirem
ALTER TABLE `usuarios` 
ADD UNIQUE KEY IF NOT EXISTS `email` (`email`),
ADD KEY IF NOT EXISTS `idx_tipo` (`tipo`),
ADD KEY IF NOT EXISTS `idx_ativo` (`ativo`);

-- Tabela de preferências dos usuários
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

-- Tabela de configurações de notificações
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

-- Tabela de configurações de privacidade
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

-- Inserir usuários de exemplo
INSERT INTO `usuarios` (`nome`, `email`, `senha`, `tipo`) VALUES
('Administrador', 'admin@fundodobau.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'), -- senha: admin123
('João Silva', 'joao@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario'), -- senha: 123456
('Maria Santos', 'maria@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario'), -- senha: 123456
('Pedro Costa', 'pedro@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario'); -- senha: 123456

-- Inserir preferências padrão para os usuários
INSERT INTO `preferencias_usuarios` (`usuario_id`, `tema`, `idioma`, `qualidade_video`, `autoplay`, `legendas`, `notificacoes_email`, `notificacoes_push`, `privacidade_perfil`, `compartilhar_historico`, `mostrar_estatisticas`) VALUES
(1, 'vintage', 'pt-BR', 'media', 0, 1, 1, 0, 'publico', 1, 1),
(2, 'vintage', 'pt-BR', 'media', 0, 1, 1, 0, 'publico', 1, 1),
(3, 'vintage', 'pt-BR', 'media', 0, 1, 1, 0, 'publico', 1, 1),
(4, 'vintage', 'pt-BR', 'media', 0, 1, 1, 0, 'publico', 1, 1);

-- Inserir configurações de notificações padrão
INSERT INTO `notificacoes_usuarios` (`usuario_id`, `email_novos_filmes`, `email_recomendacoes`, `email_atividades`, `email_newsletter`, `push_novos_filmes`, `push_recomendacoes`, `push_atividades`, `push_lembretes`, `frequencia`) VALUES
(1, 1, 1, 0, 1, 0, 0, 1, 1, 'diaria'),
(2, 1, 1, 0, 1, 0, 0, 1, 1, 'diaria'),
(3, 1, 1, 0, 1, 0, 0, 1, 1, 'diaria'),
(4, 1, 1, 0, 1, 0, 0, 1, 1, 'diaria');

-- Inserir configurações de privacidade padrão
INSERT INTO `privacidade_usuarios` (`usuario_id`, `perfil_visibilidade`, `compartilhar_historico`, `mostrar_estatisticas`, `compartilhar_atividades`, `aparecer_pesquisa`, `usar_dados_recomendacoes`) VALUES
(1, 'publico', 1, 1, 0, 1, 1),
(2, 'publico', 1, 1, 0, 1, 1),
(3, 'publico', 1, 1, 0, 1, 1),
(4, 'publico', 1, 1, 0, 1, 1);

-- Verificar estrutura das tabelas
DESCRIBE usuarios;
DESCRIBE preferencias_usuarios;
DESCRIBE notificacoes_usuarios;
DESCRIBE privacidade_usuarios;

-- Verificar dados inseridos
SELECT id, nome, email, tipo, data_criacao FROM usuarios;

