const { Router } = require('express');
const router = Router();

// Ruta Fisica para el Js de Consulta Pichincha
const { consultaPost } = require('../controllers/pichincha-consulta.controller');

// Ruta del endPoint para proceso de Consulta Pichincha
router.post('/', consultaPost);

module.exports = router;