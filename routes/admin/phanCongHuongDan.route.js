const express=require("express");
const router=express.Router();
const controller=require("../../controllers/admin/phanconghuongdan.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
router.use(authMiddleware.requireAdmin);
router.get("/",controller.index);
router.post("/assign",controller.assign);

module.exports=router;
