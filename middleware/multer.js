// const multer = require("multer");
// const path = require("path");

// // Configure storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); 
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
//   },
// });


// const upload = multer({ storage: storage });

// module.exports = upload;
const multer = require('multer');
const { S3 } = require('@aws-sdk/client-s3');
const path = require('path');

// Configure AWS S3
const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

// Multer setup with memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
    
    if (mimeType && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed.'));
    }
  },
  limits: { fileSize: 1024 * 1024 * 10 }, // Limit to 10MB
});

module.exports = upload;
