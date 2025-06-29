const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const fs = require("fs");
const path = require("path");
const errorHandler = require("../utils/errorHandler");

const User = db.NguoiDung;

// Đăng ký người dùng (dành cho cả client và admin)
exports.register = async (req, res) => {
  try {
    const { tenDangNhap, matKhau, soDienThoai, email, vaiTro } = req.body;

    // Kiểm tra trùng lặp
    const [existingUsername, existingPhone, existingEmail] = await Promise.all([
      User.findOne({ where: { tenDangNhap } }),
      soDienThoai ? User.findOne({ where: { soDienThoai } }) : null,
      User.findOne({ where: { email } }),
    ]);

    if (existingUsername)
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    if (existingPhone)
      return res.status(400).json({ message: "Số điện thoại đã được sử dụng" });
    if (existingEmail)
      return res.status(400).json({ message: "Email đã được đăng ký" });

    const hashedPassword = await bcrypt.hash(matKhau, 10);

    // Xác định vai trò người dùng
    let finalVaiTro = "client";
    const validRoles = ["admin", "staff", "client"];

    if (req.user?.vaiTro === "admin" && validRoles.includes(vaiTro)) {
      finalVaiTro = vaiTro;
    }

    const newUser = await User.create({
      tenDangNhap,
      matKhau: hashedPassword,
      soDienThoai,
      email,
      vaiTro: finalVaiTro,
      duongDanAvatar: "avatars/default.png",
    });

    res.status(201).json({
      message: "Đăng ký thành công",
      userId: newUser.id,
      vaiTro: newUser.vaiTro,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { tenDangNhap, matKhau } = req.body;

    const user = await User.findOne({ where: { tenDangNhap } });
    const isMatch = user ? await bcrypt.compare(matKhau, user.matKhau) : false;
    if (!user || !isMatch) {
      return res
        .status(401)
        .json({ message: "Tên đăng nhập hoặc mật khẩu không đúng!" });
    }

    const token = jwt.sign(
      { user_id: user.id, vaiTro: user.vaiTro },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        tenDangNhap: user.tenDangNhap,
        email: user.email,
        vaiTro: user.vaiTro,
        duongDanAvatar: user.duongDanAvatar,
      },
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const deleteUploadedFileIfExists = (file) => {
  if (file) {
    const filePath = path.join(__dirname, "../uploads/avatars", file.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.warn("[Cảnh báo] Không thể xóa ảnh mới:", err.message);
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const isAdmin = req.user.vaiTro === "admin";
    const paramId = req.params.id;
    const userId = isAdmin && paramId ? parseInt(paramId) : req.user.user_id;

    const { tenDangNhap, email, soDienThoai, vaiTro, trangThai } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      deleteUploadedFileIfExists(req.file);
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    if (!isAdmin && req.user.user_id !== user.id) {
      deleteUploadedFileIfExists(req.file);
      return res
        .status(403)
        .json({ message: "Bạn không thể cập nhật thông tin người khác" });
    }

    if (!isAdmin && (vaiTro || trangThai)) {
      deleteUploadedFileIfExists(req.file);
      return res
        .status(403)
        .json({ message: "Không có quyền thay đổi vai trò hoặc trạng thái" });
    }

    if (
      isAdmin &&
      req.user.user_id === user.id &&
      (vaiTro || trangThai) &&
      (vaiTro !== user.vaiTro || trangThai !== user.trangThai)
    ) {
      deleteUploadedFileIfExists(req.file);
      return res.status(403).json({
        message: "Admin không thể tự thay đổi vai trò hoặc trạng thái của mình",
      });
    }

    // Kiểm tra trùng
    const [usernameExists, phoneExists, emailExists] = await Promise.all([
      tenDangNhap && tenDangNhap !== user.tenDangNhap
        ? User.findOne({ where: { tenDangNhap } })
        : null,
      soDienThoai && soDienThoai !== user.soDienThoai
        ? User.findOne({ where: { soDienThoai } })
        : null,
      email && email !== user.email ? User.findOne({ where: { email } }) : null,
    ]);

    if (usernameExists && usernameExists.id !== user.id) {
      deleteUploadedFileIfExists(req.file);
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
    }

    if (phoneExists && phoneExists.id !== user.id) {
      deleteUploadedFileIfExists(req.file);
      return res.status(400).json({ message: "Số điện thoại đã được sử dụng" });
    }

    if (emailExists && emailExists.id !== user.id) {
      deleteUploadedFileIfExists(req.file);
      return res.status(400).json({ message: "Email đã được đăng ký" });
    }

    const fieldsToUpdate = {
      tenDangNhap: tenDangNhap || user.tenDangNhap,
      email: email || user.email,
      soDienThoai: soDienThoai || user.soDienThoai,
      vaiTro: isAdmin ? vaiTro || user.vaiTro : user.vaiTro,
      trangThai: isAdmin ? trangThai || user.trangThai : user.trangThai,
    };

    if (req.file) {
      const oldAvatar = user.duongDanAvatar;
      const newAvatarPath = "avatars/" + req.file.filename;

      if (oldAvatar && !oldAvatar.includes("default.png")) {
        const oldPath = path.join(__dirname, "../uploads", oldAvatar);
        fs.unlink(oldPath, (err) => {
          if (err)
            console.warn("[Cảnh báo] Không thể xóa avatar cũ:", err.message);
        });
      }

      fieldsToUpdate.duongDanAvatar = newAvatarPath;
    }

    await user.update(fieldsToUpdate);
    res.json({ message: "Cập nhật thành công", user });
  } catch (err) {
    deleteUploadedFileIfExists(req.file);
    errorHandler(res, err);
  }
};
