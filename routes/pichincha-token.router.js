const { Router } = require('express');
const router = Router();

// Ruta fisica del Js
const { tokenPost } = require('../controllers/pichincha-token.controller');

// Ruta del endPonit para obtencion del Token
router.post('/', tokenPost);

module.exports = router;