module.exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.role !== "admin") {
    return res.redirect("/login");
  }
  next();
};

module.exports.requireGiangVien = (req, res, next) => {
  if (!req.session.user || req.session.role !== "giangvien") {
    return res.redirect("/login");
  }
  next();
};