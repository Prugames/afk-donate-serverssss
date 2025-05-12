const express = require('express');
const axios = require('axios');
const app = express();

require('dotenv').config();
const API_KEY = process.env.API_KEY;
const UNIVERSE_ID = '7520012208';

if (!API_KEY) {
  console.error('Error: API_KEY no está definida en las variables de entorno');
}

app.get('/', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send('Servidor: No se proporcionó userId');
  }

  if (!API_KEY) {
    return res.status(500).send('Servidor: API_KEY no está configurada en el servidor');
  }

  try {
    console.log(`Servidor: Solicitando gamepasses para UserId ${userId} con clave: ${API_KEY.substring(0, 8)}...`);

    const response = await axios.get(`https://api.roblox.com/Marketplace/GamePassProducts?universeId=${UNIVERSE_ID}`, {
      headers: {
        'x-api-key': API_KEY,
        'accept': 'application/json'
      },
      timeout: 10000
    });

    console.log(`Servidor: Estado de la respuesta: ${response.status}`);
    console.log(`Servidor: Datos crudos de Roblox: ${JSON.stringify(response.data)}`);

    const gamePasses = response.data || [];
    if (!Array.isArray(gamePasses)) {
      console.log('Servidor: No se encontraron gamepasses o respuesta inválida');
      return res.json([]);
    }

    const userGamePasses = await axios.get(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?assetTypes=GamePass`, {
      headers: {
        'x-api-key': API_KEY,
        'accept': 'application/json'
      },
      timeout: 10000
    });

    const userOwnedIds = userGamePasses.data.data.map(item => item.assetId);
    const formattedGamePasses = gamePasses
      .filter(pass => userOwnedIds.includes(pass.Id))
      .map(pass => ({
        id: pass.Id,
        name: pass.Name || 'Gamepass Desconocido'
      }));

    res.json(formattedGamePasses);
  } catch (error) {
    console.error(`Servidor: Error detallado: ${error.message} ${error.response ? JSON.stringify(error.response.data) : ''}`);
    res.status(error.response ? error.response.status : 500).send('Error al obtener gamepasses');
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor iniciado en el puerto', process.env.PORT || 3000);
});
