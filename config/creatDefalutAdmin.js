const Account = require("../models/acount.model");
const md5 = require("md5");

async function createDefaultAdmin() {
    const exists = await Account.findOne({ username: "AD001" });

    if (exists) return;

    await Account.create({
        username: "AD001",
        password: md5("admin123"),
        role: "admin"
    });

    console.log("Admin mặc định đã được tạo!");
}

module.exports = createDefaultAdmin;