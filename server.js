const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Rota para inserir dados
app.post('/api/localizacoes', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude e longitude são obrigatórios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO localizacoes (latitude, longitude) VALUES ($1, $2) RETURNING *',
      [latitude, longitude]
    );
    console.log('Dados inseridos:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao inserir dados:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Rota para retornar os dados de localização
app.get('/api/localizacoes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM localizacoes ORDER BY data_hora DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no banco');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

app.get('/api/trajeto-24h', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM localizacoes
      WHERE data_hora >= NOW() - INTERVAL '24 HOURS'
      ORDER BY data_hora ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar trajeto 24h:', err);
    res.status(500).send('Erro no banco de dados');
  }
});
