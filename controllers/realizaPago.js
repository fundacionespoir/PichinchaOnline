const { response, request } = require('express');
const { db } = require('../db/connection');
const { LibreriaConstantes } = require('../models/Constants.js')
const { QueryTypes } = require('sequelize');

var LocalStorage = require('node-localstorage').LocalStorage;

// Proceso Hijo que realiza la funcionalidad del pago a banco pichincha
// {params} recibe mensaje de inicio de proceso (message) 
// auditNumber, counterPart, codigoServicio, valorPago, fechaParam{/params}
// {returns} Regresa resultado de pago, o error al procesar 
// respuestaPrincipal (en caso de exitoso)
// respuesta (en caso de error) {/returns}
process.on(LibreriaConstantes.MENSAGEGENERAL, async (message) => {
    localStorage = new LocalStorage('./scratch');

    // Carga de variables con parametros de ejecucion
    const clientSecret = localStorage.getItem(LibreriaConstantes.UNICOCLIENTE);
    const clientid = localStorage.getItem(LibreriaConstantes.UNICOINSTITUCION);
    const numeroTransaccion = localStorage.getItem(LibreriaConstantes.NUMEROTRANSACCION);
    const auditNumber = process.argv[2];
    const counterPart = process.argv[3];
    const codigoServicio = process.argv[4];
    const valorPago = process.argv[5];
    const fechaParam = process.argv[6];
    const journalID = process.argv[7];
    console.log('cedula', counterPart);

    try {
        let sql = `${LibreriaConstantes.EJECUTAPAGO} '10', '${clientSecret}', '${auditNumber}', 
                '${counterPart}', '${codigoServicio}', ${valorPago}, '${fechaParam}'`
        const [ results ] = await db.query(sql);
        console.log('resultado del pago: ', results.length)
        if (results.length > 1){
            if (results[0].CodigoRespuesta.trimRight() === LibreriaConstantes.CODCASTIGADO) {
                results.shift();
            } 
        }
        const codigoRespuesta = results[0].codigo_respuesta.trimRight();
        if(codigoRespuesta === LibreriaConstantes.PAGOEXITOSO){
            // arma el Json de respuesta
            const respuesta = {meta:{sequenceCompany:auditNumber}, data:[{code: results[0].operacion, amount: results[0].valor, 
                                expirationDate: results[0].fecha, 
                                invoiceItems: [
                                    {key:LibreriaConstantes.COMPROBANTE,
                                     Value: journalID,
                                     flag: LibreriaConstantes.FLAGCABECERA
                                    }]
                                }], resultCode: codigoRespuesta}
            let respuestaPrincipal = JSON.stringify(respuesta);
            process.send(respuestaPrincipal);
            process.exit();
        } else {
            // arma el Json de respuesta por error
            const respuesta = JSON.stringify({resultCode:results[0].codigo_respuesta.trimRight(), errorMesagge:results[0].mensaje_respuesta});
            process.send(respuesta);
            process.exit();
        }
    } catch (error) {
        // arma el Json de respuesta por error
        const respuesta = JSON.stringify({resultCode:LibreriaConstantes.SPFALLIDO, errorMesagge:LibreriaConstantes.SPFALLIDOMENS});
        process.send(respuesta);
        process.exit();
    }
});