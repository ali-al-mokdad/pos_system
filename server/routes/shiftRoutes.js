const router = require('express').Router();
const c = require('../controllers/shiftController');
const auth = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.use(auth);
router.get('/', c.list);
router.post('/open', validate(c.openSchema), c.open);
router.post('/:id/close', validate(c.closeSchema), c.close);
router.get('/:id', c.get);

module.exports = router;
