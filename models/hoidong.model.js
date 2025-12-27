// models/hoiDong.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HoiDongSchema = new Schema(
  {
    tenhd: { type: String, unique: true, required: true },
    mota: { type: String, default: "" },
    ngaybv: { type: Date, required: true }, // ✅ ngày bảo vệ
    phonghd: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HoiDong", HoiDongSchema, "HoiDong");
