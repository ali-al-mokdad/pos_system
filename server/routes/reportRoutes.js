const router = require('express').Router();
const c = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(auth, requireAdmin);
router.get('/dashboard', c.dashboard);
router.get('/sales', c.sales);
router.get('/profit', c.profit);
router.get('/products', c.products);
router.get('/inventory', c.inventory);

module.exports = router;
