module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "TheLoai",
    {
      ten: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    },
    {
      tableName: "theLoai",
      timestamps: false,
    }
  );
};
