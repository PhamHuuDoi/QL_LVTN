// routes/admin/hoidong.route.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/hoidong.controller");
const auth = require("../../middlewares/auth.middleware");

router.use(auth.requireAdmin);

router.get("/", ctrl.index);
router.get("/create", ctrl.createForm);
router.post("/create", ctrl.create);

router.post("/:id/add-gv", ctrl.addGiangVien);

router.get("/:id/edit", ctrl.editForm);
router.post("/:id/edit", ctrl.update);
router.post("/delete/:id", ctrl.remove);

module.exports = router;
