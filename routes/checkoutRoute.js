const express = require('express');
const {createBookform} = require('../controllers/checkoutController')

const router = express.Router();

router.post('/create',createBookform);
router.get('')

module.exports = router;