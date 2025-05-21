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
  try {
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
          sighting: {
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
      },
      { $addFields: { UserEmail: "$User.Email" } },
      { $project: { User: 0 } },
      {$project: { user_id: 0 } },
    ];

    let results = await dbConnect
      .collection(COLLECTION)
      .aggregate(pipeline)
      .toArray()
      .catch(err => res.status(400).send('Error al buscar los avistamientos'));

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
  } catch (err) {
    console.error(err);
    res.status(500).send('Error interno del servidor');
  }
});

//ruta POST /sightings
const ajv = new Ajv();
addFormats(ajv);
const sightingSchema = require('../schemas/sightings.schema.json');

router.post('/', async (req, res) => {
  const dbConnect = dbo.getDb();
  let sighting;
  
  try {
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
    if (!user || user.length === 0) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }
    console.log(user);
    // console.log(user[0]._id);
    // Preparar el objeto sighting
    sighting = {
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  // Insertar en la base de datos
  try {
    const result = await dbConnect.collection(COLLECTION).insertOne(sighting);
    res.status(201).send({ message: 'Avistamiento insertado', id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(400).send({error: 'Error al insertar el avistamiento', details: err });
  }
});

// ruta GET /sightings/user
router.get('/user', async (req, res) => {
  const dbConnect = dbo.getDb();
  const userEmail = req.query.user_email;

  if (!userEmail) {
    return res.status(400).json({ error: "El parámetro user_email es obligatorio" });
  }

  try {
    // Buscar el usuario por email
    const user = await dbConnect.collection('people').findOne({ Email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Buscar los avistamientos por user_id
    const sightings = await dbConnect
      .collection(COLLECTION)
      .find({ user_id: user._id })
      .toArray();

    res.status(200).json(sightings);
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ruta GET /sightings/{sightingsId}
router.get("/:sightingId", async (req, res) => {
  const dbConnect = dbo.getDb();
  const sightingId = req.params.sightingId;
  try {
    if (!ObjectId.isValid(sightingId)) {
      return res.status(400).send('ID de avistamiento inválido');
    }

    let query = { _id: new ObjectId(sightingId) };
    let result = await dbConnect
      .collection(COLLECTION)
      .findOne(query);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(404).send('No se encontró el avistamiento');
    }
  } catch (err) {
    res.status(400).send("ID de avistamiento inválido");
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

// ruta PUT /sightings/{sightingId}
router.put("/:sightingId", async (req, res) => {
  const dbConnect = dbo.getDb();
  const sightingId = req.params.sightingId;
  try {
    if (!ObjectId.isValid(sightingId)) {
      return res.status(400).send('ID de avistamiento inválido');
    }
    const validate = ajv.compile(sightingSchema);
    const valid = validate(req.body);
    if (!valid) {
      return res.status(400).json({ error: "Datos inválidos", details: validate.errors });
    }
    const data = req.body;
    const user = await dbConnect.collection('people').findOne({ Email: data.user_email });
    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }
    // Preparar el objeto sighting actualizado
    const updatedSighting = {
      datetime: new Date(data.datetime),
      shape: data.shape,
      duration: data.duration,
      comments: data.comments,
      date_posted: new Date(data.date_posted),
      latitude: data.latitude,
      longitude: data.longitude,
      user_id: user._id
    };
    let query = { _id: new ObjectId(sightingId) };
    const result = await dbConnect
      .collection(COLLECTION)
      .replaceOne(query, { ...updatedSighting, _id: new ObjectId(sightingId) });
    if (result.matchedCount > 0) {
      res.status(200).json({ ...updatedSighting});
    } else {
      res.status(404).json({ error: "No se encontró el avistamiento" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor", details: err.message });
  }
});

module.exports = router;
