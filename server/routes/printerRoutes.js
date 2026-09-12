const router = require('express').Router();
const c = require('../controllers/printerController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.use(auth);
router.get('/status', c.status);
router.post('/test', requireAdmin, c.test);
router.post('/print-receipt', c.printReceipt);

module.exports = router;
