module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "LichChieu",
    {
      phimId: { type: DataTypes.INTEGER, allowNull: false },
      phongChieuId: { type: DataTypes.INTEGER, allowNull: false },
      batDau: { type: DataTypes.DATE, allowNull: false },
      ketThuc: { type: DataTypes.DATE, allowNull: false },
      giaVe: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      daXoa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "lichChieu",
      timestamps: false,
      indexes: [{ unique: true, fields: ["phongChieuId", "batDau"] }],
    }
  );
};
