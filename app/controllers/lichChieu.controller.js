const db = require("../models");
const { Op } = require("sequelize");
const errorHandler = require("../utils/errorHandler");
const LichChieu = db.LichChieu;
const Ve = db.Ve;
const Ghe = db.Ghe;
const ThongBao = db.ThongBao;
const PhongChieu = db.PhongChieu;
const ChiNhanh = db.ChiNhanh;
const NguoiDung = db.NguoiDung;
const Combo = db.Combo;
const LoaiGhe = db.LoaiGhe;
const Phim = db.Phim;
const PhuongTienMedia = db.PhuongTienMedia;
// Tạo lịch chiếu mới
exports.createShowtime = async (req, res) => {
  try {
    const { phimId, phongChieuId, batDau, ketThuc, giaVe } = req.body;
    const phim = await Phim.findByPk(phimId);
    const phong = await PhongChieu.findByPk(phongChieuId);
    if (!phim || !phong)
      return res.status(400).json({
        success: false,
        message: "Phim hoặc phòng chiếu không tồn tại.",
      });

    const conflict = await LichChieu.findOne({
      where: {
        phongChieuId,
        [Op.or]: [
          {
            batDau: { [Op.between]: [batDau, ketThuc] }, // Suất cũ bắt đầu nằm giữa suất mới
          },
          {
            ketThuc: { [Op.between]: [batDau, ketThuc] }, // Suất cũ kết thúc nằm giữa suất mới
          },
          {
            batDau: { [Op.lte]: batDau },
            ketThuc: { [Op.gte]: ketThuc }, // Suất cũ bao trùm suất mới
          },
          {
            batDau: { [Op.gte]: batDau },
            ketThuc: { [Op.lte]: ketThuc }, // Suất mới bao trùm suất cũ
          },
        ],
      },
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Thời gian lịch chiếu trùng với lịch khác.",
      });
    }

    const lichChieu = await LichChieu.create({
      phimId,
      phongChieuId,
      batDau,
      ketThuc,
      giaVe,
    });
    res.json({ success: true, data: lichChieu });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy tất cả lịch chiếu cho admin
exports.getAllShowtimesAdmin = async (req, res) => {
  try {
    const list = await LichChieu.findAll({
      include: [
        { model: PhongChieu, include: [ChiNhanh] },
        {
          model: Phim,
          include: [
            {
              model: PhuongTienMedia,
              where: { loai: "poster" },
              required: false,
            },
          ],
        },
      ],
      order: [["batDau", "ASC"]],
    });
    res.json({ success: true, data: list });
  } catch (error) {
    errorHandler(res, error);
  }
};

const { fn, col } = require("sequelize");

// Lấy tất cả lịch chiếu cho người dùng
exports.getAllShowtimesClient = async (req, res) => {
  try {
    const list = await LichChieu.findAll({
      where: {
        daXoa: false,
        batDau: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: PhongChieu,
          include: [ChiNhanh],
        },
        {
          model: Phim,
          include: [
            {
              model: PhuongTienMedia,
              required: false,
            },
          ],
        },
        {
          model: Ve,
          required: false,
          attributes: [],
          where: {
            trangThai: {
              [Op.notIn]: ["refunded", "cancelled"],
            },
          },
        },
      ],
      attributes: {
        include: [
          // thêm số vẽ đã đặt bằng COUNT
          [fn("COUNT", col("Ves.id")), "soVeDaDat"],
        ],
      },
      group: [
        "LichChieu.id",
        "PhongChieu.id",
        "PhongChieu->ChiNhanh.id",
        "Phim.id",
        "Phim->PhuongTienMedia.id",
      ],
      order: [["batDau", "ASC"]],
    });

    // Tính số ghế trống
    const resultWithSeatCount = list.map((lichChieu) => {
      const lich = lichChieu.toJSON();
      const tongSoGhe = lich.PhongChieu?.tongSoGhe || 0;
      const soVeDaDat = parseInt(lich.soVeDaDat) || 0;
      const soGheTrong = tongSoGhe - soVeDaDat;

      delete lich.Ves;
      return {
        ...lich,
        soGheTrong,
      };
    });

    res.json({ success: true, data: resultWithSeatCount });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy chi tiết lịch chiếu
exports.getShowtimeById = async (req, res) => {
  try {
    const lichChieu = await LichChieu.findByPk(req.params.id, {
      include: [
        {
          model: PhongChieu,
          include: ["ChiNhanh"],
        },
        {
          model: Phim,
        },
      ],
    });

    if (!lichChieu) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch chiếu.",
      });
    }

    const result = {
      idLichChieu: lichChieu.id,
      batDau: lichChieu.batDau,
      ketThuc: lichChieu.ketThuc,
      giaVe: lichChieu.giaVe,
      tenPhim: lichChieu.Phim?.ten || "",
      tenPhong: lichChieu.PhongChieu?.ten || "",
      tenChiNhanh: lichChieu.PhongChieu?.ChiNhanh?.ten || "",
    };

    res.json({ success: true, data: result });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Cập nhật lịch chiếu và gửi thông báo nếu có vé
exports.updateShowtime = async (req, res) => {
  try {
    const id = req.params.id;
    const { phongChieuId, batDau, ketThuc } = req.body;

    const lichChieu = await LichChieu.findByPk(id);
    if (!lichChieu)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch chiếu." });

    const now = new Date();
    const batDauCu = new Date(lichChieu.batDau);
    const diffHours = (batDauCu - now) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return res.status(400).json({
        success: false,
        message:
          "Suất chiếu sắp bắt đầu trong vòng 24 giờ. Không thể cập nhật.",
      });
    }
    const conflict = await LichChieu.findOne({
      where: {
        id: { [Op.ne]: id }, // Tránh trùng chính nó
        phongChieuId,
        [Op.or]: [
          {
            batDau: { [Op.between]: [batDau, ketThuc] },
          },
          {
            ketThuc: { [Op.between]: [batDau, ketThuc] },
          },
          {
            batDau: { [Op.lte]: batDau },
            ketThuc: { [Op.gte]: ketThuc },
          },
          {
            batDau: { [Op.gte]: batDau },
            ketThuc: { [Op.lte]: ketThuc },
          },
        ],
      },
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message:
          "Thời gian cập nhật trùng với lịch chiếu khác trong cùng phòng.",
      });
    }

    await LichChieu.update(
      { phongChieuId, batDau, ketThuc },
      { where: { id } }
    );

    const veList = await Ve.findAll({
      where: { lichChieuId: id },
      include: [NguoiDung],
    });
    for (let ve of veList) {
      await ThongBao.create({
        nguoiDungId: ve.nguoiDungId,
        tieuDe: "Lịch chiếu đã thay đổi",
        noiDung: `Lịch chiếu phim bạn đã mua vé đã được cập nhật. Vui lòng kiểm tra lại.`,
      });
    }

    res.json({
      success: true,
      message: "Cập nhật thành công và đã gửi thông báo.",
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

//Xóa lịch chiếu (ẩn mềm + xử lý vé)
exports.deleteShowtime = async (req, res) => {
  try {
    const id = req.params.id;
    const lichChieu = await LichChieu.findByPk(id);
    if (!lichChieu)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch chiếu." });

    const now = new Date();
    const diffMinutes = (new Date(lichChieu.batDau) - now) / (1000 * 60);
    if (diffMinutes < 60) {
      return res.status(400).json({
        success: false,
        message: "Chỉ được xóa lịch chiếu trước ít nhất 1 tiếng.",
      });
    }

    await LichChieu.update({ daXoa: true }, { where: { id } });

    const veList = await Ve.findAll({
      where: { lichChieuId: id },
      include: [NguoiDung],
    });
    for (let ve of veList) {
      if (ve.daThanhToan) {
        await ve.update({ trangThai: "refunded" });
        await ThongBao.create({
          nguoiDungId: ve.nguoiDungId,
          tieuDe: "Hoàn tiền vé",
          noiDung: `Lịch chiếu đã bị hủy. Vé đã được hoàn tiền.`,
        });
      } else {
        await ve.update({ trangThai: "cancelled" });
        await ThongBao.create({
          nguoiDungId: ve.nguoiDungId,
          tieuDe: "Vé bị hủy",
          noiDung: `Lịch chiếu đã bị hủy. Vé của bạn đã bị hủy.`,
        });
      }
    }

    res.json({
      success: true,
      message: "Lịch chiếu đã được ẩn và xử lý vé liên quan.",
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy danh sách ghế kèm trạng thái chính xác
exports.getSeatByShowtime = async (req, res) => {
  try {
    const { lichChieuId } = req.params;

    const lichChieu = await LichChieu.findByPk(lichChieuId);
    if (!lichChieu)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy lịch chiếu." });

    const phongChieuId = lichChieu.phongChieuId;
    const danhSachGhe = await Ghe.findAll({
      where: { phongChieuId },
      include: [LoaiGhe],
      order: [
        ["hang", "ASC"],
        ["cot", "ASC"],
      ],
    });

    const veList = await Ve.findAll({
      where: {
        lichChieuId,
        trangThai: {
          [Op.in]: ["pending", "unused"], // chỉ tính những vé còn hiệu lực
        },
      },
      attributes: ["gheId"],
    });

    const gheDaDatSet = new Set(veList.map((v) => v.gheId));

    const result = danhSachGhe.map((ghe) => ({
      id: ghe.id,
      hang: ghe.hang,
      cot: ghe.cot,
      loaiGhe: {
        ten: ghe.LoaiGhe?.ten || "Thường",
        giaPhu: ghe.LoaiGhe?.giaPhu || 0,
      },
      trangThai: gheDaDatSet.has(ghe.id) ? "daDat" : "trong",
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Tạo combo
exports.createCombo = async (req, res) => {
  try {
    const { ten, moTa, gia } = req.body;

    const filePath = req.file ? `combos/${req.file.filename}` : null;

    const combo = await Combo.create({
      ten,
      moTa,
      gia,
      duongDanAnh: filePath,
    });

    res.json({ success: true, data: combo });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Lấy tất cả combo chưa bị xoá
exports.getAllCombo = async (req, res) => {
  try {
    const combos = await Combo.findAll({
      where: { daXoa: false },
      order: [["id", "DESC"]],
    });
    res.json({ success: true, data: combos });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Xoá mềm combo
exports.deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findByPk(id);

    if (!combo) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy combo" });
    }

    await combo.update({ daXoa: true });
    res.json({ success: true, message: "Combo đã được ẩn" });
  } catch (error) {
    errorHandler(res, error);
  }
};

//lấy tên phim
exports.getNameMovies = async (req, res) => {
  try {
    const movies = await Phim.findAll({
      where: { daXoa: false },
      attributes: ["id", "ten"], // chỉ lấy id và tên phim
    });

    res.json({ success: true, data: movies });
  } catch (error) {
    errorHandler(res, error);
  }
};
// lấy chi nhánh và phòng chiếu
exports.getNameBranch = async (req, res) => {
  try {
    const danhSach = await ChiNhanh.findAll({
      where: { daXoa: false },
      attributes: ["id", "ten"],
      include: [
        {
          model: PhongChieu,
          where: { daXoa: false },
          required: false,
          attributes: ["id", "ten"],
        },
      ],
    });

    res.json({ success: true, data: danhSach });
  } catch (error) {
    errorHandler(res, error);
  }
};
