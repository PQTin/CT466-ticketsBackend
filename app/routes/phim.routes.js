const express = require("express");
const router = express.Router();
const phimController = require("../controllers/phim.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");
const { uploadPoster } = require("../middlewares/upload");

router.post(
  "/",
  uploadPoster.array("posters"),
  verifyToken,
  isAdmin,
  phimController.createMovie
);
router.put(
  "/:id",
  uploadPoster.array("posters"),
  verifyToken,
  isAdmin,
  phimController.updateMovie
);
router.delete("/:id", verifyToken, isAdmin, phimController.softDeleteMovie);
router.get("/all-movies", phimController.getAllMovies);
router.get("/movies-by-genre/:theLoaiId", phimController.getMoviesByGenre);

router.post("/genre", verifyToken, isAdmin, phimController.createGenre);
router.put("/genre/:id", verifyToken, isAdmin, phimController.updateGenre);
router.delete("/genre/:id", verifyToken, isAdmin, phimController.deleteGenre);
router.get("/genre", phimController.getAllGenres);
module.exports = router;
