module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "TheLoaiPhim",
    {
      phimId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      theLoaiId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      tableName: "theLoaiPhim",
      timestamps: false,
    }
  );
};
