const db = require("../models");
const errorHandler = require("../utils/errorHandler");

const NguoiDung = db.NguoiDung;
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
// lấy số lượng thông báo chưa đọc của người dùng
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;
    const count = await ThongBao.count({
      where: {
        nguoiDungId,
        daDoc: false,
      },
    });

    res.json({ success: true, data: count });
  } catch (error) {
    errorHandler(res, error);
  }
};

// đánh dấu đã đọc cho các thông báo.
exports.markNotificationsAsRead = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách ID không hợp lệ.",
      });
    }

    const result = await ThongBao.update(
      { daDoc: true },
      {
        where: {
          nguoiDungId,
          id: ids,
        },
      }
    );

    res.json({
      success: true,
      message: "Đã đánh dấu thông báo là đã đọc.",
      updated: result[0], // số bản ghi đã cập nhật
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Gửi thông báo cho người dùng
exports.sendNotification = async (req, res) => {
  try {
    const { nguoiDungIds, tieuDe, noiDung } = req.body;

    if (
      !Array.isArray(nguoiDungIds) ||
      nguoiDungIds.length === 0 ||
      !tieuDe ||
      !noiDung
    ) {
      return res.status(400).json({
        success: false,
        message: "Thiếu danh sách người dùng, tiêu đề hoặc nội dung.",
      });
    }

    const notifications = nguoiDungIds.map((id) => ({
      nguoiDungId: id,
      tieuDe,
      noiDung,
    }));

    const result = await db.ThongBao.bulkCreate(notifications);

    res.json({
      success: true,
      message: `Đã gửi thông báo cho ${result.length} người dùng.`,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};
