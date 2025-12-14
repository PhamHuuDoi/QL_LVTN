  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

  const SinhVienSchema = new Schema({
    lop: { type: String },
    msvv: { type: String, required: true, unique: true },
    nganh: { type: String },
    ten: { type: String, required: true },
    email: { type: String },
    group: { type: String },
    supervisor: { type: Schema.Types.ObjectId, ref: 'Giangvien', default: null }
  }, { timestamps: true });

  module.exports = mongoose.models.Sinhvien || mongoose.model('Sinhvien', SinhVienSchema, 'SinhVien');
