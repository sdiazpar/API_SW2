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
- dotenv
---

