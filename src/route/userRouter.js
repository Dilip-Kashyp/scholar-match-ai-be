import Router from "express";
import verifyJWT from "../middleware/auth.js";
import {
  userRegister,
  userLogin,
  userProfile,
  userCreate,
  getUserById,
} from "../controller/userController.js";

const router = Router();

router.route("/profile").post(verifyJWT, userProfile);
router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/get-user").get(verifyJWT, getUserById);
router.route("/create-profile").post(userCreate);

export default router;
