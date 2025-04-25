const { response, request } = require('express');
const { generarJWT } = require('../helpers/generar-jwt.js')
const { dbError } = require('../models/mensaje_standar.js')
const { db } = require('../db/connection');

const jwt = require('jsonwebtoken');
const { LibreriaConstantes } = require('../models/Constants.js');

var LocalStorage = require('node-localstorage').LocalStorage;

// Metodo que Crea el token Transaccional
// {params} recibe id del cliente (clientId) - codigo secreto del cliente (clientSecret) {/params}

const tokenPost = async (req = request, res = response) => {
    localStorage = new LocalStorage('./scratch')
    // localStorage.clear();

    // Seteo de parametros para ejecucion
    const clientId = req.header(LibreriaConstantes.UNICOINICIAL);
    if (clientId === null || clientId === ''){
        let filtrado = dbError.filter(id => id.idSec === '114');
        let auxiliar = JSON.stringify(filtrado).slice(11, -16);
        auxiliar = '{' + auxiliar + '}';
        return res.status(401).json(JSON.parse(auxiliar))
    }
    else{
        localStorage.setItem(LibreriaConstantes.UNICOINSTITUCION, clientId);
    }
    const clientSecret = req.header(LibreriaConstantes.UNICOINICIALINSTI);
    if (clientSecret === null || clientSecret === ''){
        let filtrado = dbError.filter(id => id.idSec === '114');
        let auxiliar = JSON.stringify(filtrado).slice(11, -16);
        auxiliar = '{' + auxiliar + '}';
        return res.status(400).json(JSON.parse(auxiliar))
    }
    else {
        localStorage.setItem(LibreriaConstantes.UNICOCLIENTE,clientSecret);
    }
    
    let consulta = 'EXEC Interfaz.sp_ws_pichincha_usuario ' + clientId
    const [ result ] = await db.query(consulta)
    if (result[0].codigo_respuesta === '104'){
        let filtrado = dbError.filter(id => id.idSec === '104');
        let auxiliar = JSON.stringify(filtrado).slice(11, -16);
        return res.status(401).json(JSON.parse(auxiliar))        
    }

    // llamado al helper de creacion de token generarJWT
    // {params} clientId - clientSecret {/params}
    // {returns} regresa token de transaccion {/returns}
    try {
        let inicio = process.hrtime()
            const token = await generarJWT(clientId)
            const fin = process.hrtime(inicio)
            const tiempoTranscurrido = (fin[0] * 1000) + (fin[1] / 1000000);
        if( tiempoTranscurrido >= 10){
            let filtrado = dbError.filter(id => id.id === 504);
            return res.status(504).json({
                succes: false,
                data: filtrado
            })
        }
        // Error al no recibir un token o respuesta de la creacion
        if(!token){
            let filtrado = dbError.filter(id => id.idSec === LibreriaConstantes.ERRORGENERACION);
            let auxiliar = JSON.stringify(filtrado).slice(11, -16);
            auxiliar = '{' + auxiliar + '}';
            return res.status(500).json(JSON.parse(auxiliar))
        }

        // Respuesta de proceso de creacion en Json
        localStorage.setItem(LibreriaConstantes.UNICOTOKEN, token)
        return res.status(200).json({
                access_token: token,
                expires_in: 3600,
                token_type: LibreriaConstantes.TIPOTOKEN
        })
    } catch (error) {  
        // Error al no encontrar el recurso solicitado
        let filtrado = dbError.filter(id => id.idSec === LibreriaConstantes.SPFALLIDO);
        auxiliar = JSON.stringify(filtrado).slice(11, -16);
        auxiliar = '{' + auxiliar + '}';
        return res.status(404).json(JSON.parse(auxiliar));
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

module.exports = {
    tokenPost
}