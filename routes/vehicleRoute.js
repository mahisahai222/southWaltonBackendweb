const express = require('express');
const router = express.Router();
const {getVehicles, changeStatus, removecart, getVehicleById} = require('../controllers/vehicleController');
// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     },
// });

// const upload = multer({ storage: storage });

// Routes
router.get('/',getVehicles);
router.get('/vehicles/:id', getVehicleById);
router.put('/changestatus/:id', changeStatus);
router.put('/removecart/:id', removecart);
// router.post('/', upload.single('image'), vehicleController.createVehicle);
// router.put('/:id', upload.single('image'), vehicleController.updateVehicle);
// router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
