const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DanhGiaGiuaKySchema = new Schema(
  {
    sv_id: { type: Schema.Types.ObjectId, ref: "Sinhvien", required: true },
    detai_id: { type: Schema.Types.ObjectId, ref: "DeTai", required: true },
    giangvien_id: { type: Schema.Types.ObjectId, ref: "Giangvien", required: true },

    diem: { type: Number, default: null }, // %
    ketqua: { type: String, enum: ["Làm tiếp", "Cảnh cáo", "Đình chỉ", "Chưa đánh giá"], default: "Chưa đánh giá" },
    nhanxet: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DanhGiaGiuaKy ||
  mongoose.model("DanhGiaGiuaKy", DanhGiaGiuaKySchema, "DanhGiaGiuaKy");
