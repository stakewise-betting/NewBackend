import SliderModel from "../models/slider.js";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Configure Multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Not a valid image! Please upload only JPG or PNG images.'), false);
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'sliders' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export const saveSlider = async (req, res) => {
  try {
    const { heading, description, status } = req.body;

    if (!heading || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image is required for slider" });
    }

    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file);

    const sliderData = {
      heading,
      description,
      addedDate: Date.now(),
      image: {
        public_id: result.public_id,
        url: result.secure_url
      },
      status: status || 'active'
    };

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
    const { heading, description, status } = req.body;

    const updateData = {};
    if (heading) updateData.heading = heading;
    if (description) updateData.description = description;
    if (status) updateData.status = status;

    if (req.file) {
      // First get the existing slider to delete old image
      const existingSlider = await SliderModel.findById(id);
      if (existingSlider?.image?.public_id) {
        await cloudinary.uploader.destroy(existingSlider.image.public_id);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file);
      updateData.image = {
        public_id: result.public_id,
        url: result.secure_url
      };
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
    
    // First get the slider to delete the image from Cloudinary
    const slider = await SliderModel.findById(id);
    if (!slider) {
      return res.status(404).json({ error: "Slider not found" });
    }

    // Delete image from Cloudinary
    if (slider.image?.public_id) {
      await cloudinary.uploader.destroy(slider.image.public_id);
    }

    // Delete slider from database
    await SliderModel.findByIdAndDelete(id);

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

    if (!slider || !slider.image || !slider.image.url) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Redirect to Cloudinary URL
    res.redirect(slider.image.url);
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