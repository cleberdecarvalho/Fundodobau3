import React, { useState, useCallback } from 'react';
import { Upload, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoUploadProps {
  onVideoUploaded: (embedLink: string, guid: string) => void;
  currentEmbedLink?: string;
  filmeName?: string;
}

export function VideoUpload({ onVideoUploaded, currentEmbedLink, filmeName }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Configurações do Bunny.net (estas devem vir de variáveis de ambiente)
  const BUNNY_LIBRARY_ID = '256964'; // Substituir pela sua biblioteca
  const BUNNY_API_KEY = import.meta.env.VITE_BUNNY_API_KEY || 'demo-key';

  const generateGUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const uploadToBunny = async (file: File) => {
    const guid = generateGUID();
    const fileName = filmeName ? 
      filmeName.toLowerCase().replace(/[^a-z0-9]/g, '-') :
      `filme-${Date.now()}`;

    try {
      // Simulação do upload para Bunny.net
      // Na implementação real, usar a API do Bunny.net
      
      setUploadProgress(25);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(75);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(100);
      
      // Simular resposta da API do Bunny.net
      const embedLink = `<iframe src="https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${guid}?autoplay=false&loop=false&muted=false&preload=true&responsive=true" allowfullscreen="true"></iframe>`;
      
      return { embedLink, guid };

      /* Implementação real para Bunny.net:
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: fileName
        })
      });
      
      const videoData = await response.json();
      const videoId = videoData.guid;
      
      // Upload do arquivo
      const uploadResponse = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/octet-stream'
        },
        body: file,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      const embedLink = `<iframe src="https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true" allowfullscreen="true"></iframe>`;
      
      return { embedLink, guid: videoId };
      */
      
    } catch (error) {
      console.error('Erro no upload para Bunny.net:', error);
      throw error;
    }
  };



  const handleVideoUpload = async (file: File) => {
    console.log('handleVideoUpload iniciado com arquivo:', file.name, file.type);
    if (!file || !file.type.startsWith('video/')) {
      console.error('Tipo de arquivo inválido:', file.type);
      alert('Por favor, selecione apenas arquivos de vídeo.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadToBunny(file);
      onVideoUploaded(result.embedLink, result.guid);
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Erro no upload do vídeo:', error);
      alert('Erro ao fazer upload do vídeo. Tente novamente.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };



  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoUpload(e.dataTransfer.files[0]);
    }
  }, [filmeName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange chamado', e.target.files);
    if (e.target.files && e.target.files[0]) {
      console.log('Arquivo selecionado:', e.target.files[0].name);
      handleVideoUpload(e.target.files[0]);
    }
  };

  const extractGuidFromEmbed = (embedLink: string) => {
    const match = embedLink.match(/\/embed\/\d+\/([^?]+)/);
    return match ? match[1] : '';
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
        Vídeo do Filme (Upload para Bunny.net)
      </label>

            {/* Upload direto por arquivo */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-vintage-gold bg-vintage-gold/10'
            : 'border-vintage-gold/30 hover:border-vintage-gold/60'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="video-file-input"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isUploading}
          onClick={(e) => console.log('Input file clicado')}
        />

        <div className="text-center">
          <Video className="h-12 w-12 text-vintage-gold/60 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-vintage-cream font-vintage-body">
              {isUploading ? `Fazendo upload... ${uploadProgress}%` : 'Clique ou arraste um vídeo aqui'}
            </p>
            <p className="text-sm text-vintage-cream/60 font-vintage-body">
              Formatos suportados: MP4, AVI, MOV, WebM
            </p>
            <p className="text-xs text-vintage-cream/50 font-vintage-body">
              Será enviado para Bunny.net como: {filmeName ? `${filmeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : 'filme-[timestamp]'}
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-full max-w-xs mx-auto mb-4">
                <div className="bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-vintage-gold h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm font-vintage-body">Enviando para Bunny.net... {uploadProgress}%</p>
            </div>
          </div>
        )}
      </div>

      {currentEmbedLink && (
        <div className="bg-vintage-black/30 border border-vintage-gold/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-vintage-cream font-vintage-body">Vídeo atual configurado</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onVideoUploaded('', '')}
              className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <X className="h-3 w-3 mr-1" />
              Remover
            </Button>
          </div>
          <div className="text-xs text-vintage-cream/60 font-vintage-body">
            GUID: {extractGuidFromEmbed(currentEmbedLink)}
          </div>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: currentEmbedLink }} />
          </div>
        </div>
      )}
    </div>
  );
}
