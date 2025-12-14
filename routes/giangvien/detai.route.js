const express = require('express');
const router = express.Router();
const detaiController = require('../../controllers/giangvien/detai.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware.requireGiangVien);

router.get("/", detaiController.list);

// CREATE
router.get("/create", detaiController.formCreate);
router.post("/create", detaiController.create);

// EDIT
router.get("/edit/:id", detaiController.formEdit);
router.post("/edit/:id", detaiController.update);

// DETAIL (nếu cần)
router.get("/detail/:id", detaiController.detail);

// DELETE
//router.post("/delete/:id", detaiController.remove);

// EXPORT
router.get("/export/:id", detaiController.exportWord);

module.exports = router;