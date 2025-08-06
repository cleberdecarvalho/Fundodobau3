# 🎬 Fundo do Baú - Cinema dos Anos Dourados
## Documentação Completa do Sistema

### 📋 **Visão Geral**
Sistema completo de gerenciamento de filmes clássicos com upload de vídeos para Bunny.net CDN, interface moderna e arquitetura híbrida (React + PHP/MySQL).

---

## 🏗️ **Arquitetura do Sistema**

### **Frontend (React + TypeScript)**
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS + Radix UI
- **Roteamento**: React Router
- **Estado**: React Context API
- **Animações**: Framer Motion
- **Formulários**: React Hook Form

### **Backend (Desenvolvimento)**
- **Servidor**: Node.js + Express.js
- **API**: Mock endpoints para desenvolvimento
- **Armazenamento**: localStorage (fallback)

### **Backend (Produção)**
- **Servidor**: PHP + MySQL
- **API**: Endpoints RESTful
- **Armazenamento**: MySQL Database
- **Deploy**: Hostgator (estático)

### **CDN de Vídeos**
- **Provedor**: Bunny.net
- **Library ID**: 256964
- **Upload**: API direta
- **Processamento**: Automático

---

## 🚀 **Funcionalidades Principais**

### **1. Sistema de Autenticação**
- ✅ Login/Registro de usuários
- ✅ Painel administrativo protegido
- ✅ Sessões persistentes
- ✅ Mock de usuários para desenvolvimento

### **2. Gerenciamento de Filmes**
- ✅ **Cadastro completo** com metadados
- ✅ **Upload de vídeos** para Bunny.net
- ✅ **Upload de imagens** (posters)
- ✅ **Categorização** múltipla
- ✅ **Edição** de filmes existentes
- ✅ **Exclusão** completa (local + Bunny.net)

### **3. Upload de Vídeos (Bunny.net)**
- ✅ **Upload direto** via API
- ✅ **Captura automática** do GUID
- ✅ **Processamento em background**
- ✅ **Timeout estendido** (10 minutos)
- ✅ **Interface compacta**
- ✅ **Status em tempo real**

### **4. Interface de Usuário**
- ✅ **Design vintage** com tema dourado
- ✅ **Responsivo** para todos os dispositivos
- ✅ **Navegação intuitiva**
- ✅ **Busca de filmes**
- ✅ **Filtros por categoria**
- ✅ **Páginas de detalhes**

---

## 📁 **Estrutura de Arquivos**

```
Fundodobau3/
├── client/                          # Frontend React
│   ├── components/                  # Componentes reutilizáveis
│   │   ├── VideoUpload.tsx         # Upload para Bunny.net
│   │   ├── FilmSlider.tsx          # Slider de filmes
│   │   └── ...
│   ├── contexts/                   # Contextos React
│   │   ├── AuthContext.tsx         # Autenticação
│   │   └── SearchContext.tsx       # Busca
│   ├── pages/                      # Páginas da aplicação
│   │   ├── Admin.tsx              # Painel administrativo
│   │   ├── FilmeDetalhes.tsx      # Detalhes do filme
│   │   ├── Filmes.tsx             # Lista de filmes
│   │   └── ...
│   ├── utils/                      # Utilitários
│   │   └── filmeStorage.ts        # Gerenciamento de dados
│   └── lib/                        # Bibliotecas
│       └── api.ts                 # Cliente API
├── server/                         # Backend Express (dev)
│   └── index.ts                   # Servidor mock
├── hostgator/                      # Backend PHP (prod)
│   ├── api-filmes.php             # API PHP
│   └── filmes.sql                 # Schema MySQL
├── scripts/                        # Scripts de build
│   └── build-production.sh        # Build para produção
└── docs/                          # Documentação
```

---

## 🔧 **Configuração e Instalação**

### **Requisitos**
- Node.js 18+
- npm ou yarn
- Conta Bunny.net (para upload de vídeos)

