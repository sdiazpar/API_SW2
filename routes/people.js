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
                Index: 1, 
                FirstName: 1, 
                LastName: 1, 
                Company: 1, 
                Phone: 1, 
                Email: 1,
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

router.post('/', async (req, res) => {
    const dbConnect = dbo.getDb();
    const newPerson = {
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Company: req.body.Company,
        Phone: req.body.Phone,
        Email: req.body.Email,
    };
    let result = await dbConnect
      .collection(COLLECTION)
      .insertOne(newPerson)
      .catch(err => res.status(400).send('Error al insertar la persona'));
    res.json(result).status(200);
});


module.exports = router;