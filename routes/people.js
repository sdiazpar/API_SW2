const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
//const ObjectId = require('mongodb').ObjectId;
const COLLECTION = "people";

router.get('/', async (req, res) => {
    const dbConnect = dbo.getDb();
    const pipeline = [
        { $sort: { _id: -1 } },                         // sort
        { $limit: 100 },                               // limit
        { 
            $project: {                                   // project
                _id: 1, 
                Email: 1, 
                Name: 1, 
                Surname: 1, 
                Country: 1, 
                City: 1, 
                Date_of_birth: 1,
            }
        },
    ];
    let results = await dbConnect
      .collection(COLLECTION)
      .aggregate(pipeline)
      .toArray()
      .catch(err => res.status(400).send('Error al buscar los avistamientos'));
    res.json({results}).status(200);
});

module.exports = router;