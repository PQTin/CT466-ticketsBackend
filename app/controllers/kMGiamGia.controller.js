const db = require("../models");
const { Op } = require("sequelize");
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
    const duongDanAnh = req.file ? `promotions/${req.file.filename}` : null;

    const km = await KhuyenMai.create({
      ma,
      moTa,
      phanTramGiam,
      loaiApDung,
      ngayBatDau,
      ngayKetThuc,
      duongDanAnh,
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
      where: {
        nguoiDungId,
        daDung: false,
      },
      include: [
        {
          model: KhuyenMai,
          where: {
            hoatDong: true,
            ngayKetThuc: {
              [Op.gte]: new Date(),
            },
          },
        },
      ],
      order: [["taoLuc", "DESC"]],
    });

    res.json({
      success: true,
      data: maList.map((ma) => ({
        ...ma.toJSON(),
        ngayKetThuc: ma.KhuyenMai.ngayKetThuc,
      })),
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// lấy tất cả mả giảm giá theo id khuyến mãi
exports.getAllCodesByPromotion = async (req, res) => {
  try {
    const { khuyenMaiId } = req.params;

    const khuyenMai = await KhuyenMai.findByPk(khuyenMaiId);
    if (!khuyenMai) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi",
      });
    }

    const codes = await MaGiamGia.findAll({
      where: { khuyenMaiId },
      include: [
        {
          model: NguoiDung,
          attributes: ["id", "tenDangNhap", "email"],
        },
      ],
      order: [["taoLuc", "DESC"]],
    });

    res.json({
      success: true,
      data: codes.map((code) => ({
        id: code.id,
        ma: code.ma,
        daDung: code.daDung,
        taoLuc: code.taoLuc,
        suDungLuc: code.suDungLuc,
        nguoiDung: code.NguoiDung,
      })),
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// lấy ds người dùng theo loại lọc
exports.getUsersByGroup = async (req, res) => {
  try {
    const { loai, khuyenMaiId } = req.params;

    let condition = { vaiTro: "client" };
    const now = new Date();

    if (loai === "moi") {
      // Người mới: tạo chưa quá 7 ngày
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      condition.taoLuc = { [Op.gte]: weekAgo };
    }

    const allUsers = await NguoiDung.findAll({
      where: condition,
      attributes: ["id", "tenDangNhap", "email"],
    });

    let filteredUsers = [];

    switch (loai) {
      case "chuaCoMa":
        const maList = await MaGiamGia.findAll({
          where: { khuyenMaiId },
          attributes: ["nguoiDungId"],
        });
        const usedIds = maList.map((m) => m.nguoiDungId);
        filteredUsers = allUsers.filter((u) => !usedIds.includes(u.id));
        break;

      case "chuaMua":
        const buyers = await db.Ve.findAll({
          attributes: ["nguoiDungId"],
          group: ["nguoiDungId"],
        });
        const buyerIds = buyers.map((v) => v.nguoiDungId);
        filteredUsers = allUsers.filter((u) => !buyerIds.includes(u.id));
        break;

      case "lauNam":
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredUsers = allUsers.filter(
          (u) => new Date(u.taoLuc) <= oneYearAgo
        );
        break;

      case "tatCa":
      case "moi":
        filteredUsers = allUsers;
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Loại lọc không hợp lệ" });
    }

    res.json({ success: true, data: filteredUsers });
  } catch (error) {
    errorHandler(res, error);
  }
};
