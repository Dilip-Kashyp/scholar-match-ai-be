const Router = require("express");
const { verifyJWT } = require("../middleware/auth.js");
const {
  userRegister,
  userLogin,
  userProfile,
} = require("../controller/userController.js");
const router = Router();

router.route("/profile").post(verifyJWT, userProfile);
router.route("/register").post(userRegister);
router.route("/login").post(userLogin);


module.exports = router;
