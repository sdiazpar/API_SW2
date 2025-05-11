const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS);
const COLLECTION = "sightings";



 router.get('/', async (req, res) => {
    let limit = MAX_RESULTS;
    if (req.query.limit){
      limit =  Math.min(parseInt(req.query.limit), MAX_RESULTS);
    }
    let next = req.query.next;
    let query = {}
    if (next){
      query = {_id: {$lt: new ObjectId(next)}}
    }
    const dbConnect = dbo.getDb();
    const pipeline = [
      { $match: query },                              // equivalente a find(query)
      { $sort: { _id: -1 } },                         // sort
      { $limit: limit },                              // limit
      { 
        $project: {                                   // project
          shape: 1, 
          latitude: 1, 
          longitude: 1, 
          date: 1, 
          user_id: 1 
        } 
      },
      {
        $lookup: {                                    // lookup en people
          from: "people",
          localField: "user_id",
          foreignField: "_id",
          as: "User",
          pipeline: [
            { $project: { _id: 1, Email: 1 } } // project
          ]
        },
      },
      {
        $unwind: { path: "$User", preserveNullAndEmptyArrays: true } // unwind
      }
    ];

    let results = await dbConnect
      .collection(COLLECTION)
      .aggregate(pipeline)
      .toArray()
      .catch(err => res.status(400).send('Error al buscar los avistamientos'));
    next = results.length == limit ? results[results.length - 1]._id : null;
    res.json({results, next}).status(200);
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

module.exports = router;