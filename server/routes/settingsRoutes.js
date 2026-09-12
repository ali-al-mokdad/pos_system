const router = require('express').Router();
const c = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.get('/', auth, c.getSettings);
router.put('/', auth, requireAdmin, validate(c.schema), c.updateSettings);

module.exports = router;