### **Instalação**
```bash
# Clone o repositório
git clone [url-do-repositorio]
cd Fundodobau3

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicie o servidor de desenvolvimento
npm run dev
```

### **Variáveis de Ambiente**
```env
# Bunny.net
VITE_BUNNY_API_KEY=sua_api_key_aqui
VITE_BUNNY_LIBRARY_ID=256964

# API (desenvolvimento)
VITE_API_BASE_URL=http://localhost:8080/api

# API (produção)
VITE_API_BASE_URL=https://seudominio.com/api
```

---

## 🎯 **Fluxo de Upload de Vídeos**

### **1. Upload para Bunny.net**
```typescript
// 1. Criar vídeo no Bunny.net
const createResponse = await fetch('https://video.bunnycdn.com/library/256964/videos', {
  method: 'POST',
  headers: { 'AccessKey': apiKey },
  body: JSON.stringify({ title: fileName })
});

// 2. Obter GUID
const videoData = await createResponse.json();
const videoId = videoData.guid; // ← GUID único

// 3. Upload do arquivo
const uploadResponse = await fetch(`https://video.bunnycdn.com/library/256964/videos/${videoId}`, {
  method: 'PUT',
  headers: { 'AccessKey': apiKey },
  body: file
});

// 4. Aguardar processamento (até 10 minutos)
while (!processingComplete && attempts < 60) {
  await new Promise(resolve => setTimeout(resolve, 10000));
  // Verificar status...
}

// 5. Gerar embed link
const embedLink = `<iframe src="https://iframe.mediadelivery.net/embed/256964/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true" allowfullscreen="true"></iframe>`;
```

### **2. Salvamento no Banco**
```typescript
// Estrutura do filme
interface Filme {
  GUID: string;           // GUID do Bunny.net
  videoGUID: string;      // GUID do Bunny.net (mesmo valor)
  nomeOriginal: string;   // Título original
  nomePortugues: string;  // Título em português
  ano: string;           // Ano de lançamento
  categoria: string[];   // Categorias
  duracao: string;       // Duração
  sinopse: string;       // Sinopse
  imagemUrl: string;     // URL da imagem
  embedLink: string;     // Iframe do vídeo
  videoStatus: string;   // 'Processado' ou 'Processando'
  assistencias: number;  // Visualizações
}
```

---

## 🎨 **Interface do Usuário**

### **Componente VideoUpload Compacto**
- **Design**: Uma linha com ícone, texto e botão
- **Progresso**: Barra pequena inline
- **Status**: Mensagens compactas
- **Drag & Drop**: Suportado
- **Formatos**: MP4, AVI, MOV, WebM

### **Painel Administrativo**
- **Dashboard**: Estatísticas em tempo real
- **Gerenciar Filmes**: Lista com ações
- **Novo Filme**: Formulário completo
- **Upload**: Interface compacta
- **Exclusão**: Confirmação com detalhes

### **Páginas Públicas**
- **Home**: Sliders de filmes em destaque
- **Filmes**: Lista com filtros
- **Detalhes**: Informações completas + vídeo
- **Busca**: Funcionalidade de pesquisa

---

## 🔒 **Segurança e Validação**

### **Autenticação**
- ✅ Sessões seguras
- ✅ Proteção de rotas
- ✅ Validação de permissões
- ✅ Logout automático

### **Upload de Arquivos**
- ✅ Validação de tipos
- ✅ Limite de tamanho
- ✅ Sanitização de nomes
- ✅ Verificação de vírus (Bunny.net)

### **API Security**
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validação de entrada
- ✅ Sanitização de dados

---

## 📊 **Banco de Dados (MySQL)**

### **Tabela: filmes**
```sql
CREATE TABLE filmes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  GUID VARCHAR(255) UNIQUE NOT NULL,
  videoGUID VARCHAR(255),
  nomeOriginal VARCHAR(255) NOT NULL,
  nomePortugues VARCHAR(255),
  ano VARCHAR(4),
  categoria JSON,
  duracao VARCHAR(10),
  sinopse TEXT,
  imagemUrl TEXT,
  embedLink TEXT,
  videoStatus ENUM('Processando', 'Processado', 'Erro') DEFAULT 'Processando',
  assistencias INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **Tabela: usuarios**
