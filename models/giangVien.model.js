// models/giangvien.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GVSchema = new Schema({
  magv: { type: String, required: true, unique: true },
  hoten: { type: String, required: true },
  email: { type: String },
  roles: [{
    type: String,
    enum: ["huongdan", "phanbien", "hoidong"],
  }],
}, { timestamps: true });

module.exports = mongoose.models.Giangvien || mongoose.model('Giangvien', GVSchema, 'GiangVien');