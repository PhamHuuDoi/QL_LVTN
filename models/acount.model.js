const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { 
        type: String, 
        enum: ["admin", "giangvien"],
        required: true
    },
    giangvienId: { type: Schema.Types.ObjectId, ref: "Giangvien", default: null } 
}, { timestamps: true });

module.exports = mongoose.models.Account || mongoose.model("Account", accountSchema);