const router = require('express').Router();
const c = require('../controllers/inventoryController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.use(auth, requireAdmin);
router.get('/', c.overview);
router.get('/low-stock', c.lowStock);
router.post('/adjust', validate(c.adjustSchema), c.adjust);
router.get('/movements', c.movements);

module.exports = router;
