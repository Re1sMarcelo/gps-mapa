const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.static(path.join(__dirname, 'public')));

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
