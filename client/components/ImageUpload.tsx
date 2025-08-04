import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageUploaded: (imagePath: string) => void;
  currentImage?: string;
  filmeName?: string;
}

export function ImageUpload({ onImageUploaded, currentImage, filmeName }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome do arquivo baseado no nome do filme ou timestamp
      const fileName = filmeName ? 
        `${filmeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${file.name.split('.').pop()}` :
        `filme-${Date.now()}.${file.name.split('.').pop()}`;

      // Criar FormData para upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('fileName', fileName);

      // Simular upload (na implementação real, seria uma chamada à API)
      const reader = new FileReader();
      reader.onload = () => {
        // Simular salvamento em public/images/filmes
        const imagePath = `/images/filmes/${fileName}`;
        onImageUploaded(imagePath);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

      // Para implementação real com API:
      // const response = await fetch('/api/upload-image', {
      //   method: 'POST',
      //   body: formData
      // });
      // const result = await response.json();
      // onImageUploaded(result.imagePath);

    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
      setIsUploading(false);
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
      handleImageUpload(e.dataTransfer.files[0]);
    }
  }, [filmeName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-vintage-serif font-semibold text-vintage-gold mb-2">
        Imagem do Filme (Poster)
      </label>

      {/* Upload Area */}
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
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                console.error('Erro ao carregar imagem:', currentImage);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-vintage-body">Clique ou arraste para alterar</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="h-12 w-12 text-vintage-gold/60 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-vintage-cream font-vintage-body">
                {isUploading ? 'Fazendo upload...' : 'Clique ou arraste uma imagem aqui'}
              </p>
              <p className="text-sm text-vintage-cream/60 font-vintage-body">
                Formatos suportados: JPG, PNG, WebP
              </p>
              <p className="text-xs text-vintage-cream/50 font-vintage-body">
                Será salva como: {filmeName ? `${filmeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg` : 'filme-[timestamp].jpg'}
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vintage-gold mx-auto mb-2"></div>
              <p className="text-sm font-vintage-body">Fazendo upload...</p>
            </div>
          </div>
        )}
      </div>

      {currentImage && (
        <div className="flex items-center justify-between text-sm text-vintage-cream/60 font-vintage-body">
          <span>Imagem atual carregada</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onImageUploaded('')}
            className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/20"
          >
            <X className="h-3 w-3 mr-1" />
            Remover
          </Button>
        </div>
      )}
    </div>
  );
}
