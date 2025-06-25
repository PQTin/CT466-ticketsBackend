const db = require("../models");
const errorHandler = require("../utils/errorHandler");

const NguoiDung = db.NguoiDung;
const DanhGiaPhim = db.DanhGiaPhim;
const DanhGiaCombo = db.DanhGiaCombo;
const ThongBao = db.ThongBao;

// Lấy thông tin người dùng hiện tại
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await NguoiDung.findByPk(req.user.user_id, {
      attributes: { exclude: ["matKhau"] },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy tất cả người dùng cho admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await NguoiDung.findAll({
      attributes: { exclude: ["matKhau"] },
      order: [["taoLuc", "DESC"]],
    });
    res.json({ success: true, data: users });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Người dùng đánh giá phim hoặc phản hồi
exports.rateMovie = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;
    const { phimId, binhLuanChaId, diem, binhLuan } = req.body;

    let finalPhimId = phimId;
    let finalDiem = diem;

    if (binhLuanChaId) {
      const cha = await DanhGiaPhim.findByPk(binhLuanChaId);
      if (!cha) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy đánh giá cha." });
      }
      finalPhimId = cha.phimId;
      finalDiem = null; // Phản hồi thì không cần điểm
    } else {
      if (!phimId || typeof diem !== "number") {
        return res.status(400).json({
          success: false,
          message: "Thiếu phimId hoặc điểm đánh giá.",
        });
      }
    }

    const danhGia = await DanhGiaPhim.create({
      nguoiDungId,
      phimId: finalPhimId,
      binhLuanChaId: binhLuanChaId || null,
      diem: finalDiem,
      binhLuan,
    });

    res.json({ success: true, data: danhGia });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Người dùng đánh giá combo
exports.rateCombo = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;
    const { comboId, diem, binhLuan } = req.body;

    if (!comboId || typeof diem !== "number" || diem < 1 || diem > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Dữ liệu đánh giá không hợp lệ." });
    }

    const danhGia = await DanhGiaCombo.create({
      nguoiDungId,
      comboId,
      diem,
      binhLuan,
    });

    res.json({ success: true, data: danhGia });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy danh sách thông báo của người dùng
exports.getUserNotifications = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;
    const list = await ThongBao.findAll({
      where: { nguoiDungId },
      order: [["taoLuc", "DESC"]],
    });
    res.json({ success: true, data: list });
  } catch (error) {
    errorHandler(res, error);
  }
};
