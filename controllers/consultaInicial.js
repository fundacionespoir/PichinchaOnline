const { response, request } = require('express');
const { db } = require('../db/connection');
const { LibreriaConstantes } = require('../models/Constants.js')
const { QueryTypes } = require('sequelize');

var LocalStorage = require('node-localstorage').LocalStorage;

// Proceso hijo que realiza la funcionalidad de consulta a cuentas para pago para banco pichincha
// {params} parametros enviados por proceso padre
// clientSecret, clientId, counterPart {/params}
// {returns} Regresa resultado de pago, o error al procesar 
// respuestaPrincipal (en caso de exitoso)
// respuesta (en caso de error) {/returns}
process.on(LibreriaConstantes.MENSAGEGENERAL, async (message) => {
    localStorage = new LocalStorage('./scratch');
    
    // setea los parametros para ejecucion
    const clientSecret = localStorage.getItem(LibreriaConstantes.UNICOCLIENTE);
    const clientid = localStorage.getItem(LibreriaConstantes.UNICOINSTITUCION);
    const counterPart = process.argv[2];
    const numeroTransaccion = process.argv[3];
    console.log('numero extraido: ', numeroTransaccion)
    
    try {                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
        let sql = `${LibreriaConstantes.EJECUTACONSULTA} '10', '${clientSecret}', '${counterPart}'`
        const [ results ] = await db.query(sql);
        console.log('resultado consulta: ', results)
        // existeResultado = 'correcto'    
        const codigoRespuesta = results[0].codigo_respuesta.trimRight();
        if (codigoRespuesta === LibreriaConstantes.SPEXITOSO) {
            // arma el Json de respuesta
            results.pop();
            const boolValorSi = Boolean(LibreriaConstantes.REQUERIDOSI);
            const boolValorNo = LibreriaConstantes.REQUERIDONO === 'true' ? true : false
            const respuesta = {resultCode:results[0].codigo_respuesta.trimRight(), meta:{auditNumber:numeroTransaccion}, 
                            data:[{code:counterPart, amount: results[0].valor, expirationDate:results[0].fecha_pago,
                            invoiceItems:[{key: LibreriaConstantes.NOMBRECOMPLETO, value: results[0].nombre, flag: LibreriaConstantes.FLAGDETALLE, required: Boolean(boolValorSi)},
                                          {key: LibreriaConstantes.PRODUCTO, value: results[0].credito, flag: LibreriaConstantes.FLAGNINGUNO, required: Boolean(boolValorSi)}
                                         ]}]};
            // arma Json de respuesta afirmativa
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
        // arma el json por error
        const respuesta = JSON.stringify({resultCode:LibreriaConstantes.SPFALLIDO, errorMesagge:LibreriaConstantes.SPFALLIDOMENS});
        process.send(respuesta);
        process.exit();
    }
});




