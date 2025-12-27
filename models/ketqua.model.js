// models/ketQua.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const KetQuaSchema = new Schema(
  {
    sv_id: {
      type: Schema.Types.ObjectId,
      ref: "Sinhvien",
      required: true,
    },
    detai_id: { type: Schema.Types.ObjectId, ref: "DeTai" },
    gvhd_id: { type: Schema.Types.ObjectId, ref: "Giangvien" },

    diemHD: { type: Number, default: 0 },
    diemPB: { type: Number, default: 0 },
    diemHoiDong: { type: Number, default: 0 },

    tongDiem: { type: Number, default: 0 },
    ketQua: { type: String, default: "" },
  },
  { timestamps: true }
);
KetQuaSchema.index({ sv_id: 1, detai_id: 1 }, { unique: true });

module.exports = mongoose.model("KetQua", KetQuaSchema, "KetQua");
