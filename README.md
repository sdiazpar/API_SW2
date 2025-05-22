# 🌍 API_SW2 – Registro de avistamientos OVNI  
**Práctica de Sistemas Web 2**

## 🧑‍💻 Equipo de desarrollo
- Pablo Trujillo Oliva  
- Alejandro García Menor  
- Roberto Cinos Vega  
- Miguel Gamboa Sánchez  
- Sergio Díaz Paricio  

---

## 📘 Descripción del proyecto  
**API_SW2** es una API RESTful desarrollada para gestionar avistamientos de objetos voladores no identificados (OVNIs) a nivel mundial.  
Permite registrar reportes, consultar información histórica, filtrar por criterios específicos (como ubicación o características del fenómeno).

Esta API forma parte de la práctica final de la asignatura *Sistemas Web 2*.

---

![Banner](https://i.ibb.co/VYM8N3DP/38107324-bcf3-4dbf-a839-8a6bc35371ad.jpg)


# 📁 Base de Datos: `Trufo`

## 📂 Colecciones

### 🔹 `people`
Contiene información de los usuarios que registran avistamientos.

#### 📄 Documento de ejemplo:
```json
{
  "_id": { "$oid": "68166b03f7baa0d433937acb" },
  "Index": "9",
  "First Name": "Bruce",
  "Last Name": "Payne",
  "Company": "Arroyo, Cain and Hudson",
  "Phone 1": "391.313.4649x42910",
  "Email": "mayerjerome@hurst-graham.net"
}
```

| Campo         | Descripción                         |
|---------------|-------------------------------------|
| `_id`         | Identificador único del usuario     |
| `Index`       | Número de índice interno            |
| `First Name`  | Nombre del usuario                  |
| `Last Name`   | Apellido del usuario                |
| `Company`     | Empresa del usuario                 |
| `Phone 1`     | Número de teléfono                  |
| `Email`       | Correo electrónico                  |


### 🔹 `sightings`
Registra los avistamientos de OVNIs.

#### 📄 Documento de ejemplo:
```json
{
    "_id": "68166b04f7baa0d43393a1e5",
    "datetime": "2024-06-01T20:30:00.000Z",
    "shape": "disk",
    "duration": "888888888820",
    "comments": "Actualización de prueba",
    "date_posted": "2024-06-02T10:00:00.000Z",
    "latitude": "40.12345",
    "longitude": "-3.98765",
    "user_id": "68166b03f7baa0d433937ac3"
}
```

| Campo         | Descripción                                     |
|---------------|-------------------------------------------------|
| `_id`         | Identificador único del avistamiento            |
| `datetime`    | Fecha y hora del avistamiento                   |
| `shape`       | Forma del objeto avistado                       |
| `duration`    | Duración del avistamiento                       |
| `comments`    | Comentarios del usuario                         |
| `date_posted` | Fecha en que se registró el avistamiento        |
| `latitude`    | Latitud del lugar del avistamiento              |
| `longitude`   | Longitud del lugar del avistamiento             |
| `user_id`     | Referencia al `_id` del usuario que lo reportó  |

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio  
```bash
git clone https://github.com/tu-usuario/API_SW2.git
cd API_SW2
```

### 2. Instalar dependencias  
```bash
npm install
```

### 3. Cargar datos iniciales  
Se utilizan dos scripts para poblar la base de datos con los avistamientos y relaciones:
```bash
node loadCsv.js       # Carga los datos desde un archivo CSV
node foreingKeys.js   # Asocia usuarios a los avistamientos
```

### 4. Iniciar el servidor  
```bash
npm start
```

## 🧪 Tecnologías utilizadas

- Node.js + Express
- MongoDB
---

