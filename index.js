const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");

const routeAuth = require("./routes/auth.route");
const routeAdmin = require("./routes/admin/index.route");
const routeGiangVien = require("./routes/giangvien/index.route");
const systemConfig = require("./config/system");
const database = require("./config/database");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Kết nối DB
database.connect();

// Middleware cơ bản
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/static', express.static(__dirname));

// ⚡️ Thêm session + flash TRƯỚC khi khai báo route
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-key", 
    saveUninitialized: true,
  })
);

app.use(flash()); 

// Gắn prefix admin
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.use(`/${systemConfig.prefixAdmin}`, routeAdmin);
app.use("/", routeAuth);
app.use(`/giangvien`,routeGiangVien);
//
// View engine
app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");

// Static cho tinymce
app.use("/tinymce", express.static(path.join(__dirname, "node_modules", "tinymce")));

// Route mặc định

app.get("/", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    if (req.session.user.role === "admin")
        return res.redirect("/admin/dashboard");

    if (req.session.user.role === "giangvien")
        return res.redirect("/giangvien/dashboard");

    return res.redirect("/login");
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
