const router = require('express').Router();
const c = require('../controllers/categoryController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.use(auth);
router.get('/', c.list);
router.put('/reorder', requireAdmin, validate(c.reorderSchema), c.reorder);
router.get('/:id', c.get);
router.post('/', requireAdmin, validate(c.schema), c.create);
router.put('/:id', requireAdmin, validate(c.schema.partial()), c.update);
router.delete('/:id', requireAdmin, c.remove);

module.exports = router;
