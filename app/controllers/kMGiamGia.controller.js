const db = require("../models");
const errorHandler = require("../utils/errorHandler");

const KhuyenMai = db.KhuyenMai;
const MaGiamGia = db.MaGiamGia;
const NguoiDung = db.NguoiDung;
const ThongBao = db.ThongBao;

// Tạo khuyến mãi mới
exports.createPromotion = async (req, res) => {
  try {
    const { ma, moTa, phanTramGiam, loaiApDung, ngayBatDau, ngayKetThuc } =
      req.body;

    const km = await KhuyenMai.create({
      ma,
      moTa,
      phanTramGiam,
      loaiApDung,
      ngayBatDau,
      ngayKetThuc,
      hoatDong: true,
    });

    res.json({ success: true, data: km });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Cập nhật trạng thái hoatDong
exports.updatePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoatDong } = req.body;

    const km = await KhuyenMai.findByPk(id);
    if (!km) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khuyến mãi" });
    }

    await km.update({ hoatDong });
    res.json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy tất cả khuyến mãi
exports.getAllPromotions = async (req, res) => {
  try {
    const list = await KhuyenMai.findAll({ order: [["ngayBatDau", "DESC"]] });
    res.json({ success: true, data: list });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Phát hành mã cho tất cả người dùng
exports.issueCodesToAllUsers = async (req, res) => {
  try {
    const { khuyenMaiId, maPrefix } = req.body;
    const km = await KhuyenMai.findByPk(khuyenMaiId);

    if (!km) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khuyến mãi" });
    }

    if (!km.hoatDong) {
      return res.status(400).json({
        success: false,
        message: "Khuyến mãi này hiện không hoạt động",
      });
    }

    const users = await NguoiDung.findAll({ where: { vaiTro: "client" } });

    const promises = users.map(async (user) => {
      const ma = `${maPrefix}-${user.id}-${Date.now()}`;

      await MaGiamGia.create({
        nguoiDungId: user.id,
        khuyenMaiId,
        ma,
        daDung: false,
      });

      return ThongBao.create({
        nguoiDungId: user.id,
        tieuDe: "Bạn nhận được mã giảm giá",
        noiDung: `Bạn đã nhận được mã giảm giá '${ma}' từ chương trình '${km.moTa}'.`,
      });
    });

    await Promise.all(promises);

    res.json({
      success: true,
      message: "Đã phát hành mã cho tất cả người dùng.",
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Phát hành mã cho nhóm người dùng
exports.issueCodesToUserGroup = async (req, res) => {
  try {
    const { nguoiDungIds, khuyenMaiId, maPrefix } = req.body;

    const khuyenMai = await KhuyenMai.findByPk(khuyenMaiId);
    if (!khuyenMai) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi",
      });
    }

    if (!khuyenMai.hoatDong)
      return res.status(400).json({
        success: false,
        message: "Khuyến mãi này hiện không hoạt động",
      });
    const users = await NguoiDung.findAll({
      where: { id: nguoiDungIds },
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy người dùng nào",
      });
    }

    const promises = users.map(async (user) => {
      const ma = `${maPrefix}-${user.id}-${Date.now()}`;

      // Check mã trùng trước khi tạo
      const existed = await MaGiamGia.findOne({ where: { ma } });
      if (existed) return null;

      await MaGiamGia.create({
        nguoiDungId: user.id,
        khuyenMaiId,
        ma,
        daDung: false,
      });

      return ThongBao.create({
        nguoiDungId: user.id,
        tieuDe: "Bạn nhận được mã giảm giá",
        noiDung: `Bạn đã nhận được mã '${ma}' từ chương trình '${khuyenMai.moTa}'.`,
      });
    });

    await Promise.all(promises);

    res.json({
      success: true,
      message: `Đã phát hành mã cho ${users.length} người dùng.`,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy tất cả mã giảm giá của người dùng
exports.getUserDiscountCodes = async (req, res) => {
  try {
    const nguoiDungId = req.user.user_id;

    const maList = await MaGiamGia.findAll({
      where: { nguoiDungId },
      include: [KhuyenMai],
      order: [["taoLuc", "DESC"]],
    });

    res.json({ success: true, data: maList });
  } catch (error) {
    errorHandler(res, error);
  }
};
