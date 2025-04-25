const { response, request } = require('express');
const jwt = require('jsonwebtoken');
const { LibreriaConstantes } = require('../models/Constants.js')

// Metodo que genera el Token de transaccion
// {params} Recibe usuario (user) - secreto de usuario (secret) {/params}
// {returns} Retorna token transaccional que sera utilizado durante todo el proceso {/returns} 
const generarJWT = ( user ) => {

    return new Promise( (resolve, reject) => {

        const payload = { user };

        jwt.sign( payload, process.env.SECRETORPRIVATEKEY, {
            expiresIn: LibreriaConstantes.VALIDEZTOKEN
        }, ( err, token ) => {

            if ( err ) {
                console.log(err);
                reject( LibreriaConstantes.ERRORTOKEN )
            } else {
                resolve( token );
            }
        })

    })
}

module.exports = {
    generarJWT
}