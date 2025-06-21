module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ComboVe",
    {
      veId: { type: DataTypes.INTEGER, allowNull: false },
      comboId: { type: DataTypes.INTEGER, allowNull: false },
      gia: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      soLuong: { type: DataTypes.INTEGER, defaultValue: 1 },
    },
    {
      tableName: "comboVe",
      timestamps: false,
    }
  );
};
