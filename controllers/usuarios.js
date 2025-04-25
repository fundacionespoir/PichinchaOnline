const { request, response } = require('express');
const { db } = require('../db/connection');

const usuariosPost =  async (req = request, res = response) => {
    //const { nombre, edad } = req.body;

    const [results, metadata] = await db.query("select * from procedimientos");
// Results will be an empty array and metadata will contain the number of affected rows.

    res.status(201).json({
        
        results
    });
}
const usuariosGet = (req, res = response) => {
    //const params = req.query;
    const { nombre = 'no name', q, key, page = 1 } = req.query;
    res.status(201).json({
        msg: 'get API - controllador'
    });
}
const usuariosPut = (req = request, res = response) => {
    //const {id} = req.params;
    const id = req.params.id;
    res.status(201).json({
        msg: 'put API - controllador',
        id: id
    });
}
const usuariosPatch = (req, res = response) => {
    res.status(201).json({
        msg: 'path API - controllador'
    });
}
const usuariosDelete = (req, res = response) => {
    res.status(201).json({
        msg: 'delete API - controllador'
    });
}

module.exports = {
    usuariosGet,
    usuariosPost,
    usuariosPut,
    usuariosPatch,
    usuariosDelete
}