const db = require("../models");
const { Op, fn, col, literal, Sequelize } = require("sequelize");
const errorHandler = require("../utils/errorHandler");

const Ve = db.Ve;
const ComboVe = db.ComboVe;
const NguoiDung = db.NguoiDung;
const Phim = db.Phim;
const ChiNhanh = db.ChiNhanh;
const PhongChieu = db.PhongChieu;
const KhuyenMai = db.KhuyenMai;
const Combo = db.Combo;
const LichChieu = db.LichChieu;

exports.getDashboardStats = async (req, res) => {
  try {
    // Tổng số người dùng
    const tongNguoiDung = await NguoiDung.count();

    // Tổng số vé và số vé đã thanh toán
    const [tongVe, veThanhToan] = await Promise.all([
      Ve.count(),
      Ve.count({ where: { daThanhToan: true } }),
    ]);

    // Tổng doanh thu vé và combo
    const [doanhThuVe, doanhThuCombo] = await Promise.all([
      Ve.sum("gia", { where: { daThanhToan: true } }),
      ComboVe.sum("thanhTien", { where: { daThanhToanCombo: true } }),
    ]);

    // Tổng phim, chi nhánh, phòng chiếu, combo, khuyến mãi
    const [tongPhim, tongChiNhanh, tongPhongChieu, tongCombo, tongKhuyenMai] =
      await Promise.all([
        Phim.count({ where: { daXoa: false } }),
        ChiNhanh.count({ where: { daXoa: false } }),
        PhongChieu.count({ where: { daXoa: false } }),
        Combo.count({ where: { daXoa: false } }),
        KhuyenMai.count({ where: { hoatDong: true } }),
      ]);

    // Doanh thu theo ngày (7 ngày gần nhất)
    const doanhThuTheoNgay = await Ve.findAll({
      where: { daThanhToan: true },
      attributes: [
        [Sequelize.fn("DATE", col("muaLuc")), "ngay"],
        [Sequelize.fn("SUM", col("gia")), "doanhThuVe"],
      ],
      group: [Sequelize.fn("DATE", col("muaLuc"))],
      order: [[Sequelize.fn("DATE", col("muaLuc")), "DESC"]],
      limit: 7,
      raw: true,
    });

    // Doanh thu theo chi nhánh
    const doanhThuChiNhanh = await Ve.findAll({
      where: { daThanhToan: true },
      include: [
        {
          model: db.LichChieu,
          attributes: [],
          include: [
            {
              model: db.PhongChieu,
              attributes: [],
              include: [{ model: db.ChiNhanh, attributes: [] }],
            },
          ],
        },
      ],
      attributes: [
        [
          Sequelize.literal("`LichChieu->PhongChieu->ChiNhanh`.`ten`"),
          "chiNhanh",
        ],
        [Sequelize.fn("SUM", col("Ve.gia")), "doanhThu"],
      ],
      group: [literal("`LichChieu->PhongChieu->ChiNhanh`.`ten`")],
      raw: true,
    });

    // Top 4 phim có doanh thu cao nhất
    const topPhim = await Ve.findAll({
      where: { daThanhToan: true },
      include: [
        {
          model: db.LichChieu,
          attributes: [],
          include: [{ model: db.Phim, attributes: [] }],
        },
      ],
      attributes: [
        [literal("`LichChieu->Phim`.`ten`"), "tenPhim"],
        [Sequelize.fn("SUM", col("Ve.gia")), "doanhThu"],
      ],
      group: [literal("`LichChieu->Phim`.`ten`")],
      order: [[Sequelize.literal("doanhThu"), "DESC"]],
      limit: 4,
      raw: true,
    });

    // Tổng số vé đã thanh toán và chưa thanh toán
    const soLuongVe = await Ve.findAll({
      attributes: [
        "daThanhToan",
        [Sequelize.fn("COUNT", col("id")), "soLuong"],
      ],
      group: ["daThanhToan"],
      raw: true,
    });

    // Top combo bán chạy
    const topCombo = await ComboVe.findAll({
      where: { daThanhToanCombo: true },
      include: [{ model: Combo, attributes: [] }],
      attributes: [
        [literal("`Combo`.`ten`"), "tenCombo"],
        [fn("SUM", col("soLuong")), "soLuong"],
      ],
      group: [literal("`Combo`.`ten`")],
      order: [[literal("soLuong"), "DESC"]],
      limit: 3,
      raw: true,
    });

    res.json({
      tongNguoiDung,
      tongVe,
      veThanhToan,
      tongPhim,
      tongChiNhanh,
      tongPhongChieu,
      tongCombo,
      tongKhuyenMai,
      tongDoanhThu: (doanhThuVe || 0) + (doanhThuCombo || 0),
      doanhThuTheoNgay,
      doanhThuChiNhanh,
      topPhim,
      soLuongVe,
      topCombo,
    });
  } catch (error) {
    errorHandler(res, error);
  }
};
