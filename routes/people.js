const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const Ajv = require("ajv")
const ajv = new Ajv()
const COLLECTION = "people";

//Esquema para validar persona
const personSchema = {
    type: "object",
    properties: {
        FirstName: { type: "string" },
        LastName: { type: "string" },
        Company: { type: "string" },
        Phone: { type: "string" },
        Email: { type: "string" }
    },
    required: ["FirstName", "LastName", "Company", "Phone", "Email"],
    additionalProperties: false
}
const validate = ajv.compile(personSchema)

router.get('/', async (req, res) => { //Aunque ponga que no usa el req hace falta
    const dbConnect = dbo.getDb();
    const pipeline = [
        { $sort: { _id: -1 } },                         
        { $limit: 100 },                               
        { 
            $project: {                                   
                FirstName: 1, 
                LastName: 1, 
                Company: 1, 
                Phone: 1, 
                Email: 1,
                _id: 0
            }
        },
    ];
    let results = await dbConnect
      .collection(COLLECTION)
      .aggregate(pipeline)
      .toArray()
      .catch(err => res.status(500).send('Error interno del servidor al buscar las personas'));
    res.json(results).status(200);
});

router.post('/', async (req, res) => {
    const valid = validate(req.body);
    if (!valid) { //Devuelve error si el post no tiene todos los datos
        return res.status(400).json({error: "Datos inválidos"});
    }
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
      .catch(err => res.status(500).send('Error interno del servidor al insertar la persona'));
    res.json(newPerson).status(201);
});

module.exports = router;