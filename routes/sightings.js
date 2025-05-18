const express = require('express');
const router = express.Router();
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const { URLSearchParams } = require('url');
const axios = require('axios');
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS);
const COLLECTION = "sightings";

router.get('/', async (req, res) => {
    let shapeQuery = req.query.shape;
    
    let fromDate = req.query.from_datetime;
    let toDate = req.query.toDate;

    let limit = MAX_RESULTS;
    if (req.query.limit){
      limit =  Math.min(parseInt(req.query.limit), MAX_RESULTS);
    }
    console.log(req.baseUrl);
    let next = req.query.next;
    let query = {}
    let query2 = {}
    let query3 = {}
    let query4 = {}
    if (next){
      query = {_id: {$lt: new ObjectId(next)}}
    }
    if (shapeQuery){
      query2 = { shape: { $regex: shapeQuery, $options: 'i' } };
    }
    if (fromDate){
      console.log(fromDate);
      console.log(new Date(fromDate));
      query3 = { datetime: { $gte: new Date(fromDate) } };
    }
    if (toDate){
      query4 = { datetime: { $lte: new Date(toDate) } };
    }
    const dbConnect = dbo.getDb();
    const pipeline = [
      { $match: query },
      { $match: query2 },
      { $match: query3 },
      { $match: query4 },
      { $sort: { _id: -1 } },
      { $limit: limit },
      {
        $project: {
          shape: 1,
          date: 1,
          user_id: 1,
          location: {
            $concat: [
              "http://localhost:3000/location/",
              { $toString: "$latitude" },
              "/",
              { $toString: "$longitude" }
            ]
          },
          sightsing: {
            $concat: [
              "http://localhost:3000/sightings/",
              { $toString: "$_id" }
            ]
          }
        }
      },
      {
        $lookup: {
          from: "people",
          localField: "user_id",
          foreignField: "_id",
          as: "User",
          pipeline: [
            { $project: { _id: 0, Email: 1 } }
          ]
        },
      },
      {
        $unwind: { path: "$User", preserveNullAndEmptyArrays: true }
      }
    ];

    let results = await dbConnect
      .collection(COLLECTION)
      .aggregate(pipeline)
      .toArray()
      .catch(err => res.status(400).send('Error al buscar los avistamientos'));

    // nuevo filtro por país usando API externa
    // if (countryQuery) {
    //   const filtered = [];
    //   for (const sighting of results) {
    //     try {
    //       const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    //         params: {
    //           lat: sighting.latitude,
    //           lon: sighting.longitude,
    //           format: 'json'
    //         }
    //       });
    //       const country = data.address.country;
    //       console.log(country);
    //       console.log(countryQuery);
    //       if (country && country.toLowerCase() === countryQuery.toLowerCase()) {
    //         filtered.push(sighting);
    //       }
    //     } catch (e) {
    //       console.error('Error geo API:', e);
    //     }
    //   }
    //   results = filtered;
    // }

    const lastId = results.length === limit ? results[results.length - 1]._id : null;
    let nextLink = null;
    if (lastId) {
      const params = { ...req.query, next: lastId.toString() };
      const qs = new URLSearchParams(params).toString();

      console.log(qs);
      console.log(req.baseUrl);
      console.log(req.query);
      nextLink = `http://localhost:3000/sightings?${qs}`;
    }
    res.status(200).json({ results, next: nextLink });
});

//ruta POST /sightings
const ajv = new Ajv();
addFormats(ajv);
const sightingSchema = require('../schemas/sightings.schema.json');

router.post('/', async (req, res) => {
  const dbConnect = dbo.getDb();

  // Validar el body con AJV
  const validate = ajv.compile(sightingSchema);
  const valid = validate(req.body);
  if (!valid) {
    return res.status(400).json({ error: "Datos inválidos", details: validate.errors });
  }
  const data = req.body;

  // El usuario debe enviar el email en el body
  const userEmail = data.user_email;
  if (!userEmail) {
    return res.status(400).json({ error: "Falta el email del usuario" });
  }

  // Buscar el usuario por email
  const user = await dbConnect.collection('people').find({ Email: userEmail }).limit(1).toArray();
  if (!user) {
    return res.status(400).json({ error: "Usuario no encontrado" });
  }
  console.log(user);
  console.log(user[0]._id);
  // Preparar el objeto sighting
  const sighting = {
    datetime : new Date(data.datetime),
    shape : data.shape,
    duration: data.duration,
    comments: data.comments,
    date_posted: new Date(data.date_posted),
    latitude: data.latitude,
    longitude: data.longitude,
    user_id: user[0]._id
  };
  console.log(sighting);

  // Insertar en la base de datos
  try {
    const result = await dbConnect.collection(COLLECTION).insertOne(sighting);
    res.status(201).send({ message: 'Avistamiento insertado', id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(400).send({error: 'Error al insertar el avistamiento', details: err });
  }
});

// ruta GET /sightings/{sightingsId}
router.get("/:sightingId", async (req, res) => {
  const dbConnect = dbo.getDb();
  let query = { _id: new ObjectId(req.params.sightingId) };
  let result = await dbConnect
    .collection(COLLECTION)
    .findOne(query);
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(404).send('No se encontró el avistamiento');
  }
});

//ruta DELETE /sightings/{sightingId}
router.delete("/:sightingId", async (req, res) => {
  const dbConnect = dbo.getDb();
  try{
  let query = { _id: new ObjectId(req.params.sightingId) };
    let result = await dbConnect
    .collection(COLLECTION)
    .deleteOne(query);
  if (result.deletedCount > 0) {
    res.status(200).send('Avistamiento eliminado');
  } else {
    res.status(404).send('No se encontró el avistamiento');
  }
  } catch (err) {
    res.status(500).send('Error al eliminar el avistamiento');
  }
  
});

module.exports = router;
