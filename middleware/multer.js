
const multer = require('multer');
const { S3 } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();
const AWS = require('aws-sdk');


const secretsManager = new AWS.SecretsManager({ region: process.env.AWS_REGION });

async function getAwsCredentials() {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: 'AWS-utk' }).promise();
    if (data.SecretString) {
      const secrets = JSON.parse(data.SecretString);
      console.log('AWS Credentials:', secrets);
      return secrets;
    }
  } catch (error) {
    console.error('Error fetching secrets:', error.message);
  }
}

getAwsCredentials().then(credentials => {
  if (credentials) {
    AWS.config.update({
      accessKeyId: credentials.AWS.ACCESS_KEY_ID,
      secretAccessKey: credentials.AWS.SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
  }
});


// Configure AWS S3
const s3 = new S3({
  credentials: {
    accessKeyId: credentials.AWS.ACCESS_KEY_ID,
    secretAccessKey: credentials.AWS.SECRET_ACCESS_KEY,
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
