const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DeTaiSchema = new Schema(
  {
    ten: { type: String, required: true },
    mota: { type: String },
    nhiemvu: [{ type: String }], // mảng nhiệm vụ

    giangvien_id: {
      type: Schema.Types.ObjectId,
      ref: "Giangvien",
      required: true,
    },

    // tham chiếu tới phân công hướng dẫn (chứa svid, group,...)
    phancong_id: { type: Schema.Types.ObjectId, ref: "PhanCongHuongDan" },
    sv1: { type: Schema.Types.ObjectId, ref: "Sinhvien", required: true },
    sv2: { type: Schema.Types.ObjectId, ref: "Sinhvien" }, // optional

    ngaygiao: { type: Date },
    ngayhoanthanh: { type: Date },

    trangthai: {
      type: String,
      enum: ["Đang hướng dẫn", "Hoàn thành"],
      default: "Đang hướng dẫn",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DeTai || mongoose.model("DeTai", DeTaiSchema, "DeTai");
