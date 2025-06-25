module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ComboVe",
    {
      veId: { type: DataTypes.INTEGER, allowNull: false },
      comboId: { type: DataTypes.INTEGER, allowNull: false },
      gia: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      thanhTien: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      maGiamGiaSuDung: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      soLuong: { type: DataTypes.INTEGER, defaultValue: 1 },
      daThanhToanCombo: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "comboVe",
      timestamps: false,
    }
  );
};
