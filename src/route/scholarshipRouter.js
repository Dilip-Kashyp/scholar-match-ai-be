const Router = require("express");
const { verifyJWT } = require("../middleware/auth.js");
const {
    getAllScholarships,
    applyScholarship,
} = require("../controller/scholershipsController.js");
const router = Router();


router.route("/all-scholarships").get(getAllScholarships);
router.route("/apply-scholarship").post(applyScholarship);


module.exports = router;