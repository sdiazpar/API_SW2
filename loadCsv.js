require('dotenv').config(); // Cargar variables de entorno
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dbo = require('./db/conn');

async function loadCsvToCollection(filePath, collectionName) {
    const dbConnect = dbo.getDb();
    const data = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.datetime) {
                    row.datetime = new Date(row.datetime);
                }
                if (row.date_posted) {
                    row.date_posted = new Date(row.date_posted);
                }
                data.push(row);
            })
            .on('end', async () => {
                try {
                    await dbConnect.collection(collectionName).insertMany(data);
                    console.log(`Datos cargados en la colección ${collectionName}`);
                    resolve();
                } catch (err) {
                    console.error(`Error al cargar datos en ${collectionName}:`, err);
                    reject(err);
                }
            })
            .on('error', (err) => {
                console.error(`Error al leer el archivo ${filePath}:`, err);
                reject(err);
            });
    });
}

(async () => {
    try {
        await dbo.connectToDatabase();

        // Ruta de los archivos CSV
        const peopleCsvPath = path.join(__dirname, 'data', 'people.csv');
        const sightingsCsvPath = path.join(__dirname, 'data', 'sightings.csv');

        // Cargar datos en las colecciones
        await loadCsvToCollection(peopleCsvPath, 'people');
        await loadCsvToCollection(sightingsCsvPath, 'sightings');

        console.log('Carga de datos completada.');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la carga de datos:', err);
        process.exit(1);
    }
})();
