const express = require('express');
const { saveImageUrl ,getImageByUserId ,updateSign,getAllImages,sendRentalAgreementEmail } = require('../controllers/signController');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Use the same storage configuration as above

// Route to save image URL with user ID
router.post('/save', saveImageUrl); // 'image' is the key for the file input
router.put('/update-pdf', updateSign);
router.get('/get-pdf/:userId', getImageByUserId);
router.get('/get-sign', getAllImages);

//after signed agreement

router.post('/send', sendRentalAgreementEmail);

module.exports = router;
