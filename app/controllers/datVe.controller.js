const db = require("../models");
const errorHandler = require("../utils/errorHandler");
const { Op, Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const Ve = db.Ve;
const Ghe = db.Ghe;
const LichChieu = db.LichChieu;
const Combo = db.Combo;
const ComboVe = db.ComboVe;
const MaGiamGia = db.MaGiamGia;
const LoaiGhe = db.LoaiGhe;
const NguoiDung = db.NguoiDung;
const ThongBao = db.ThongBao;
const KhuyenMai = db.KhuyenMai;

// Đặt vé đầy đủ (có thể có combo + mã giảm giá), vé đơn
exports.bookTicket = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      lichChieuId,
      gheId,
      daThanhToan,
      comboList = [],
      maGiamGia = null,
    } = req.body;
    const nguoiDungId = req.user.user_id;

    const [nguoiDung, lichChieu, ghe] = await Promise.all([
      NguoiDung.findByPk(nguoiDungId),
      LichChieu.findByPk(lichChieuId),
      Ghe.findByPk(gheId, { include: [LoaiGhe] }),
    ]);

    if (!nguoiDung || !lichChieu || !ghe) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Người dùng, lịch chiếu hoặc ghế không tồn tại.",
      });
    }

    const existed = await Ve.findOne({
      where: { lichChieuId, gheId },
      transaction: t,
    });
    if (existed) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Ghế đã được đặt.",
      });
    }

    // Xử lý mã giảm giá
    let maGiam = null;
    let maGiamVe = null;
    let maGiamDaApDungChoCombo = false;

    if (maGiamGia) {
      maGiam = await MaGiamGia.findOne({
        where: { ma: maGiamGia, nguoiDungId, daDung: false },
        include: [{ model: KhuyenMai }],
        transaction: t,
      });

      const now = new Date();
      const km = maGiam?.KhuyenMai;

      if (
        !maGiam ||
        !km ||
        !km.hoatDong ||
        now < new Date(km.ngayBatDau) ||
        now > new Date(km.ngayKetThuc)
      ) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
        });
      }
    }
    const giaGocVe =
      parseFloat(lichChieu.giaVe) + parseFloat(ghe.LoaiGhe?.giaPhu || 0);
    let tongGiaVe = giaGocVe;

    if (maGiam && ["ve", "all"].includes(maGiam.KhuyenMai.loaiApDung)) {
      const giam = (tongGiaVe * maGiam.KhuyenMai.phanTramGiam) / 100;
      tongGiaVe -= giam;
      maGiamVe = maGiam;
    }

    // Tạo vé
    const ve = await Ve.create(
      {
        nguoiDungId,
        gheId,
        lichChieuId,
        gia: tongGiaVe,
        giaGoc: giaGocVe,
        daThanhToan: !!daThanhToan,
        trangThai: !!daThanhToan ? "unused" : "pending",
        tenLoaiGhe: ghe.LoaiGhe?.ten || null,
        maQR: uuidv4(),
        maGiamGiaSuDung: maGiamVe?.ma || null,
      },
      { transaction: t }
    );

    for (const c of comboList) {
      if (c.soLuong <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Số lượng combo không hợp lệ.",
        });
      }

      const combo = await Combo.findOne({
        where: { id: c.comboId, daXoa: false },
        transaction: t,
      });

      if (!combo) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Combo không tồn tại: ${c.comboId}`,
        });
      }

      let thanhTien = combo.gia * c.soLuong;
      let maGiamCombo = null;

      if (maGiam && ["combo", "all"].includes(maGiam.KhuyenMai.loaiApDung)) {
        const giam = (thanhTien * maGiam.KhuyenMai.phanTramGiam) / 100;
        thanhTien -= giam;
        maGiamCombo = maGiam;

        maGiamDaApDungChoCombo = true;
      }

      await ComboVe.create(
        {
          veId: ve.id,
          comboId: combo.id,
          gia: combo.gia,
          soLuong: c.soLuong,
          thanhTien,
          daThanhToanCombo: !!daThanhToan,
          maGiamGiaSuDung: maGiamCombo?.ma || null,
        },
        { transaction: t }
      );
    }

    // Nếu mã giảm giá đã dùng cho bất kỳ phần nào thì đánh dấu đã dùng
    if (maGiam && (maGiamVe || maGiamDaApDungChoCombo)) {
      await maGiam.update(
        { daDung: true, suDungLuc: Sequelize.literal("CURRENT_TIMESTAMP") },
        { transaction: t }
      );
    }

    // Thông báo
    const phim = await lichChieu.getPhim();
    const noiDung = daThanhToan
      ? `Bạn đã đặt vé thành công cho phim "${phim.ten}". Mã QR: ${ve.maQR}`
      : `Bạn đã đặt vé cho phim "${phim.ten}". Mã QR: ${ve.maQR}. Vui lòng đến quầy thanh toán trước giờ chiếu 15 phút.`;

    await ThongBao.create(
      {
        nguoiDungId,
        tieuDe: "Đặt vé thành công",
        noiDung,
      },
      { transaction: t }
    );

    const veChiTiet = await Ve.findByPk(ve.id, {
      include: [Ghe, LichChieu, { model: ComboVe, include: [Combo] }],
      transaction: t,
    });

    await t.commit();
    res.json({ success: true, data: veChiTiet });
  } catch (error) {
    await t.rollback();
    errorHandler(res, error);
  }
};

// Thêm combo vào vé
exports.addComboToTicket = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { veId, comboList = [], maGiamGia = null } = req.body;
    const nguoiDungId = req.user.user_id;

    const ve = await Ve.findByPk(veId, {
      include: [Ghe, LichChieu],
      transaction: t,
    });

    if (!ve) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vé.",
      });
    }

    // Kiểm tra người dùng là chủ vé
    if (ve.nguoiDungId !== nguoiDungId) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thêm combo vào vé này.",
      });
    }

    // Kiểm tra mã giảm giá (nếu có)
    let maGiam = null;
    let isMaGiamHopLe = false;

    if (maGiamGia) {
      maGiam = await MaGiamGia.findOne({
        where: { ma: maGiamGia, nguoiDungId, daDung: false },
        include: [{ model: KhuyenMai }],
        transaction: t,
      });

      const now = new Date();
      const km = maGiam?.KhuyenMai;

      isMaGiamHopLe =
        !!km &&
        km.hoatDong &&
        now >= new Date(km.ngayBatDau) &&
        now <= new Date(km.ngayKetThuc) &&
        ["combo", "all"].includes(km.loaiApDung);

      if (!isMaGiamHopLe) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Mã giảm giá không hợp lệ hoặc không áp dụng cho combo.",
        });
      }
    }

    const data = [];

    for (const item of comboList) {
      const { comboId, soLuong, daThanhToanCombo } = item;

      if (soLuong <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Số lượng combo không hợp lệ.",
        });
      }

      const combo = await Combo.findOne({
        where: { id: comboId, daXoa: false },
        transaction: t,
      });

      if (!combo) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Combo không tồn tại: ${comboId}`,
        });
      }

      let thanhTien = combo.gia * soLuong;

      if (isMaGiamHopLe) {
        const giam = (thanhTien * maGiam.KhuyenMai.phanTramGiam) / 100;
        thanhTien -= giam;
      }

      const comboVe = await ComboVe.create(
        {
          veId,
          comboId,
          soLuong,
          gia: combo.gia,
          thanhTien,
          daThanhToanCombo: !!daThanhToanCombo,
          maGiamGiaSuDung: isMaGiamHopLe ? maGiam.ma : null,
        },
        { transaction: t }
      );

      data.push(comboVe);
    }

    // Sau khi tạo xong combo thì mới đánh dấu mã là đã dùng
    if (isMaGiamHopLe) {
      await maGiam.update(
        { daDung: true, suDungLuc: Sequelize.literal("CURRENT_TIMESTAMP") },
        { transaction: t }
      );
    }

    await ThongBao.create(
      {
        nguoiDungId,
        tieuDe: "Thêm combo thành công",
        noiDung: `Bạn đã thêm combo cho vé mã QR: ${ve.maQR}`,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({ success: true, data });
  } catch (error) {
    await t.rollback();
    errorHandler(res, error);
  }
};

