const express=require("express");
const router=express.Router();
const controller=require("../../controllers/admin/phanconghuongdan.controller");

router.get("/",controller.index);
router.post("/assign",controller.assign);

module.exports=router;
