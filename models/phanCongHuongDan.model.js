const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PhanCongHuongDanSchemangSchema = new Schema({
  gvid: { type: Schema.Types.ObjectId, ref: "GiangVien", required: true },
  svid: { type: Schema.Types.ObjectId, ref: "SinhVien", required: true },
  group: { type: String, required: true },
  trangthai: { type: String, enum: ["Chưa duyệt", "Đang hướng dẫn", "Hoàn thành"], default: "Chưa duyệt" },
  diemDH: { type: Number, default: 0 },
  CTDiemHD: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.PhanCongHuongDan || mongoose.model("PhanCongHuongDan", PhanCongHuongDanSchemangSchema, "PhanCongHuongDan");
