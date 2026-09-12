const router = require('express').Router();
const c = require('../controllers/saleController');
const held = require('../controllers/heldSaleController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.use(auth);
router.get('/held/list', held.list);
router.post('/held', held.create);
router.delete('/held/:id', held.remove);

router.get('/', c.list);
router.post('/', validate(c.createSchema), c.create);
router.get('/:id', c.get);
router.post('/:id/refund', requireAdmin, validate(c.refundSchema), c.refund);
router.post('/:id/reprint', c.reprint);

module.exports = router;
