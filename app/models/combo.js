module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Combo",
    {
      ten: { type: DataTypes.STRING(255), allowNull: false },
      moTa: { type: DataTypes.TEXT },
      gia: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      tableName: "combo",
      timestamps: false,
    }
  );
};
