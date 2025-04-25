
const path = require('path');

const subirArchivo = (files, extensionesValidas = ['png', 'jpg', 'jpeg', 'gif'], carpeta = '') => {
    return new Promise((resolve, reject) => {
        const { file } = files;
        //console.log('file', file);

        const nombreCortado = file.name.split('.');
        const extension = nombreCortado[nombreCortado.length - 1];
        if (!extensionesValidas.includes(extension)) {
            return reject(`La extensión ${extension} no es permitida - ${extensionesValidas}`);
        }

        const uploadPath = path.join(__dirname, '../uploads/', carpeta, file.name);
        file.mv(uploadPath, (err) => {
            if (err) {
                reject(err);
            }

            // console.log('file', file.name);
            resolve(`${carpeta}/${file.name}`);
        });
    });
}

const subirArchivoAny = (files, carpeta = '') => {
    return new Promise((resolve, reject) => {
        const { file } = files;

        const uploadPath = path.join(__dirname, '../uploads/', carpeta, file.name);
        file.mv(uploadPath, (err) => {
            if (err) {
                reject(err);
            }

            // console.log('file', file.name);
            resolve(`${carpeta}/${file.name}`);
        });
    });
}

module.exports = {
    subirArchivo,
    subirArchivoAny

}