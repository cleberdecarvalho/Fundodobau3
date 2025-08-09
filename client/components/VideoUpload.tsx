import React, { useState, useCallback } from 'react';
import { Upload, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoUploadProps {
  onVideoUploaded: (embedLink: string, guid: string) => void;
  onVideoUploading?: (guid: string) => void;
  currentEmbedLink?: string;
  filmeName?: string;
  bunnyApiKey?: string;
}

export function VideoUpload({ onVideoUploaded, onVideoUploading, currentEmbedLink, filmeName, bunnyApiKey }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // Endpoints via backend PHP (sem expor AccessKey)
  const API_BASE = 'https://www.fundodobaufilmes.com/api-filmes.php';

  const generateGUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const uploadToBunny = async (file: File) => {

    const fileName = filmeName ? 
      filmeName.toLowerCase().replace(/[^a-z0-9]/g, '-') :
      `filme-${Date.now()}`;

    try {
      setUploadStatus('uploading');
      setUploadMessage('Criando vídeo...');
      setUploadProgress(10);

      // 1) Criar vídeo via PHP
      const createResponse = await fetch(`${API_BASE}/bunny/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', fileName })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`Erro ao criar vídeo: ${errorData.message || createResponse.statusText}`);
      }

      const videoData = await createResponse.json();
      const videoId = videoData.videoGUID || videoData.guid;
      console.log('GUID do Bunny.net:', videoId);
      
      // Notificar que o upload começou com o GUID
      if (onVideoUploading) {
        onVideoUploading(videoId);
      }

      setUploadMessage('Enviando arquivo...');
      setUploadProgress(30);

      // 2) Upload do arquivo via proxy PHP (fallback usando query para evitar PATH_INFO 404)
      const uploadResponse = await fetch(`${API_BASE}?endpoint=bunny/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          // Fallback: alguns hosts ignoram a query em PUT; enviamos também via header
          'X-Endpoint': `bunny/videos/${videoId}`
        },
        body: file
      });

      if (!uploadResponse.ok) {
        let msg = uploadResponse.statusText;
        try {
          const errorData = await uploadResponse.json();
          msg = errorData?.error || errorData?.message || msg;
        } catch (e) {
          try { msg = await uploadResponse.text(); } catch {}
        }
        throw new Error(`Erro no upload: ${msg}`);
      }

      setUploadProgress(70);
      setUploadMessage('Processando vídeo...');

      // 3. Aguardar processamento
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 10 minutos máximo (aumentado)

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos

        const statusResponse = await fetch(`${API_BASE}/bunny/videos/${videoId}`);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const status = (statusData && statusData.status) || (statusData && statusData.videoStatus);
          if (status === 'Processado') {
            processingComplete = true;
            setUploadProgress(100);
            setUploadMessage('Vídeo processado com sucesso!');
          } else if (status === 'failed' || status === 'erro') {
            throw new Error('Falha no processamento do vídeo');
          } else {
            setUploadMessage(`Processando... (${status || 'aguardando'})`);
            setUploadProgress(70 + (attempts * 1));
          }
        }

        attempts++;
      }

      if (!processingComplete) {
        console.warn('Timeout no processamento, mas continuando...');
        setUploadMessage('Processamento em background. O vídeo pode demorar alguns minutos para ficar disponível.');
      }

      // 4. Gerar embed link
      // 4) Usar embedLink retornado pelo PHP, ou montar manualmente se vier vazio
      const embedLink = (videoData.embedLink as string) ||
        `<iframe src="https://iframe.mediadelivery.net/embed/256964/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true" allowfullscreen="true"></iframe>`;
      
      setUploadStatus('done');
      setUploadMessage(processingComplete ? 'Upload concluído!' : 'Upload enviado! Processamento em background.');

      return { embedLink, guid: videoId };

    } catch (error) {
      console.error('Erro no upload para Bunny.net:', error);
      setUploadStatus('error');
      setUploadMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
    setUploadStatus('uploading');

    try {
      const result = await uploadToBunny(file);
      onVideoUploaded(result.embedLink, result.guid);
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Erro no upload do vídeo:', error);
      alert(`Erro ao fazer upload do vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
    <div className="space-y-2">
      {/* Upload Area - Compact */}
      <div
        className={`border border-dashed rounded-lg p-3 transition-colors ${
          isUploading
            ? 'border-vintage-gold bg-vintage-gold/10'
            : dragActive
            ? 'border-vintage-gold bg-vintage-gold/10'
            : 'border-vintage-gold/30 hover:border-vintage-gold/50 bg-vintage-black/20'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vintage-gold"></div>
              <span className="text-vintage-gold text-sm font-vintage-body">{uploadMessage}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-vintage-black/50 rounded-full h-1.5">
                <div
                  className="bg-vintage-gold h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-vintage-cream/70 text-xs">{uploadProgress}%</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Video className="h-4 w-4 text-vintage-gold/70" />
              <span className="text-vintage-cream text-sm font-vintage-body">
                {currentEmbedLink ? 'Vídeo carregado' : 'Selecionar vídeo'}
              </span>
            </div>
            <input
              id="video-file-input"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <button
              onClick={() => document.getElementById('video-file-input')?.click()}
              disabled={isUploading}
              className="bg-vintage-gold/20 text-vintage-gold hover:bg-vintage-gold hover:text-vintage-black border border-vintage-gold/30 rounded px-3 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentEmbedLink ? 'Alterar' : 'Escolher'}
            </button>
          </div>
        )}
      </div>

      {/* Status Messages - Compact */}
      {uploadStatus === 'error' && (
        <div className="bg-red-900/30 border border-red-500/30 rounded px-3 py-2">
          <p className="text-red-300 text-xs font-vintage-body">{uploadMessage}</p>
        </div>
      )}

      {uploadStatus === 'done' && (
        <div className="bg-green-900/30 border border-green-500/30 rounded px-3 py-2">
          <p className="text-green-300 text-xs font-vintage-body">{uploadMessage}</p>
        </div>
      )}

      {/* Info - Compact */}
      <div className="text-xs text-vintage-cream/60">
        <p>• Enviado para Bunny.net CDN • Processamento pode levar alguns minutos</p>
      </div>
    </div>
  );
}
