# Sistema de Cadastro de Filmes - Fundo do Baú

## 🎬 **Visão Geral**

O sistema de cadastro de filmes integra **Bunny.net** para armazenamento de vídeos e **MySQL** para dados dos filmes, seguindo a regra:

> **"Os dados do filme devem ser armazenados na base, e o mp4 enviado para bunny.net. O site pega o código GUID do filme na bunny.net, armazena na base junto com o filme e gera o link iframe do vídeo para página de detalhes."**

## 🔄 **Fluxo Completo**

### 1. **Cadastro de Filme**
```
Admin → Preenche dados → Upload MP4 → Bunny.net → GUID → MySQL → Iframe
```

### 2. **Processo Detalhado**

#### **2.1 Upload do Vídeo (Bunny.net)**
1. **Criação do vídeo**: API cria entrada no Bunny.net
2. **Upload do arquivo**: MP4 enviado para CDN
3. **Processamento**: Bunny.net processa o vídeo
4. **GUID gerado**: Código único retornado
5. **Iframe criado**: Link de embed gerado automaticamente

#### **2.2 Armazenamento de Dados (MySQL)**
```sql
INSERT INTO filmes (
  nome_original, 
  nome_portugues, 
  ano, 
  categoria, 
  duracao, 
  sinopse, 
  imagem_url, 
  video_guid,      -- ← GUID do Bunny.net
  embed_link,      -- ← Iframe gerado
  video_status,    -- ← Status do processamento
  assistencias
) VALUES (...)
```

#### **2.3 Exibição na Página de Detalhes**
```html
<!-- Iframe gerado automaticamente -->
<iframe src="https://iframe.mediadelivery.net/embed/256964/{GUID}?autoplay=false&loop=false&muted=false&preload=true&responsive=true" allowfullscreen="true"></iframe>
```

## 🛠 **Componentes do Sistema**

### **Frontend (React)**
- **`Admin.tsx`**: Interface de cadastro
- **`VideoUpload.tsx`**: Componente de upload para Bunny.net
- **`filmeStorage.ts`**: Integração com API PHP

### **Backend (PHP/MySQL)**
- **`api-filmes.php`**: API REST para CRUD de filmes
- **`filmes.sql`**: Schema do banco de dados

### **CDN (Bunny.net)**
- **Library ID**: `256964`
- **API Key**: Configurada no painel admin
- **Processamento**: Automático após upload

## 📋 **Estrutura de Dados**

### **Tabela `filmes`**
```sql
CREATE TABLE filmes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guid VARCHAR(255) UNIQUE NOT NULL,
  nome_original VARCHAR(255) NOT NULL,
  nome_portugues VARCHAR(255) NOT NULL,
  ano VARCHAR(4) NOT NULL,
  categoria JSON NOT NULL,
  duracao VARCHAR(10) NOT NULL,
  sinopse TEXT NOT NULL,
  imagem_url VARCHAR(500),
  video_guid VARCHAR(255),      -- ← GUID do Bunny.net
  embed_link TEXT,              -- ← Iframe completo
  video_status ENUM('Processando', 'Processado', 'Erro') DEFAULT 'Processando',
  assistencias INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **Interface TypeScript**
```typescript
interface Filme {
  GUID: string;
  nomeOriginal: string;
  nomePortugues: string;
  ano: string;
  categoria: string[];
  duracao: string;
  sinopse: string;
  imagemUrl: string;
  videoGUID: string;        // ← GUID do Bunny.net
  embedLink: string;        // ← Iframe completo
  videoStatus: string;      // ← Status do processamento
  assistencias?: number;
}
```

## 🔧 **Configuração**

### **1. Bunny.net API Key**
```typescript
// No painel admin
const [bunnyApiKey, setBunnyApiKey] = useState<string>('');
```

### **2. Library ID**
```typescript
const BUNNY_LIBRARY_ID = '256964';
```

### **3. Endpoints da API**
```typescript
// API PHP
GET    /api/filmes          // Listar filmes
POST   /api/filmes          // Criar filme
PUT    /api/filmes/{guid}   // Atualizar filme
DELETE /api/filmes/{guid}   // Deletar filme
```

## 🚀 **Processo de Upload**

### **1. Interface do Admin**
```
┌─────────────────────────────────────┐
│ [Bunny.net API Key: ************]   │
├─────────────────────────────────────┤
│ Nome Original: [________________]   │
│ Nome Português: [_______________]   │
│ Ano: [____] Duração: [_____]        │
│ Categorias: [☑ Drama ☑ Ação]       │
│ Sinopse: [_______________________]  │
│ Imagem: [Escolher arquivo]          │
│ Vídeo: [Escolher MP4] ← Upload      │
└─────────────────────────────────────┘
```

### **2. Upload para Bunny.net**
```javascript
// 1. Criar vídeo
POST https://video.bunnycdn.com/library/256964/videos
{
  "title": "nome-do-filme",
  "description": "Filme: Nome do Filme"
}

