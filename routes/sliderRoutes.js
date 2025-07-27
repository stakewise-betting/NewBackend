import express from "express";
import {
  saveSlider,
  getAllSliders,
  getActiveSliders,
  updateSlider,
  deleteSlider,
  getSliderImage,
  upload
} from "../controllers/sliderController.js";

const router = express.Router();

router.post("/save-slider", upload.single("image"), saveSlider);
router.get("/all-sliders", getAllSliders);
router.get("/active-sliders", getActiveSliders);
router.get("/image/:id", getSliderImage);
router.put("/update-slider/:id", upload.single("image"), updateSlider);
router.delete("/delete-slider/:id", deleteSlider);

export default router;

