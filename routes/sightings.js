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
    let results = await dbConnect
      .collection(COLLECTION)
      .find(query)
      .sort({_id: -1})
      .limit(limit)
      .project({titulo:1})
      .toArray()
      .catch(err => res.status(400).send('Error al buscar los avistamientos'));
    next = results.length == limit ? results[results.length - 1]._id : null;
    res.json({results, next}).status(200);
});