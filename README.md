# 🛰️ Projeto Rastreador GPS com Visualização em Mapa

Este projeto consiste na coleta de dados de localização (Latitude, Longitude, Data e Hora) utilizando um módulo GPS com ESP32 integrado com LORA. Os dados são armazenados em um banco de dados PostgreSQL e visualizados em uma página web com **OpenStreetMap** e **Leaflet.js**.

---

## 🚀 Funcionalidades

✅ Coleta de dados de Latitude, Longitude, Data e Hora com Arduino + módulo GPS.  
✅ Armazenamento em um banco de dados PostgreSQL.  
✅ Visualização das localizações em um mapa interativo com OpenStreetMap.  
✅ Interface web simples com consulta aos dados do banco.  

---

## 🛠️ Tecnologias utilizadas

- **ESP32 Lora v2** → coleta de dados via módulo GPS e envio via LORA.
- **PostgreSQL** → banco de dados relacional para armazenar as localizações.
- **Node.js + Express** → backend para conectar ao banco e servir os dados via API.
- **Leaflet.js** → biblioteca JS para renderização de mapas com OpenStreetMap.
- **HTML + CSS + JavaScript** → frontend da aplicação.

---

## 🗂️ Como fazer rodar o servidor:
- Dentro do projeto, no terminal rode:
npm init -y
npm install express pg dotenv
- E para iniciar insira no terminal "node server.js" e no navegador entre no http://localhost:3000

