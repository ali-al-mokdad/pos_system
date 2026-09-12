const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.use(auth, requireAdmin);
router.get('/', c.list);
router.post('/', validate(c.createSchema), c.create);
router.put('/:id', validate(c.updateSchema), c.update);
router.delete('/:id', c.remove);

module.exports = router;
