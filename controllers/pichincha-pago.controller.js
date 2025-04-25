const { response, request } = require('express');
const { bodyParser } = require('body-parser');
const { QueryTypes } = require('sequelize');
const { db } = require('../db/connection');
const { dbErrorStandard } = require('../models/mensaje_pago_consulta.js');
const { dbError } = require('../models/mensaje_standar.js');
const { LibreriaConstantes } = require('../models/Constants.js')
const { fork } = require('child_process');
const jwt = require('jsonwebtoken');
const path = require('path');
var LocalStorage = require('node-localstorage').LocalStorage;

const ahora = new Date();
const horaActual = ahora.toLocaleTimeString(); // Hora en formato local
const horaGrabar = horaActual.substring(0, 7);

// Metodo que inicia el proceso de pago Banco Pichincha
// {params} Enviados por el header de la solicitud
// Authorizarion (token transaccional) 
//          enviados por Body en la peticion 
// auditNumber, counterPart, codigoServicio, valorPago, fechaSeparar {/params}
// {returns} retorna Json de resultado afirmativo o de error en proceso {/returns}
const pagoPost = async (req = request, res = response) => {

    localStorage = new LocalStorage('./scratch')

    // Recibe el token por el Header
    const tokenHeader = req.header(LibreriaConstantes.TOKENTRANSACCION) || '';  
    const token = tokenHeader.split(' ')[1];
    var codigoServicio= ''
    var codJournal = ''

    // Recibe el body de la peticion
    const body = req.body;
    const auditNumber = body.meta.auditNumber;
    const counterPart = body.data.counterpart;
    body.data.aditionalData.forEach(function(index){
        if (index.key === LibreriaConstantes.PRODUCTO){
            codigoServicio= index.value;
        }
        if (index.key === LibreriaConstantes.JOURNAL){
            codJournal = index.value
        }
    });
    const valorPago = body.data.amount;
    const fechaPago = body.data.paymentDate;
    const fechaSeparar = fechaPago.toString().slice(0, 10);
    const fechaLog = transformaFecha(fechaSeparar);

    // Setea las variables de ejecucion que fueron grabadas en localStorage
    const clientId = localStorage.getItem(LibreriaConstantes.UNICOINSTITUCION);
    const clientSecret = localStorage.getItem(LibreriaConstantes.UNICOCLIENTE);

    // inicia el proceso de pago
    try {
        const validaToken = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

        const childPath = path.join(__dirname, LibreriaConstantes.PROCESOPAGO);
        const childPath1 = path.join(__dirname, LibreriaConstantes.TIMERPAGO);
        
        // Crea el llamado a los procesos Hijos
        const child = fork(childPath, [auditNumber, counterPart, codigoServicio, valorPago, fechaLog, codJournal]);
        const child1 = fork(childPath1);

        let firstToFinish = null;
    
        child.send(LibreriaConstantes.MENSAJEPAGO);
        child1.send(LibreriaConstantes.MENJASEPROCESO);
    
        // verifica que proceso finaliza primero
        child.on(LibreriaConstantes.MENSAGEGENERAL, async (message) => {
            if (!firstToFinish){
                firstToFinish = LibreriaConstantes.PROCESOINICIAL;
                child1.kill();
            }
            let paraMostrar = JSON.parse(message);
            if(paraMostrar.resultCode === LibreriaConstantes.PAGOEXITOSO){
                // entrega respuesta por ejecucion correcta
                // envia a ejecucuion el grabado de log transaccional por respuesta correcta
                ejecutaLog(fechaLog, codigoServicio, auditNumber, valorPago, counterPart);
                let respuestaAux = JSON.stringify(paraMostrar).slice(0,-20)
                respuestaAux = respuestaAux + '}'
                return res.status(200).json(JSON.parse(respuestaAux));
            } else {
                // entrega respuesta por porceso erroneo
                let filtrado = dbErrorStandard.filter(id => id.id === paraMostrar.resultCode);
                // guarda el log de Transacciones, en caso de error
                let guardaLog = `${LibreriaConstantes.EJECUTORLOG} '${LibreriaConstantes.OPERACIONPAGO}', '${fechaLog}', '${horaGrabar}', '', '', ${LibreriaConstantes.VALORENERROR}, '${counterPart}', '', ''
                , '${paraMostrar.resultCode}', '', '${paraMostrar.errorMesagge}', '${fechaLog}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
                const [ result ] = await db.query(guardaLog) 
                let auxiliar = JSON.stringify(filtrado).slice(1, -13)
                auxiliar = auxiliar + '}'
                 res.statusCode=400;
                 return res.json(JSON.parse(auxiliar));
            }   
        });
        child1.on(LibreriaConstantes.MENSAGEGENERAL, async (message) => {
            if (!firstToFinish){
                firstToFinish = LibreriaConstantes.PROCESOPARALELO;
                child.kill();
            }
            // entrega respuesta por finalizacion de tiempo de espera
            let filtrado = dbError.filter(id => id.id === 504);
            let auxiliar = JSON.stringify(filtrado).slice(1, -16);
            auxiliar = auxiliar + '}'
            // envia a guardado de log transaccional por error en tiempo de ejecucion
            let guardaLog = `${LibreriaConstantes.EJECUTORLOG} ${LibreriaConstantes.OPERACIONPAGO}, '${fechaLog}', '${horaGrabar}', '', '', ${LibreriaConstantes.VALORENERROR}, '${counterPart}', '', ''
            , '${filtrado[0].id}', '', '${filtrado[0].detail}', '${fechaLog}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
            const [ result ] = await db.query(guardaLog) 
            return res.status(504).json(JSON.parse(auxiliar));
        });
        
        // manejadores de salida de procesos hijos
        child.on(LibreriaConstantes.SALIDAPROCESO, (code) => {
            console.log(`${LibreriaConstantes.FINPRINCIPAL} ${code}`);
        });
        child1.on(LibreriaConstantes.SALIDAPROCESO, (code) => {
            console.log(`${LibreriaConstantes.FINTIMER} ${code}`);
        });
        
        // menejadores de erroes de procesos hijos
        child.on(LibreriaConstantes.ERRORPROCESO, (err) => {
            console.error(LibreriaConstantes.ERRORPRINCIPAL, err);
        });
        child1.on(LibreriaConstantes.ERRORPROCESO, (err) => {
            console.error(LibreriaConstantes.ERRORTIMER, err);
        });
    } catch (error) {
        // crea json de error por token erroneo o caducado
        let filtrado = dbError.filter(id => id.id === 419);
        let auxiliar = JSON.stringify(filtrado).slice(11, -16);
        auxiliar = '{' + auxiliar + '}'
        const fechaLog = transformaFecha(fechaSeparar);
        // envia a guardado de log transcaccional por error en recurso
        let guardaLog = `${LibreriaConstantes.EJECUTORLOG} ${LibreriaConstantes.OPERACIONPAGO}, '${fechaLog}', '${horaGrabar}', '', '', ${LibreriaConstantes.VALORENERROR}, '${counterPart}', '', ''
                         , '${filtrado[0].id}', '', '${filtrado[0].detail}', '${fechaLog}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
        const [ result ] = await db.query(guardaLog) 
        return res.status(419).json(JSON.parse(auxiliar));
    }
}

// Funcion que transforma fecha en el formato para evnioa Query SQL
// {params} fecha de transaccion {/params}
// {returns} regresa la fecha en el formato necesario para SQL {/returns}
function transformaFecha(fecha){
    const anio = fecha.substring(0,4);
    const mes = fecha.substring(5, 7);
    const dia = fecha.substring(8, 10);
    return anio+mes+dia;
}

// funcion que realiza el guardado del log transaccional por pago exitoso
// {params} fechatran: fecha transaccion 
//          codigoServicio: codigo del prestamo que cancela
//          auditNumber: numero de transaccion 
//          valorPago: valor pagado en la operacion
//          counterPart: cedula del cliente que cancela {/params}
// {returns} regresa ok de grabado de log {/returns}
async function ejecutaLog(fechatran, codigoServicio, auditNumber, valorPago, counterPart){
        let guardaLog = `${LibreriaConstantes.EJECUTORLOG} '${LibreriaConstantes.OPERACIONPAGO}', '${fechatran}', '${horaGrabar}', '', '${codigoServicio}', ${valorPago}, '${counterPart}', '', ''
        , '${LibreriaConstantes.CODIGOEXITOSO}', '${auditNumber}', '${LibreriaConstantes.PROCESOEXITOSO}', '${fechatran}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
        const [ result ] = await db.query(guardaLog)
    return 1;
}

module.exports = {
    pagoPost,
}