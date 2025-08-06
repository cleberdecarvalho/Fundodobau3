import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { handleDemo } from "./routes/demo";
import { Filme } from "@shared/types";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // API de Filmes (Mock para desenvolvimento)
  let filmes: Filme[] = [];

  // GET /api/filmes - Listar filmes
  app.get("/api/filmes", (_req, res) => {
    res.json(filmes);
  });

  // POST /api/filmes - Criar filme
  app.post("/api/filmes", (req, res) => {
    try {
      const novoFilme: Filme = {
        ...req.body,
        GUID: req.body.GUID || `filme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        id: filmes.length + 1,
      };
      filmes.push(novoFilme);
      res.json({ success: true, guid: novoFilme.GUID });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao criar filme' });
    }
  });

  // PUT /api/filmes/:guid - Atualizar filme
  app.put("/api/filmes/:guid", (req, res) => {
    try {
      const { guid } = req.params;
      const index = filmes.findIndex(f => f.GUID === guid);
      if (index !== -1) {
        filmes[index] = { ...filmes[index], ...req.body };
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: 'Filme não encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao atualizar filme' });
    }
  });

  // DELETE /api/filmes/:guid - Deletar filme
  app.delete("/api/filmes/:guid", (req, res) => {
    try {
      const { guid } = req.params;
      const index = filmes.findIndex(f => f.GUID === guid);
      if (index !== -1) {
        filmes.splice(index, 1);
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: 'Filme não encontrado' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro ao deletar filme' });
    }
  });

  // POST /api/salvar-imagem - Salvar imagem base64 como arquivo
  app.post("/api/salvar-imagem", (req, res) => {
    try {
      const { imagemBase64, nomeFilme } = req.body;
      
      if (!imagemBase64 || !nomeFilme) {
        return res.status(400).json({ success: false, error: 'Imagem e nome do filme são obrigatórios' });
      }

      // Extrair dados base64
      const matches = imagemBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ success: false, error: 'Formato base64 inválido' });
      }

      const mimeType = matches[1];
      const base64String = matches[2];
      
      // Gerar nome do arquivo usando o nome do filme
      const extensao = mimeType.split('/')[1] || 'jpg';
      const nomeArquivo = `${nomeFilme.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${extensao}`;
      const uploadPath = path.join(process.cwd(), 'public', 'images', 'filmes');
      const caminhoArquivo = path.join(uploadPath, nomeArquivo);
      
      // Criar diretório se não existir
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      // Converter base64 para buffer
      const buffer = Buffer.from(base64String, 'base64');
      
      // Salvar arquivo
      fs.writeFileSync(caminhoArquivo, buffer);
      
      console.log('✅ Imagem salva:', caminhoArquivo);
      
      res.json({ 
        success: true, 
        caminho: `/images/filmes/${nomeArquivo}`,
        nomeArquivo 
      });
    } catch (error) {
      console.error('❌ Erro ao salvar imagem:', error);
      res.status(500).json({ success: false, error: 'Erro ao salvar imagem' });
    }
  });

  return app;
}
