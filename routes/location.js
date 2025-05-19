const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const axios = require('axios');


router.get("/:latitud/:longitud", async (req, res) => {
  try{
  const dbConnect = dbo.getDb();
  const lat = parseFloat(req.params.latitud);
  const lon = parseFloat(req.params.longitud);
  
    
    const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: {
    lat: lat,
    lon: lon,
    format: 'json'
    }
    });
    const country = data.address.country;
    estado = data.address.state;
    console.log(country);

    if (!country && !estado) {
        const resultAMedias = {
            error: 'No se encontraron resultados para las coordenadas proporcionadas',
            latitud: lat,
            longitud: lon
        };
        
        res.status(404).send(resultAMedias);
    } else{
        const result = {
            pais: country,
            estado : estado,
            latitud: lat,
            longitud: lon,
        }
        res.status(200).send(result);

    }
  
  } catch (err) {
    res.status(500).send('Error al conectar con el servicio de geolocalización');
  }
});

module.exports = router;