const { MongoClient, ObjectId } = require('mongodb');

async function updateSightingsWithUserIds() {
  const uri = 'mongodb://localhost:27017'; // Cambia esto si usas otro host o credenciales
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('Trufo'); // Cambia esto por el nombre de tu BD

    const users = await db.collection('people').find().toArray();

    // Crear un mapa: índice del usuario → ObjectId
    const userIndexMap = {};
    users.forEach(user => {
      userIndexMap[user.Index] = user._id;
    });

    // Obtener todos los sightings
    const sightings = await db.collection('sightings').find().toArray();

    for (const sighting of sightings) {
      const userId = userIndexMap[sighting.index_people];
      if (userId) {
        await db.collection('sightings').updateOne(
          { _id: sighting._id },
          {
            $set: { user_id: userId },
            $unset: { index_people: "" } // opcional: elimina el campo antiguo
          }
        );
      }
    }

    console.log('Actualización completada.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

updateSightingsWithUserIds();