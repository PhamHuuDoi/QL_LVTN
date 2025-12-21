const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DiemSVSchema = new Schema(
  {
    phanTichVanDe: { type: Number, min: 0, max: 2.5, default: 0 },
    thietKeVanDe: { type: Number, min: 0, max: 2.5, default: 0 },
    hienThucVanDe: { type: Number, min: 0, max: 2.5, default: 0 },
    kiemTraSanPham: { type: Number, min: 0, max: 2.5, default: 0 },

    tongDiem: { type: Number, default: 0 }, // auto calc
    
    deNghi: {
      type: String,
      enum: [
        "Được bảo vệ",
        "Không được bảo vệ",
        "Bổ sung/hiệu chỉnh để được bảo vệ",
      ],
      default: "Được bảo vệ",
    },
  },
  { _id: false }
);

const DiemPhanBienSchema = new Schema(
  {
    phancongphanbien_id: {
      type: Schema.Types.ObjectId,
      ref: "PhanCongPhanBien",
      required: true,
      unique: true,
    },

    // ===== Điểm từng sinh viên =====
    sv1: { type: DiemSVSchema, default: () => ({}) },
    sv2: { type: DiemSVSchema, default: () => ({}) },

    // ===== Nhận xét chung cho nhóm =====
    nhanXetChung: {
      type: String,
      enum: ["Đạt", "Không đạt"],
      default: "Đạt",
    },
    yeuCauDieuChinh: { type: String, default: "" },
    uuDiem: { type: String, default: "" },
    thieuSot: { type: String, default: "" },

    // tối đa 2 câu hỏi
    cauHoiHoiDong: {
      type: [String],
      validate: [(v) => v.length <= 4, "Tối đa 2 / sinh viên!"],
      default: [],
    },
  },
  { timestamps: true }
);

// ==================
// TỰ TÍNH TỔNG ĐIỂM
// ==================
DiemPhanBienSchema.pre("save", function (next) {
 
  const calc = (sv) =>
    (sv.phanTichVanDe || 0) +
    (sv.thietKeVanDe || 0) +
    (sv.hienThucVanDe || 0) +
    (sv.kiemTraSanPham || 0);

  if (this.sv1) this.sv1.tongDiem = calc(this.sv1);
  if (this.sv2) this.sv2.tongDiem = calc(this.sv2);

  next();
});

module.exports =
  mongoose.models.DiemPhanBien ||
  mongoose.model("DiemPhanBien", DiemPhanBienSchema, "DiemPhanBien");
