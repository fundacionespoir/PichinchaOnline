const { LibreriaConstantes } = require('../models/Constants.js')

// Metodo que efectua el conteo de timepo antes de dar un error 504 por demora en procese de la base
// {params} Recibe un mensaje de inicio {/params}
// {retuns} Regresa la terminacion del timer {/returns}
process.on(LibreriaConstantes.MENSAGEGENERAL, (message1) => {
    console.log(`${LibreriaConstantes.RECIBETIMER} ${message1}`);
    setTimeout(() => {
        process.send(LibreriaConstantes.TERMINATIMER);
        process.exit(0);
    }, 100000);
});