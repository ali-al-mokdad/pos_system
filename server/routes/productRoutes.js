const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = require('express').Router();
const c = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
      cb(null, unique);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) return cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    cb(null, true);
  },
}).single('image');

router.use(auth);
router.get('/', c.list);
router.get('/barcode/:barcode', c.getByBarcode);
router.get('/:id', c.get);
router.post('/', requireAdmin, upload, validate(c.schema), c.create);
router.put('/:id', requireAdmin, upload, validate(c.updateSchema), c.update);
router.delete('/:id', requireAdmin, c.remove);

module.exports = router;
