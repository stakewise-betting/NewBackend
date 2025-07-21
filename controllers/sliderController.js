import SliderModel from "../models/slider.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/sliders/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Not a valid image! Please upload only JPG or PNG images.'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: fileFilter
});

export const saveSlider = async (req, res) => {
  try {
    const { heading, description, status  } = req.body;

    if (!heading || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image is required for slider" });
    }

    // Create new slider item
    const sliderData = {
      heading,
      description,
      addedDate: Date.now(),
      image: {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
        filename: req.file.filename
      },
      status: status  
    };
    
    // Remove temporary file
    fs.unlinkSync(req.file.path);

    const slider = new SliderModel(sliderData);
    const savedSlider = await slider.save();
    
    res.status(201).json(savedSlider);
  } catch (error) {
    console.error("Error saving slider:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getAllSliders = async (req, res) => {
  try {
    const sliders = await SliderModel.find().sort({ addedDate: -1 });
    res.status(200).json(sliders);
  } catch (error) {
    console.error("Error fetching sliders:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const updateSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, description,status  } = req.body;

    const updateData = {};
    if (heading) updateData.heading = heading;
    if (description) updateData.description = description;
    if (status) updateData.status = status;

    if (req.file) {
      updateData.image = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
        filename: req.file.filename
      };
      fs.unlinkSync(req.file.path);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const updatedSlider = await SliderModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedSlider) {
      return res.status(404).json({ error: "Slider not found" });
    }

    res.status(200).json(updatedSlider);
  } catch (error) {
    console.error("Error updating slider:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSlider = await SliderModel.findByIdAndDelete(id);

    if (!deletedSlider) {
      return res.status(404).json({ error: "Slider not found" });
    }

    res.status(200).json({ message: "Slider deleted successfully" });
  } catch (error) {
    console.error("Error deleting slider:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getSliderImage = async (req, res) => {
  try {
    const { id } = req.params;
    const slider = await SliderModel.findById(id);

    if (!slider || !slider.image || !slider.image.data) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set('Content-Type', slider.image.contentType);
    res.send(slider.image.data);
  } catch (error) {
    console.error("Error fetching slider image:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getActiveSliders = async (req, res) => {
  try {
    const sliders = await SliderModel.find({ status: { $ne: 'inactive' } })
                                   .sort({ addedDate: -1 })
                                   .limit(5);
    res.status(200).json(sliders);
  } catch (error) {
    console.error("Error fetching active sliders:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};