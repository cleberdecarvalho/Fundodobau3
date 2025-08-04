import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

let db;

(async () => {
  db = await open({
    filename: './filmes.db',
    driver: sqlite3.Database
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS filmes (
    GUID TEXT PRIMARY KEY,
    nomeOriginal TEXT,
    nomePortugues TEXT,
    ano TEXT,
    categoria TEXT,
    duracao TEXT,
    sinopse TEXT,
    embedLink TEXT,
    imagemUrl TEXT,
    assistencias INTEGER,
    avaliacoes TEXT,
    videoGUID TEXT,
    videoStatus TEXT
  )`);
})();

// Listar todos os filmes
app.get('/api/filmes', async (req, res) => {
  const filmes = await db.all('SELECT * FROM filmes');
  res.json(filmes.map(f => ({
    ...f,
    categoria: JSON.parse(f.categoria),
    avaliacoes: f.avaliacoes ? JSON.parse(f.avaliacoes) : undefined
  })));
});

// Adicionar filme
app.post('/api/filmes', async (req, res) => {
  const f = req.body;
  await db.run(
    `INSERT INTO filmes (GUID, nomeOriginal, nomePortugues, ano, categoria, duracao, sinopse, embedLink, imagemUrl, assistencias, avaliacoes, videoGUID, videoStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    f.GUID, f.nomeOriginal, f.nomePortugues, f.ano, JSON.stringify(f.categoria), f.duracao, f.sinopse, f.embedLink, f.imagemUrl, f.assistencias, JSON.stringify(f.avaliacoes), f.videoGUID, f.videoStatus
  );
  res.json({ ok: true });
});

// Atualizar filme
app.put('/api/filmes/:guid', async (req, res) => {
  const f = req.body;
  await db.run(
    `UPDATE filmes SET nomeOriginal=?, nomePortugues=?, ano=?, categoria=?, duracao=?, sinopse=?, embedLink=?, imagemUrl=?, assistencias=?, avaliacoes=?, videoGUID=?, videoStatus=? WHERE GUID=?`,
    f.nomeOriginal, f.nomePortugues, f.ano, JSON.stringify(f.categoria), f.duracao, f.sinopse, f.embedLink, f.imagemUrl, f.assistencias, JSON.stringify(f.avaliacoes), f.videoGUID, f.videoStatus, req.params.guid
  );
  res.json({ ok: true });
});

// Remover filme
app.delete('/api/filmes/:guid', async (req, res) => {
  await db.run('DELETE FROM filmes WHERE GUID=?', req.params.guid);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log('API rodando na porta', PORT);
});
