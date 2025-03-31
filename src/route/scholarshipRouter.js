import Router from "express";
import {
  getAllScholarships,
  applyScholarship,
  overallInformation,
  getAllAppliedScholarships,
} from "../controller/scholershipsController.js";
import verifyJWT from "../middleware/auth.js";

const router = Router();

router.route("/all-scholarships").post(getAllScholarships);
router.route("/apply-scholarship").get(verifyJWT, applyScholarship);
router.route("/overall-status").get(verifyJWT, overallInformation);
router
  .route("/get-applied-scholarships")
  .get(verifyJWT, getAllAppliedScholarships);

export default router;
