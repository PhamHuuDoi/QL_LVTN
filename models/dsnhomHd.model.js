// models/dsNhomHoiDong.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DsNhomHoiDongSchema = new Schema(
  {
    hd_id: { type: Schema.Types.ObjectId, ref: "HoiDong", required: true },

    sv1: { type: Schema.Types.ObjectId, ref: "Sinhvien", required: true },
    sv2: { type: Schema.Types.ObjectId, ref: "Sinhvien" },

    detai_id: { type: Schema.Types.ObjectId, ref: "DeTai", required: true },

    tongDiemSv1: { type: Number, default: 0 },
    tongDiemSv2: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DsNhomHoiDongSchema.index({ sv1: 1, sv2: 1 }, { unique: true });

module.exports = mongoose.model(
  "DsNhomHoiDong",
  DsNhomHoiDongSchema,
  "DsNhomHoiDong"
);
