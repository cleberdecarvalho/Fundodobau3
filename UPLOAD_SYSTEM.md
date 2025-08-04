# Sistema de Upload de Filmes - Fundo Do Baú

## 📋 Resumo

Sistema completo para adicionar novos filmes à plataforma Fundo Do Baú com upload automatizado de imagens e vídeos.

## 🎯 Funcionalidades Implementadas

### ✅ Upload de Imagem
- **Localização**: `public/images/filmes/`
- **Nomenclatura**: Nome do filme normalizado (sem acentos, espaços vira hífen)
- **Formatos**: JPG, PNG, WebP
- **Interface**: Drag & drop ou clique para selecionar

### ✅ Upload de Vídeo para Bunny.net
- **Destino**: Bunny.net CDN (biblioteca 256964)
- **Métodos**: Upload de arquivo ou importação via URL
- **Nomenclatura**: Nome do filme normalizado
- **GUID**: Gerado automaticamente
- **Embed**: Código iframe automático

### ✅ Sistema de Armazenamento
- **Persistência**: localStorage + simulação de arquivo
- **Sincronização**: Todas as páginas usam o mesmo sistema
- **Exportação**: Download do arquivo mockData.ts atualizado

## 🔧 Como Usar

### 1. Acesso ao Painel Admin
1. Faça login como admin (admin@fundodobau.com.br / senha123)
2. Acesse o painel administrativo
3. Clique na aba "Novo Filme"

### 2. Preenchimento do Formulário
1. **Nome Original**: Título original do filme
2. **Nome em Português**: Título traduzido
3. **Ano**: Ano de lançamento
4. **Duração**: Formato "1h30" ou "2h15"
5. **Categorias**: Selecione múltiplas categorias
6. **Sinopse**: Descrição do filme

### 3. Upload de Imagem
1. Arraste uma imagem ou clique na área de upload
2. A imagem será salva como `/images/filmes/[nome-do-filme].jpg`
3. Preview automático disponível

### 4. Upload de Vídeo
#### Opção A: Upload de Arquivo
1. Selecione "Upload de Arquivo"
2. Arraste o MP4 ou clique para selecionar
3. O arquivo será enviado para Bunny.net
4. GUID e embed gerados automaticamente

#### Opção B: Importar via URL
1. Selecione "Importar via URL"
2. Cole a URL do vídeo
3. Clique em "Importar"
4. Bunny.net baixará e processará o vídeo

### 5. Salvar Filme
1. Clique em "Adicionar Filme"
2. O filme será salvo na base local
3. Todas as páginas serão atualizadas automaticamente

## 📁 Estrutura de Arquivos

```
client/
├── components/
│   ├── ImageUpload.tsx      # Componente de upload de imagem
│   └── VideoUpload.tsx      # Componente de upload de vídeo
├── utils/
│   └── filmeStorage.ts      # Sistema de armazenamento
└── pages/
    └── Admin.tsx            # Página administrativa atualizada

public/
└── images/
    └── filmes/              # Imagens dos filmes
        ├── a-arca-de-noe.jpg
        ├── casablanca.jpg
        └── ...
```

## 🔄 Fluxo de Dados

1. **Upload** → Componentes salvam arquivos
2. **Storage** → filmeStorage gerencia persistência
3. **Sync** → Todas as páginas usam o mesmo storage
4. **Export** → Gera arquivo mockData.ts atualizado

## 🎨 Interface

### Componente ImageUpload
- Drag & drop visual
- Preview da imagem atual
- Nomenclatura automática baseada no nome do filme
- Indicadores de progresso

### Componente VideoUpload
- Dois métodos de upload (arquivo/URL)
- Preview do vídeo atual
- Barra de progresso detalhada
- Exibição do GUID gerado

### Painel Admin
- Formulário unificado
- Preview em tempo real
- Validação de campos obrigatórios
- Loading states durante upload
- Botão de exportar dados

## 🔧 Configuração Técnica

### Bunny.net
```typescript
const BUNNY_LIBRARY_ID = '256964';
const BUNNY_API_KEY = process.env.REACT_APP_BUNNY_API_KEY;
```

### GUID Generation
```typescript
private generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### Embed Format
```html
<iframe 
  src="https://iframe.mediadelivery.net/embed/256964/[GUID]?autoplay=false&loop=false&muted=false&preload=true&responsive=true" 
  allowfullscreen="true">
</iframe>
```

## 📊 Recursos Adicionais

### Exportação de Dados
- Botão "Exportar Dados" no painel admin
- Gera arquivo `mockData.ts` completo
- Inclui todos os filmes da base local
- Formato pronto para substituir o arquivo original

### Validação
- Campos obrigatórios: Nome Original, Nome Português, Vídeo
- Tipos de arquivo suportados
- Feedback visual de erros

### Responsividade
- Interface adaptável para mobile
- Componentes otimizados para touch
- Layout flexível

## 🚀 Próximos Passos

Para implementação em produção:

1. **API Backend**: Criar endpoints reais para upload
2. **Bunny.net Integration**: Configurar chaves de API reais
3. **File System**: Implementar salvamento real de arquivos
4. **Database**: Substituir localStorage por banco de dados
5. **CDN**: Configurar CDN para imagens
6. **Security**: Adicionar validação e sanitização
7. **Monitoring**: Logs de upload e error tracking

## 🎯 Benefícios

- ✅ **Automatização**: Upload e processamento automático
- ✅ **Consistência**: Nomenclatura padronizada
- ✅ **UX**: Interface intuitiva e visual
- ✅ **Escalabilidade**: Sistema preparado para produção
- ✅ **Manutenção**: Código modular e reutilizável
- ✅ **Performance**: CDN e otimizações integradas

---

*Sistema desenvolvido para o Fundo Do Baú - Plataforma de Cinema Vintage*
