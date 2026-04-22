const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./cram.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ferramentas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT,
      nome TEXT,
      quantidade INTEGER,
      localizacao TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS movimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ferramenta_id INTEGER,
      responsavel TEXT,
      data_emprestimo TEXT,
      data_devolucao TEXT
    )
  `);
});

app.get('/api/ferramentas', (req, res) => {
  db.all(`
    SELECT f.*, m.responsavel, m.data_emprestimo
    FROM ferramentas f
    LEFT JOIN movimentos m 
      ON f.id = m.ferramenta_id 
      AND m.data_devolucao IS NULL
  `, [], (err, rows) => res.json(rows));
});

app.post('/api/ferramentas', (req, res) => {
  const { numero, nome, quantidade, localizacao } = req.body;

  db.run(`
    INSERT INTO ferramentas (numero, nome, quantidade, localizacao)
    VALUES (?, ?, ?, ?)
  `, [numero, nome, quantidade, localizacao],
  function() {
    res.json({ id: this.lastID });
  });
});

app.post('/api/emprestar/:id', (req, res) => {
  const { responsavel } = req.body;
  const data = new Date().toISOString();

  db.run(`
    INSERT INTO movimentos (ferramenta_id, responsavel, data_emprestimo)
    VALUES (?, ?, ?)
  `, [req.params.id, responsavel, data], () => {
    res.json({ ok: true });
  });
});

app.post('/api/devolver/:id', (req, res) => {
  const data = new Date().toISOString();

  db.run(`
    UPDATE movimentos
    SET data_devolucao = ?
    WHERE ferramenta_id = ?
      AND data_devolucao IS NULL
  `, [data, req.params.id], () => {
    res.json({ ok: true });
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