```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo ENUM('admin', 'usuario') DEFAULT 'usuario',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 **Deploy e Produção**

### **Build para Produção**
```bash
# Build otimizado
npm run build:hostgator

# Arquivos gerados em /dist
# Upload para Hostgator via FTP
```

### **Configuração Hostgator**
- ✅ Upload de arquivos estáticos
- ✅ Configuração .htaccess
- ✅ API PHP funcional
- ✅ Banco MySQL configurado

### **Monitoramento**
- ✅ Logs de erro
- ✅ Métricas de performance
- ✅ Status do Bunny.net
- ✅ Backup automático

---

## 🐛 **Solução de Problemas**

### **Erro: "Timeout no processamento do vídeo"**
- **Causa**: Vídeo grande ou formato complexo
- **Solução**: Timeout aumentado para 10 minutos
- **Fallback**: Processamento em background

### **Erro: "Cota do localStorage excedida"**
- **Causa**: Muitos dados salvos localmente
- **Solução**: Limpeza automática + botão manual
- **Fallback**: API como fonte principal

### **Erro: "GUID undefined"**
- **Causa**: GUID não capturado do Bunny.net
- **Solução**: Captura imediata do GUID
- **Fallback**: GUID local gerado

### **Erro: "Vídeo não disponível"**
- **Causa**: Embed link inválido
- **Solução**: Validação de embed link
- **Fallback**: Mensagem informativa

---

## 📈 **Melhorias Implementadas**

### **v1.0 - Base do Sistema**
- ✅ Estrutura React + TypeScript
- ✅ Interface vintage
- ✅ Upload básico para Bunny.net
- ✅ CRUD de filmes

### **v1.1 - Upload Robusto**
- ✅ Timeout estendido (10 minutos)
- ✅ Processamento em background
- ✅ Captura automática do GUID
- ✅ Interface compacta

### **v1.2 - Exclusão Completa**
- ✅ Exclusão da base local
- ✅ Exclusão do Bunny.net
- ✅ Confirmação detalhada
- ✅ Logs de debug

### **v1.3 - Interface Otimizada**
- ✅ Componente VideoUpload compacto
- ✅ Botão simplificado
- ✅ Status em tempo real
- ✅ Mensagens informativas

---

## 🔮 **Próximas Funcionalidades**

### **Planejadas**
- [ ] Sistema de avaliações
- [ ] Listas de favoritos
- [ ] Histórico de visualizações
- [ ] Recomendações personalizadas
- [ ] Comentários de usuários
- [ ] Estatísticas avançadas
- [ ] Exportação de dados
- [ ] Backup automático

### **Melhorias Técnicas**
- [ ] Cache inteligente
- [ ] Lazy loading
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] API GraphQL
- [ ] Microserviços

---

## 📞 **Suporte e Contato**

### **Desenvolvimento**
- **Tecnologias**: React, TypeScript, Node.js, PHP, MySQL
- **CDN**: Bunny.net
- **Deploy**: Hostgator

### **Documentação**
- **Versão**: 1.3
- **Última atualização**: Janeiro 2025
- **Status**: Produção

---

## 🎬 **Conclusão**

O sistema **Fundo do Baú - Cinema dos Anos Dourados** é uma plataforma completa e robusta para gerenciamento de filmes clássicos, com:

- ✅ **Upload automático** para Bunny.net CDN
- ✅ **Interface moderna** e responsiva
- ✅ **Arquitetura híbrida** (React + PHP/MySQL)
- ✅ **Sistema robusto** de tratamento de erros
- ✅ **Deploy otimizado** para Hostgator

O sistema está pronto para produção e pode ser facilmente expandido com novas funcionalidades conforme necessário. 