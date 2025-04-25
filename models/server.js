
const express = require('express');
//const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { db } = require('../db/connection');
const fileUpload = require('express-fileupload');
const { dbError } = require('../models/mensaje_standar.js');
const bodyParser = require('body-parser');
const { LibreriaConstantes } = require('./Constants.js');

// const limiter = rateLimit({
//     windowMs: 5 * 60 * 100, // define 1 hora
//     max: 100, // Maximo 100 solicitudes en 15 minutos
//     deLayMs: 0, // Sin demora entre solucitudes
//     message: {
//         title: LibreriaConstantes.TITULOPETICIONES,
//         detail: LibreriaConstantes.MUCHASPETICIONES,
//         instance: LibreriaConstantes.CODIGOPETICIONES,
//         type: LibreriaConstantes.DESCRIPCIONPETICION// mensaje de error
//     }
// });

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.consultaPath = '/api/v1/Invoice/consult';
        this.pagoPath = '/api/v1/Invoice/payment'
        this.tokenPath = '/api/v1/Invoice/oauth/token'
        this.dbConnection();

        //Middlewares
        this.middlewares();
        //Rutas de mi Aplicacion
        this.routes();
        
    }

    middlewares() {

        // cors
        this.app.use(cors());
        //lectura y parseo del json
        this.app.use(express.json());
        //lectura y parseo del body de peticiones
        this.app.use(bodyParser.json());
        //limitador de peticiones
        // this.app.use(limiter);

        //directorio publico
        this.app.use(express.static(LibreriaConstantes.DIRECTORIOPUBLICO));

        //FileUpload - Carga de archivos
        this.app.use(fileUpload({
            useTempFiles: true,
            tempFileDir: LibreriaConstantes.DIRECTORIOTEMPORAL,
            createParentPath: true
        }));
    }

    async dbConnection() {
        try {
            await db.authenticate();
            console.log(LibreriaConstantes.BASEENLINEA);
        } catch (error) {
            console.log(LibreriaConstantes.ERRORDATABASE, error.message)
            
            // throw new Error('error 500')
        }
    }

    routes() {
        this.app.use(this.consultaPath, require('../routes/pichincha-consulta.router'))
        this.app.use(this.pagoPath, require('../routes/pichincha-pago.router'))
        this.app.use(this.tokenPath, require('../routes/pichincha-token.router'))
        this.app.use((err, req, res, next) => {
            if (err.status === 504) {
                res.status(504).send(LibreriaConstantes.ERRORTIEMPOESPERA);
            } else {
                next(err); // Pasa el error a los manejadores de errores predeterminados de Express
            }
        });
        this.app.use((req, res) => {
            let filtrado = dbError.filter(id => id.id === 404);
            let auxiliar = JSON.stringify(filtrado).slice(1, -1)
            res.status(404).json(JSON.parse(auxiliar))
        });
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(LibreriaConstantes.PUERTODELSERVIDOR, this.port);
        });
    }
}

module.exports = Server;