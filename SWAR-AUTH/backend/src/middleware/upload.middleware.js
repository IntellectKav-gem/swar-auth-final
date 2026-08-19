const upload = require('../config/multer');

const singleUpload = fieldName => (req, res, next) => {
  const handler = upload.single(fieldName);

  handler(req, res, err => {
    if (err) {
      return res.status(400).json({
        error: err.message || 'Upload failed',
      });
    }

    next();
  });
};

const arrayUpload = (fieldName, count) => (req, res, next) => {
  // Allow accepting files up to count + 5 to validate unexpected files gracefully with HTTP 400
  const handler = upload.array(fieldName, count + 5);

  handler(req, res, err => {
    if (err) {
      return res.status(400).json({
        error: 'Exactly 5 voice sample files are required for enrollment'
      });
    }

    if (!req.files || req.files.length !== count) {
      return res.status(400).json({
        error: 'Exactly 5 voice sample files are required for enrollment'
      });
    }

    next();
  });
};

module.exports = { singleUpload, arrayUpload };
