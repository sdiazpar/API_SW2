const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const axios = require('axios');


router.get("/:latitud/:longitud", async (req, res) => {
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
    console.log(country);

    const result = {
        pais: country,
        estado : data.address.state,
        latitud: lat,
        longitud: lon,
    }


  if (result) {
    res.status(200).send(result);
  } else {
    res.status(404).send('No se encontró el avistamiento');
  }
});

module.exports = router;