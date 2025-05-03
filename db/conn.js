require('dotenv').config(); // Cargar variables de entorno
const { MongoClient } = require("mongodb");

const connectionString = process.env.MONGODB_URI;
if (!connectionString) {
  throw new Error("MONGODB_URI no está definida en las variables de entorno");
}

const client = new MongoClient(connectionString);

let dbConnection;

module.exports = {
  connectToDatabase: async () => {
    try {
        await client.connect();
        dbConnection = client.db(); // Conectar a la base de datos Trufo
        console.log("Conexión exitosa a la base de datos Trufo");
    } catch (e) { 
        console.error("Error al conectar a la base de datos:", e);
        process.exit();
    }
  },

  getDb: function () {
    return dbConnection;
  }
};