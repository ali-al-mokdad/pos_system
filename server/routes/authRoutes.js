const router = require('express').Router();
const c = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

router.post('/login', validate(c.loginSchema), c.login);
router.post('/logout', auth, c.logout);
router.get('/me', auth, c.me);
router.post('/change-password', auth, validate(c.changePasswordSchema), c.changePassword);

module.exports = router;