exports.paymentCalculator = async (req, res) => {
  try {
    const { lichChieuId, gheId, comboList = [], maGiamGia = null } = req.body;
    const nguoiDungId = req.user.user_id;

    const [lichChieu, ghe] = await Promise.all([
      LichChieu.findByPk(lichChieuId),
      Ghe.findByPk(gheId, { include: [LoaiGhe] }),
    ]);

    if (!lichChieu || !ghe) {
      return res.status(404).json({
        success: false,
        message: "Lịch chiếu hoặc ghế không tồn tại.",
      });
    }

    const giaVeGoc =
      parseFloat(lichChieu.giaVe) + parseFloat(ghe.LoaiGhe?.giaPhu || 0);

    let tongCombo = 0;
    for (const c of comboList) {
      if (c.soLuong <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng combo không hợp lệ.",
        });
      }
      const combo = await Combo.findByPk(c.comboId);
      if (!combo || combo.daXoa) {
        return res.status(400).json({
          success: false,
          message: `Combo không tồn tại: ${c.comboId}`,
        });
      }
      tongCombo += combo.gia * c.soLuong;
    }

    let tongTruocGiam = giaVeGoc + tongCombo;
    let tongSauGiam = tongTruocGiam;
    let giamGia = 0;
    let trangThaiMa = "none";

    if (maGiamGia) {
      const ma = await MaGiamGia.findOne({
        where: { ma: maGiamGia, nguoiDungId, daDung: false },
        include: [{ model: KhuyenMai }],
      });

      const now = new Date();
      const km = ma?.KhuyenMai;

      if (
        !ma ||
        !km ||
        !km.hoatDong ||
        now < new Date(km.ngayBatDau) ||
        now > new Date(km.ngayKetThuc)
      ) {
        return res.status(400).json({
          success: false,
          message: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
        });
      }

      let giam = 0;
      if (["ve", "all"].includes(km.loaiApDung)) {
        giam += (giaVeGoc * km.phanTramGiam) / 100;
      }
      if (["combo", "all"].includes(km.loaiApDung)) {
        giam += (tongCombo * km.phanTramGiam) / 100;
      }

      giamGia = Math.floor(giam);
      tongSauGiam = tongTruocGiam - giamGia;
      trangThaiMa = "valid";
    }

    res.json({
      success: true,
      data: {
        giaVeGoc,
        tongCombo,
        tongTruocGiam,
        giamGia,
        tongSauGiam,
        trangThaiMa,
      },
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
