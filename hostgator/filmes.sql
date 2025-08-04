CREATE TABLE `filmes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeOriginal` varchar(255) NOT NULL,
  `nomePortugues` varchar(255) NOT NULL,
  `ano` varchar(10) NOT NULL,
  `categoria` text NOT NULL,
  `duracao` varchar(20) NOT NULL,
  `sinopse` text NOT NULL,
  `imagemUrl` text,
  `embedLink` text,
  `videoGUID` varchar(64),
  `videoStatus` varchar(32),
  `assistencias` int DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
