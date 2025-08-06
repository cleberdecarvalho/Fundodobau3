-- Script simples para criar tabelas de usuários
-- Execute este script no phpMyAdmin

-- 1. Criar tabela de usuários
CREATE TABLE `usuarios` (
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Criar tabela de preferências
CREATE TABLE `preferencias_usuarios` (
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

-- 3. Criar tabela de notificações
CREATE TABLE `notificacoes_usuarios` (
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

-- 4. Criar tabela de privacidade
CREATE TABLE `privacidade_usuarios` (
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

-- 5. Inserir usuários de exemplo
INSERT INTO `usuarios` (`nome`, `email`, `senha`, `tipo`) VALUES
('Administrador', 'admin@fundodobau.com.br', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('João Silva', 'joao@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario'),
('Maria Santos', 'maria@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario'),
('Pedro Costa', 'pedro@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario');

-- 6. Verificar se as tabelas foram criadas
SHOW TABLES LIKE '%usuario%';

-- 7. Verificar estrutura da tabela usuarios
DESCRIBE usuarios;

-- 8. Verificar usuários inseridos
SELECT id, nome, email, tipo, data_criacao FROM usuarios;
