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

  // POST /api/salvar-imagem-carrossel - Salvar imagem do carrossel
  app.post("/api/salvar-imagem-carrossel", (req, res) => {
    try {
      const { imagemBase64, nomeFilme, posicao } = req.body;
      
      if (!imagemBase64 || !nomeFilme || posicao === undefined) {
        return res.status(400).json({ success: false, error: 'Imagem, nome do filme e posição são obrigatórios' });
      }

      // Extrair dados base64
      const matches = imagemBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ success: false, error: 'Formato base64 inválido' });
      }

      const mimeType = matches[1];
      const base64String = matches[2];
      
      // Gerar nome do arquivo para o carrossel
      const extensao = mimeType.split('/')[1] || 'jpg';
      const nomeArquivo = `carrossel-${posicao}-${nomeFilme.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${extensao}`;
      const uploadPath = path.join(process.cwd(), 'public', 'images', 'carrossel');
      const caminhoArquivo = path.join(uploadPath, nomeArquivo);
      
      // Criar diretório se não existir
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      // Converter base64 para buffer
      const buffer = Buffer.from(base64String, 'base64');
      
      // Salvar arquivo
      fs.writeFileSync(caminhoArquivo, buffer);
      
      console.log('✅ Imagem do carrossel salva:', caminhoArquivo);
      
      res.json({ 
        success: true, 
        caminho: `/images/carrossel/${nomeArquivo}`,
        nomeArquivo 
      });
    } catch (error) {
      console.error('❌ Erro ao salvar imagem do carrossel:', error);
      res.status(500).json({ success: false, error: 'Erro ao salvar imagem do carrossel' });
    }
  });

  // GET /api/carrossel - Obter configuração do carrossel
  app.get("/api/carrossel", (req, res) => {
    try {
      const carrosselPath = path.join(process.cwd(), 'data', 'carrossel.json');
      
      if (fs.existsSync(carrosselPath)) {
        const carrosselData = fs.readFileSync(carrosselPath, 'utf8');
        const carrossel = JSON.parse(carrosselData);
        res.json({ success: true, carrossel });
      } else {
        // Carrossel padrão se não existir
        const carrosselPadrao = [
          { posicao: 0, filmeId: null, imagemUrl: null, ativo: false },
          { posicao: 1, filmeId: null, imagemUrl: null, ativo: false },
          { posicao: 2, filmeId: null, imagemUrl: null, ativo: false }
        ];
        res.json({ success: true, carrossel: carrosselPadrao });
      }
    } catch (error) {
      console.error('❌ Erro ao obter carrossel:', error);
      res.status(500).json({ success: false, error: 'Erro ao obter carrossel' });
    }
  });

  // POST /api/carrossel - Salvar configuração do carrossel
  app.post("/api/carrossel", (req, res) => {
    try {
      const { carrossel } = req.body;
      
      if (!carrossel || !Array.isArray(carrossel)) {
        return res.status(400).json({ success: false, error: 'Dados do carrossel são obrigatórios' });
      }

      const dataPath = path.join(process.cwd(), 'data');
      const carrosselPath = path.join(dataPath, 'carrossel.json');
      
      // Criar diretório se não existir
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }
      
      // Salvar configuração
      fs.writeFileSync(carrosselPath, JSON.stringify(carrossel, null, 2));
      
      console.log('✅ Configuração do carrossel salva');
      
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao salvar carrossel:', error);
      res.status(500).json({ success: false, error: 'Erro ao salvar carrossel' });
    }
  });

  // GET /api/sliders - Obter todos os sliders
  app.get("/api/sliders", (req, res) => {
    try {
      const slidersPath = path.join(process.cwd(), 'data', 'sliders.json');
      
      if (fs.existsSync(slidersPath)) {
        const slidersData = fs.readFileSync(slidersPath, 'utf8');
        const sliders = JSON.parse(slidersData);
        res.json({ success: true, sliders });
      } else {
        res.json({ success: true, sliders: [] });
      }
    } catch (error) {
      console.error('❌ Erro ao obter sliders:', error);
      res.status(500).json({ success: false, error: 'Erro ao obter sliders' });
    }
  });

  // POST /api/sliders - Criar novo slider
  app.post("/api/sliders", (req, res) => {
    try {
      const { slider } = req.body;
      
      if (!slider || !slider.titulo) {
        return res.status(400).json({ success: false, error: 'Dados do slider são obrigatórios' });
      }

      const dataPath = path.join(process.cwd(), 'data');
      const slidersPath = path.join(dataPath, 'sliders.json');
      
      // Criar diretório se não existir
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }
      
      // Ler sliders existentes
      let sliders = [];
      if (fs.existsSync(slidersPath)) {
        const slidersData = fs.readFileSync(slidersPath, 'utf8');
        sliders = JSON.parse(slidersData);
      }
      
      // Gerar ID único
      const novoSlider = {
        ...slider,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      sliders.push(novoSlider);
      
      // Salvar
      fs.writeFileSync(slidersPath, JSON.stringify(sliders, null, 2));
      
      console.log('✅ Slider criado:', novoSlider.titulo);
      
      res.json({ success: true, slider: novoSlider });
    } catch (error) {
      console.error('❌ Erro ao criar slider:', error);
      res.status(500).json({ success: false, error: 'Erro ao criar slider' });
    }
  });

  // PUT /api/sliders/:id - Atualizar slider
  app.put("/api/sliders/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { slider } = req.body;
      
      if (!slider || !slider.titulo) {
        return res.status(400).json({ success: false, error: 'Dados do slider são obrigatórios' });
      }

      const slidersPath = path.join(process.cwd(), 'data', 'sliders.json');
      
      if (!fs.existsSync(slidersPath)) {
        return res.status(404).json({ success: false, error: 'Slider não encontrado' });
      }
      
      const slidersData = fs.readFileSync(slidersPath, 'utf8');
      let sliders = JSON.parse(slidersData);
      
      const index = sliders.findIndex((s: any) => s.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Slider não encontrado' });
      }
      
      sliders[index] = {
        ...sliders[index],
        ...slider,
        updatedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(slidersPath, JSON.stringify(sliders, null, 2));
      
      console.log('✅ Slider atualizado:', slider.titulo);
      
      res.json({ success: true, slider: sliders[index] });
    } catch (error) {
      console.error('❌ Erro ao atualizar slider:', error);
      res.status(500).json({ success: false, error: 'Erro ao atualizar slider' });
    }
  });

  // DELETE /api/sliders/:id - Excluir slider
  app.delete("/api/sliders/:id", (req, res) => {
    try {
      const { id } = req.params;
      const slidersPath = path.join(process.cwd(), 'data', 'sliders.json');
      
      if (!fs.existsSync(slidersPath)) {
        return res.status(404).json({ success: false, error: 'Slider não encontrado' });
      }
      
      const slidersData = fs.readFileSync(slidersPath, 'utf8');
      let sliders = JSON.parse(slidersData);
      
      const index = sliders.findIndex((s: any) => s.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Slider não encontrado' });
      }
      
      const sliderRemovido = sliders.splice(index, 1)[0];
      
      fs.writeFileSync(slidersPath, JSON.stringify(sliders, null, 2));
      
      console.log('✅ Slider removido:', sliderRemovido.titulo);
      
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao excluir slider:', error);
      res.status(500).json({ success: false, error: 'Erro ao excluir slider' });
    }
  });

  return app;
}
