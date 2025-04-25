const { response, request } = require('express');
const { dbError } = require('../models/mensaje_standar.js');
const { dbErrorStandard } = require('../models/mensaje_pago_consulta.js');
const { db } = require('../db/connection');
const { LibreriaConstantes } = require('../models/Constants.js');
const { bodyParser } = require('body-parser');
const { QueryTypes } = require('sequelize');
const { fork } = require('child_process');
const jwt = require('jsonwebtoken');
const path = require('path');
const { stringify } = require('querystring');

var LocalStorage = require('node-localstorage').LocalStorage;

const ahora = new Date();
const fechaActual = ahora.toISOString().slice(0, 10); // Formato: AAAA-MM-DD
const horaActual = ahora.toLocaleTimeString(); // Hora en formato local
const horaGrabar = horaActual.substring(0, 7);

// Metodo de consulta para pagos Banco Pichincha
// {params} Enviados por el header de la peticion 
// counterPart, clientSecret, tokenHeader {/params}
// {returns} Regresa Json de proceso correcto o error en proceso {/returns}
const consultaPost = async (req = request, res = response) => {
    localStorage = new LocalStorage('./localStorage');

    // recibe los parametros enviados por header de la solicitud
    clientSecret = localStorage.getItem(LibreriaConstantes.UNICOCLIENTE);
    const body = req.body
    const cedulaConsulta = body.counterpart;

    // cedulaConsulta = req.header(LibreriaConstantes.CEDULACLIENTE);
    const tokenHeader = req.header(LibreriaConstantes.TOKENTRANSACCION) || '';  
    const token = tokenHeader.split(' ')[1];

    try {
        const validaToken = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

        var numeroTransaccion = generadorAleatorio(1, 1, 999999999);

        const childPath = path.join(__dirname, LibreriaConstantes.PROCESOCONSULTA);
        const childPath1 = path.join(__dirname, LibreriaConstantes.TIMERCONSULTA);
        
        // crea el llamado a los procesos hijos envia los parametrs necesarios
        const child = fork(childPath, [cedulaConsulta, numeroTransaccion]);
        const child1 = fork(childPath1);

        let firstToFinish = null;
    
        child.send(LibreriaConstantes.MENSAJETIMER);
        child1.send(LibreriaConstantes.MENJASEPROCESO);
        
        // monitorea el proces que termina primero
        child.on(LibreriaConstantes.MENSAGEGENERAL, async (message) => {
            if (!firstToFinish){
                firstToFinish = LibreriaConstantes.PROCESOINICIAL;
                child1.kill();
            }
            // arma el Json de respuesta correcta
            let paraMostrar = JSON.parse(message);
            if(paraMostrar.resultCode === LibreriaConstantes.SPEXITOSO){
                // envia a grabado de log transaccional por respuesta correcta
                resultadoAux = JSON.stringify(paraMostrar).slice(20);
                resultadoAux = '{'+resultadoAux;
                ejecutaLog(paraMostrar, cedulaConsulta);
                return res.status(200).json(JSON.parse(resultadoAux));
            } else {
                // arma el Json de respuesta erronea
                const fechaLog = transformaFecha(fechaActual);
                // envia a grabado de log transaccional por error en ejecucion
                let guardaLog = `${LibreriaConstantes.EJECUTORLOG} '${LibreriaConstantes.OPERACIONCONSULTA}', '${fechaLog}', '${horaGrabar}', '', '', 0, '${cedulaConsulta}', '', ''
                                , '${paraMostrar.resultCode}', '', '${paraMostrar.errorMesagge}', '${horaGrabar}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
                const [ result ] = await db.query(guardaLog)      
                let filtrado = dbErrorStandard.filter(id => id.id === paraMostrar.resultCode);
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
            // arma el Json de tiempo de respuesta muy alto
            let filtrado = dbError.filter(id => id.id === 504);
            let auxiliar = JSON.stringify(filtrado).slice(11, -16);
            auxiliar = '{' + auxiliar + '}'
            const fechaLog = transformaFecha(fechaActual);
            // envia a guardar lor transaccional error en tiempo de ejecucion
            let guardaLog = `${LibreriaConstantes.EJECUTORLOG} '${LibreriaConstantes.OPERACIONCONSULTA}', '${fechaLog}', '${horaGrabar}', '', '', 0, '${cedulaConsulta}', '', ''
                             , '${filtrado[0].id}', '', '${filtrado[0].detail}', '${horaGrabar}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
            const [ result ] = await db.query(guardaLog) 
            return res.status(504).json(JSON.parse(auxiliar))
        });
    
        // manejadores de salida de procesos hijos
        child.on(LibreriaConstantes.SALIDAPROCESO, (code) => {
            console.log(`${LibreriaConstantes.FINPRINCIPAL} ${code}`);
        });
        child1.on(LibreriaConstantes.SALIDAPROCESO, (code) => {
            console.log(`${LibreriaConstantes.FINTIMER} ${code}`);
        });
    
        // manejadores de errores de procesos hijos
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
        const fechaLog = transformaFecha(fechaActual);
        // envia a grabar por error con recurso llamado
        let guardaLog = `${LibreriaConstantes.EJECUTORLOG} '${LibreriaConstantes.OPERACIONCONSULTA}', '${fechaLog}', '${horaGrabar}', '', '', 0, '${cedulaConsulta}', '', ''
                         , '${filtrado[0].id}', '', '${filtrado[0].detail}', '${horaGrabar}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

function generadorAleatorio(count, min, max){
    const numeroUnico = [];
    while (numeroUnico.length < count){
        const randomNum = getRandomInt(min, max);
        if (!numeroUnico.includes(randomNum)){
            numeroUnico.push(randomNum)
        }
    }
    return numeroUnico;
}

// funcion que realiza elñ grabado del log por accion exitosa
// {params} objeto de resultado de la operacion de consulta {/params}
// {returns} operacion exitosa de guardado {/returns}
function ejecutaLog(resultadoFinal, cedulaConsulta){
    const fechaLog = transformaFecha(fechaActual);
    const autorizacion = resultadoFinal.meta.auditNumber
    const cuentas = resultadoFinal.data;
    cuentas.forEach(async ({code, amount }) => {
        let guardaLog = `${LibreriaConstantes.EJECUTORLOG} '${LibreriaConstantes.OPERACIONCONSULTA}', '${fechaLog}', '${horaGrabar}', '', '${autorizacion}', ${amount}, '${code}', '', ''
        , ${LibreriaConstantes.CODIGOEXITOSO}, '${autorizacion}', '${LibreriaConstantes.PROCESOEXITOSO}', '${fechaLog}', ${LibreriaConstantes.CODIGOINSTITUCION}, '', '', '', '', '', ''`
        const [ result ] = await db.query(guardaLog)
    });
    return 1;
}

module.exports = {
    consultaPost,
}