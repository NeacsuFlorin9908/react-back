const express = require('express');

const router = express.Router();

const {signup, loginAuth} = require('../controllers/auth.js');

router.post('/signup', signup);
router.post('/loginAuth', loginAuth);


module.exports = router;