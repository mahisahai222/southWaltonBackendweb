
// const express = require('express');
// const router = express.Router();
// const signController = require('../controllers/signController');

// router.post('/save', signController.saveSignature);
// router.get('/:userId', signController.getSignature);
// router.get('/', signController.getAllSignatures); //getAll
// router.delete(':userId', signController.deleteSignature);
// router.get('/image/:userId', signController.getSignatureImage);


// module.exports = router;
const express = require('express');
const { saveImageUrl ,getImageByUserId ,updateSign } = require('../controllers/signController');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Use the same storage configuration as above

// Route to save image URL with user ID
router.post('/save', saveImageUrl); // 'image' is the key for the file input
router.put('/update-pdf', updateSign);
router.get('/get-pdf/:userId', getImageByUserId);
module.exports = router;
