const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const { URLSearchParams } = require('url');
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS);
const COLLECTION = "sightings";

router.get('/', async (req, res) => {
    let cityQuery = req.query.city;
    let stateQuery = req.query.state;
    let countryQuery = req.query.country;
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
    // if (cityQuery) {
    //   query2 = { city: { $regex: cityQuery, $options: 'i' } };
    // }
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
      { $match: query2},
      { $match: query3},
      { $match: query4},
      { $sort: { _id: -1 } },
      { $limit: limit },
      { 
        $project: {
          shape: 1, 
          latitude: 1, 
          longitude: 1, 
          date: 1, 
          user_id: 1 
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
