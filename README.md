# Plataforma de Filmes - Guia de Instalação e Desenvolvimento

## Objetivo
Sistema de catálogo e administração de filmes com upload de vídeo (Bunny.net), persistência em banco de dados e compatível com hospedagem HostGator (PHP/MySQL) e ambiente de desenvolvimento local.

## Estrutura do Projeto
- `/client` - Frontend React (exportável como estático)
- `/server` - Backend Node.js/Express (dev)
- `/hostgator` - Arquivos para deploy HostGator (PHP/MySQL)

## Instalação para Produção (HostGator)
Veja o arquivo `README_HOSTGATOR.md` para o passo a passo completo.

## Instalação para Desenvolvimento Local
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o backend (Node.js/Express):
   ```bash
   npx tsx server/filmes-api.ts
   ```
   - O backend usará SQLite (ou MySQL, se configurado).
3. Inicie o frontend:
   ```bash
   npm run dev
   ```
4. O frontend consumirá a API local (`/api/filmes`).

## Persistência dos Dados
- **Desenvolvimento:** SQLite (padrão) ou MySQL (configurável)
- **Produção HostGator:** MySQL via PHP

## Exportação Estática
- Gere a versão estática do frontend (ex: `npm run build` ou `npm run export`).
- Faça upload dos arquivos estáticos e do backend PHP para a hospedagem.

## Observações
- O frontend detecta o ambiente e pode ser configurado para consumir a API correta (dev/prod).
- O backend Node.js é apenas para desenvolvimento local.
- Para produção, use o PHP/MySQL.

---

# Dúvidas?
Consulte o `README_HOSTGATOR.md` ou abra um chamado.
