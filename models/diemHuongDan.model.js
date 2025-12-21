const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DiemHuongDanSchema = new Schema(
  {
    sv_id: {
      type: Schema.Types.ObjectId,
      ref: "Sinhvien",
      required: true,
    },
    detai_id: {
      type: Schema.Types.ObjectId,
      ref: "DeTai",
      required: true,
    },

    nhanXetChung: {
      type: String,
      enum: ["Đạt", "Không đạt"],
      default: "Đạt",
    },
    yeuCauDieuChinh: String,
    uuDiem: String,
    thieuSot: String,

    phanTichVanDe: { type: Number, min: 0, max: 2.5, default: 0 },
    thietKeVanDe: { type: Number, min: 0, max: 2.5, default: 0 },
    hienThucVanDe: { type: Number, min: 0, max: 2.5, default: 0 },
    kiemTraSanPham: { type: Number, min: 0, max: 2.5, default: 0 },

    tongDiem: { type: Number, default: 0 },
    diemBangSo: { type: Number, default: 0 },
    diemBangChu: String,

    cauHoiHoiDong: [{ type: String }],

    deNghiGV: {
      type: String,
      enum: [
        "Được bảo vệ",
        "Không được bảo vệ",
        "Bổ sung/hiệu chỉnh để được bảo vệ",
      ],
      default: "Được bảo vệ",
    },
  },
  { timestamps: true }
);

// Mỗi SV trong 1 đề tài chỉ có 1 phiếu
DiemHuongDanSchema.index({ sv_id: 1, detai_id: 1 }, { unique: true });

DiemHuongDanSchema.pre("save", function (next) {
  const tong =
    (this.phanTichVanDe || 0) +
    (this.thietKeVanDe || 0) +
    (this.hienThucVanDe || 0) +
    (this.kiemTraSanPham || 0);

  this.tongDiem = tong;
  this.diemBangSo = tong;
  next();
});

module.exports =
  mongoose.models.DiemHuongDan ||
  mongoose.model("DiemHuongDan", DiemHuongDanSchema, "DiemHuongDan");
