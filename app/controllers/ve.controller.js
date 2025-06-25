const db = require("../models");
const errorHandler = require("../utils/errorHandler");

const Ve = db.Ve;
const Ghe = db.Ghe;
const LichChieu = db.LichChieu;
const ComboVe = db.ComboVe;
const Combo = db.Combo;
const ThongBao = db.ThongBao;

// Lấy tất cả vé của người dùng
exports.getTicketsByUser = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;
    const tickets = await Ve.findAll({
      where: { nguoiDungId },
      include: [
        Ghe,
        {
          model: LichChieu,
          include: [db.Phim, db.PhongChieu],
        },
        {
          model: ComboVe,
          include: [Combo],
        },
      ],
      order: [["muaLuc", "DESC"]],
    });
    res.json({ success: true, data: tickets });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy tất cả vé
exports.getAllTicketsAdmin = async (req, res) => {
  try {
    const tickets = await Ve.findAll({
      include: [
        db.NguoiDung,
        db.Ghe,
        {
          model: db.LichChieu,
          include: [db.Phim, db.PhongChieu],
        },
      ],
      order: [["muaLuc", "DESC"]],
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy vé bằng mã qr
exports.getTicketByQR = async (req, res) => {
  try {
    const { qr } = req.params;

    const ve = await Ve.findOne({
      where: { maQR: qr },
      include: [
        Ghe,
        {
          model: LichChieu,
          include: [db.Phim, db.PhongChieu],
        },
        {
          model: ComboVe,
          include: [Combo],
        },
      ],
    });
    if (!ve) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé từ mã QR." });
    }
    if (ve.nguoiDungId !== req.user.user_id && req.user.vaiTro !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền truy cập vé này." });
    }
    res.json({ success: true, data: ve });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Check in vé
exports.checkInTicket = async (req, res) => {
  try {
    const { qr } = req.params;

    const ve = await Ve.findOne({
      where: { maQR: qr },
      include: [
        {
          model: db.ComboVe,
        },
        {
          model: db.Ghe,
          include: [
            {
              model: db.PhongChieu,
              include: [db.ChiNhanh],
            },
          ],
        },
        {
          model: db.LichChieu,
          include: [db.Phim],
        },
      ],
    });

    if (!ve) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé." });
    }

    const comboChuaThanhToan = ve.ComboVes.some((cv) => !cv.daThanhToanCombo);

    const isValid =
      ve.trangThai === "unused" &&
      ve.daThanhToan === true &&
      !comboChuaThanhToan;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Vé không hợp lệ!",
      });
    }
    await ve.update({ trangThai: "used" });
    // Chuẩn bị dữ liệu trả về
    const result = {
      veId: ve.id,
      phim: ve.LichChieu?.Phim?.ten || null,
      batDau: ve.LichChieu?.batDau,
      phong: ve.Ghe?.PhongChieu?.ten,
      chiNhanh: ve.Ghe?.PhongChieu?.ChiNhanh?.ten,
      ghe: `${ve.Ghe?.hang}${ve.Ghe?.cot}`,
      maQR: ve.maQR,
    };

    res.json({
      success: true,
      message: "Vé hợp lệ để sử dụng.",
      data: result,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Thanh toán tại quầy
exports.confirmPaymentAtCounter = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { qr } = req.params;

    const ve = await Ve.findOne({
      where: { maQR: qr },
      include: [{ model: db.ComboVe }],
      transaction: t,
    });

    if (!ve) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé." });
    }

    let updated = false;

    // Nếu chưa thanh toán vé → cập nhật
    if (!ve.daThanhToan) {
      await ve.update(
        { daThanhToan: true, trangThai: "unused" },
        { transaction: t }
      );
      updated = true;
    }

    // Nếu có combo chưa thanh toán → cập nhật
    const comboChuaThanhToan = ve.ComboVes.filter((cv) => !cv.daThanhToanCombo);

    if (comboChuaThanhToan.length > 0) {
      const comboIds = comboChuaThanhToan.map((cv) => cv.id);
      await db.ComboVe.update(
        { daThanhToanCombo: true },
        {
          where: { id: comboIds },
          transaction: t,
        }
      );
      updated = true;
    }

    if (!updated) {
      await t.rollback();
      return res.status(200).json({
        success: false,
        message: "Vé và combo đều đã thanh toán trước đó.",
      });
    }

    // Thông báo cho người dùng
    await db.ThongBao.create(
      {
        nguoiDungId: ve.nguoiDungId,
        tieuDe: "Xác nhận thanh toán tại quầy",
        noiDung: `Vé mã QR ${ve.maQR} đã được xác nhận thanh toán tại quầy.`,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Xác nhận thanh toán thành công tại quầy.",
    });
  } catch (error) {
    await t.rollback();
    errorHandler(res, error);
  }
};

//  Hủy vé
exports.cancelTicket = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { veId } = req.params;

    const ve = await Ve.findByPk(veId, {
      include: [LichChieu],
      transaction: t,
    });

    if (!ve) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé." });
    }
    if (ve.nguoiDungId !== req.user.user_id && req.user.vaiTro !== "admin") {
      await t.rollback();
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền hủy vé này." });
    }
    if (ve.trangThai !== "pending" && ve.trangThai !== "unused") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Vé không thể hủy trong trạng thái hiện tại.",
      });
    }

    const now = new Date();
    const start = new Date(ve.LichChieu.batDau);
    const diffHours = (start - now) / (1000 * 60 * 60);

    if (diffHours < 6) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Chỉ được hủy vé trước suất chiếu ít nhất 6 tiếng.",
      });
    }

    const newStatus = ve.daThanhToan ? "refunded" : "cancelled";
    await ve.update({ trangThai: newStatus }, { transaction: t });

    if (ve.daThanhToan) {
      await ComboVe.update(
        { daThanhToanCombo: false },
        { where: { veId: ve.id }, transaction: t }
      );
    }

    await ThongBao.create(
      {
        nguoiDungId: ve.nguoiDungId,
        tieuDe: "Vé đã được hủy",
        noiDung: `Vé mã QR ${ve.maQR} đã được hủy thành công.`,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: "Vé đã được hủy thành công." });
  } catch (error) {
    await t.rollback();
    errorHandler(res, error);
  }
};
