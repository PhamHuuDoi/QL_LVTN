const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PhanCongPhanBienSchema = new Schema({
  detai_id: { type: Schema.Types.ObjectId, ref: "DeTai", required: true },
  gvphanbien_id: { type: Schema.Types.ObjectId, ref: "GiangVien", required: true },
  ngayphancong: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports =
  mongoose.models.PhanCongPhanBien ||
  mongoose.model("PhanCongPhanBien", PhanCongPhanBienSchema, "PhanCongPhanBien");