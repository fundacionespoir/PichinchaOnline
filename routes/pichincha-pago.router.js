const { Router } = require('express');
const router = Router();

// Ruta Fisica del Js de Pago Pichincha
const { pagoPost } = require('../controllers/pichincha-pago.controller');

// Ruta del endPoint para el proceso de Pago de Pichincha
router.post('/', pagoPost);

module.exports = router;