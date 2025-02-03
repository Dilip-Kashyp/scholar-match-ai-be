import Router from "express";
import {
  getAllScholarships,
  applyScholarship,
} from "../controller/scholershipsController.js";

const router = Router();


router.route("/all-scholarships").post(getAllScholarships);
router.route("/apply-scholarship").post(applyScholarship);


export default router;