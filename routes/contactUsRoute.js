const express =require('express');
const {CreatecontactForm}=require('../controllers/contactusController')

const router =express.Router();

router.post('/Creeate' , CreatecontactForm);

module.exports=router;