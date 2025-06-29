const db = require("../models");
const errorHandler = require("../utils/errorHandler");
const { Op } = require("sequelize");

const ChiNhanh = db.ChiNhanh;
const PhongChieu = db.PhongChieu;
const Ghe = db.Ghe;
const LoaiGhe = db.LoaiGhe;

// chi nhánh
exports.createBranch = async (req, res) => {
  try {
    const { ten, diaChi, soDienThoai } = req.body;
    const chiNhanh = await ChiNhanh.create({ ten, diaChi, soDienThoai });
    res.status(201).json({ success: true, data: chiNhanh });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.getAllBranch = async (req, res) => {
  try {
    const danhSach = await ChiNhanh.findAll({ where: { daXoa: false } });
    res.json({ success: true, data: danhSach });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.softDeleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const chiNhanh = await ChiNhanh.findByPk(id);
    if (!chiNhanh || chiNhanh.daXoa) {
      return res.status(404).json({ message: "Chi nhánh không tồn tại" });
    }

    await chiNhanh.update({ daXoa: true, thoiDiemXoa: new Date() });

    const phongChieus = await PhongChieu.findAll({ where: { chiNhanhId: id } });
    for (const phong of phongChieus) {
      await phong.update({ daXoa: true, thoiDiemXoa: new Date() });
    }

    res.json({
      success: true,
      message: "Đã xóa mềm chi nhánh và toàn bộ phòng chiếu liên quan",
    });
  } catch (error) {
    errorHandler(res, error);
  }
};

// Phòng chiếu
exports.createRoom = async (req, res) => {
  try {
    const { chiNhanhId, ten, tongSoGhe } = req.body;
    const chiNhanh = await ChiNhanh.findByPk(chiNhanhId);
    if (!chiNhanh || chiNhanh.daXoa) {
      return res
        .status(400)
        .json({ success: false, message: "Chi nhánh không tồn tại" });
    }
    const existing = await PhongChieu.findOne({
      where: {
        chiNhanhId,
        ten,
        daXoa: false,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Tên phòng đã tồn tại trong chi nhánh này",
      });
    }
    const phongChieu = await PhongChieu.create({ chiNhanhId, ten, tongSoGhe });

    const gheArray = [];
    const loaiGheIdMacDinh = 1; // ghế thường
    const soCot = 10;
    const soHang = Math.ceil(tongSoGhe / soCot);

    for (let i = 0; i < soHang; i++) {
      const hang = String.fromCharCode(65 + i); // A, B, C...
      for (let j = 1; j <= soCot; j++) {
        if (gheArray.length < tongSoGhe) {
          gheArray.push({
            phongChieuId: phongChieu.id,
            hang,
            cot: j,
            loaiGheId: loaiGheIdMacDinh,
          });
        }
      }
    }

    await Ghe.bulkCreate(gheArray);

    res.status(201).json({ success: true, data: phongChieu });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.getRoomsByBranch = async (req, res) => {
  try {
    const { chiNhanhId } = req.params;
    const danhSach = await PhongChieu.findAll({
      where: { chiNhanhId, daXoa: false },
    });
    res.json({ success: true, data: danhSach });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.softDeleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const phong = await PhongChieu.findByPk(id);
    if (!phong || phong.daXoa)
      return res
        .status(404)
        .json({ success: false, message: "Phòng chiếu không tồn tại" });

    await phong.update({ daXoa: true, thoiDiemXoa: new Date() });
    res.json({ success: true, message: "Đã xóa mềm phòng chiếu" });
  } catch (error) {
    errorHandler(res, error);
  }
};

//loại ghế
exports.createSeatType = async (req, res) => {
  try {
    const { ten, giaPhu } = req.body;
    const loaiGhe = await LoaiGhe.create({ ten, giaPhu });
    res.status(201).json({ success: true, data: loaiGhe });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.getAllSeatType = async (req, res) => {
  try {
    const danhSach = await LoaiGhe.findAll({
      where: {
        daXoa: false,
      },
    });
    res.json({ success: true, data: danhSach });
  } catch (error) {
    errorHandler(res, error);
  }
};
exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten, giaPhu } = req.body;
    const loaiGhe = await LoaiGhe.findByPk(id);
    if (!loaiGhe || loaiGhe.daXoa)
      return res
        .status(404)
        .json({ success: false, message: "Loại ghế không tồn tại" });

    await loaiGhe.update({ ten, giaPhu });
    res.json({ success: true, message: "Đã cập nhật loại ghế", data: loaiGhe });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.softDeleteseatType = async (req, res) => {
  try {
    const { id } = req.params;
    const loai = await LoaiGhe.findByPk(id);
    if (!loai || loai.daXoa)
      return res
        .status(404)
        .json({ success: false, message: "Loại ghế không tồn tại" });

    await loai.update({ daXoa: true, thoiDiemXoa: new Date() });
    res.json({ success: true, message: "Đã xóa mềm loại ghế" });
  } catch (error) {
    errorHandler(res, error);
  }
};

// ghế
exports.getSeatsByRoom = async (req, res) => {
  try {
    const { phongChieuId } = req.params;

    const phong = await PhongChieu.findByPk(phongChieuId);

    if (!phong || phong.daXoa) {
      return res.status(404).json({
        success: false,
        message: "Phòng chiếu không tồn tại hoặc đã bị xóa",
      });
    }

    const ghe = await Ghe.findAll({
      where: { phongChieuId },
      include: [
        {
          model: LoaiGhe,
          required: false, // để vẫn hiện ghế nếu loại ghế bị xóa mềm
        },
      ],
    });
    res.json({ success: true, data: ghe });
  } catch (error) {
    errorHandler(res, error);
  }
};

exports.updateSeatType = async (req, res) => {
  try {
    const { gheId } = req.params;
    const { loaiGheId } = req.body;

    const ghe = await Ghe.findByPk(gheId);
    if (!ghe)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ghế" });

    const loaiGhe = await LoaiGhe.findByPk(loaiGheId);
    if (!loaiGhe || loaiGhe.daXoa) {
      return res.status(400).json({
        success: false,
        message: "Loại ghế không hợp lệ hoặc đã bị xóa",
      });
    }
    await ghe.update({ loaiGheId });
    res.json({ success: true, message: "Đã cập nhật loại ghế cho ghế" });
  } catch (error) {
    errorHandler(res, error);
  }
};