// 2. Upload do arquivo
PUT https://video.bunnycdn.com/library/256964/videos/{GUID}
Content-Type: application/octet-stream
Body: [arquivo MP4]

// 3. Aguardar processamento
GET https://video.bunnycdn.com/library/256964/videos/{GUID}
// Status: "encoded" = pronto
```

### **3. Salvar no MySQL**
```sql
INSERT INTO filmes (
  guid, nome_original, nome_portugues, ano, categoria, 
  duracao, sinopse, imagem_url, video_guid, embed_link, video_status
) VALUES (
  'uuid-gerado', 'Original Name', 'Nome Português', '1995', 
  '["Drama", "Ação"]', '1h30', 'Sinopse...', 'url-imagem.jpg',
  'bunny-guid-123', '<iframe src="...">', 'Processado'
);
```

## 🎯 **Exibição na Página de Detalhes**

### **Componente de Vídeo**
```typescript
function FilmeDetalhes() {
  const { filme } = useParams();
  
  return (
    <div>
      <h1>{filme.nomePortugues}</h1>
      <div className="video-container">
        {/* Iframe gerado automaticamente */}
        <div dangerouslySetInnerHTML={{ __html: filme.embedLink }} />
      </div>
    </div>
  );
}
```

### **Iframe Gerado**
```html
<iframe 
  src="https://iframe.mediadelivery.net/embed/256964/bunny-guid-123?autoplay=false&loop=false&muted=false&preload=true&responsive=true" 
  allowfullscreen="true">
</iframe>
```

## 🔍 **Monitoramento e Status**

### **Status do Vídeo**
- **`Processando`**: Upload em andamento
- **`Processado`**: Vídeo pronto para exibição
- **`Erro`**: Falha no processamento

### **Logs e Debug**
```javascript
console.log('Upload iniciado:', fileName);
console.log('GUID gerado:', videoId);
console.log('Status:', statusData.status);
console.log('Iframe criado:', embedLink);
```

## 🛡 **Segurança**

### **API Key Protection**
- Armazenada apenas em sessionStorage
- Limpa automaticamente ao sair
- Não exposta no código fonte

### **Validação de Arquivos**
- Apenas arquivos de vídeo aceitos
- Tamanho máximo configurável
- Validação de tipo MIME

## 📊 **Vantagens do Sistema**

### **1. Performance**
- ✅ Vídeos servidos via CDN global
- ✅ Carregamento otimizado
- ✅ Bandwidth reduzido

### **2. Escalabilidade**
- ✅ Infraestrutura Bunny.net
- ✅ Banco MySQL robusto
- ✅ API REST padronizada

### **3. Manutenibilidade**
- ✅ Código modular
- ✅ Fallback para localStorage
- ✅ Logs detalhados

### **4. UX**
- ✅ Upload com progresso
- ✅ Status em tempo real
- ✅ Interface intuitiva

## 🔄 **Fallback System**

Se a API PHP não estiver disponível:
1. **Dados**: Salvos no localStorage
2. **Vídeos**: Continuam funcionando via Bunny.net
3. **Interface**: Mantém funcionalidade básica

---

**🎬 Sistema completo e funcional para cadastro de filmes clássicos!** 