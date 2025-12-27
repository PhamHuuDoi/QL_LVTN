// models/chiTietHoiDong.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChiTietHoiDongSchema = new Schema(
  {
    hoidong_id: {
      type: Schema.Types.ObjectId,
      ref: "HoiDong",
      required: true,
    },
    gv_id: {
      type: Schema.Types.ObjectId,
      ref: "Giangvien",
      required: true,
    },
    chucvu: {
      type: String,
      enum: ["Chủ tịch", "Thư ký", "Ủy viên"],
      required: true,
    },
  },
  { timestamps: true }
);

// mỗi GV chỉ 1 vai trò trong 1 hội đồng
ChiTietHoiDongSchema.index({ hoidong_id: 1, gv_id: 1 }, { unique: true });

module.exports = mongoose.model(
  "ChiTietHoiDong",
  ChiTietHoiDongSchema,
  "ChiTietHoiDong"
);
