import NewsModel from "../models/news.js";
import { v2 as cloudinary } from 'cloudinary';
import multer from "multer";
import fs from "fs";
import path from "path";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'tmp/';
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
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

export const saveNews = async (req, res) => {
  try {
    const { newsId, title, content, category, author } = req.body;

    if (!newsId || !title || !content || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingNews = await NewsModel.findOne({ newsId });
    if (existingNews) {
      return res.status(409).json({ error: "News with this ID already exists" });
    }

    const newsData = {
      newsId,
      title,
      content,
      category,
      author: author || "Admin",
      publishDate: Date.now(),
    };

    // Handle image upload to Cloudinary if present
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'news_images',
          resource_type: 'image'
        });
        
        newsData.image = {
          public_id: result.public_id,
          url: result.secure_url
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
      } finally {
        // Remove temporary file
        fs.unlinkSync(req.file.path);
      }
    }

    const news = new NewsModel(newsData);
    const savedNews = await news.save();
    
    res.status(201).json(savedNews);
  } catch (error) {
    console.error("Error saving news:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "News with this ID already exists" });
    }
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getAllNews = async (req, res) => {
  try {
    const news = await NewsModel.find().sort({ publishDate: -1 });
    res.status(200).json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getNewsByNewsId = async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await NewsModel.findOne({ newsId: Number(newsId) });

    if (!news) {
      return res.status(404).json({ error: "News not found" });
    }

    res.status(200).json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const updateNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { title, content, category, author } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (author) updateData.author = author;

    // Handle image update if present
    if (req.file) {
      try {
        // First delete old image if it exists
        const existingNews = await NewsModel.findOne({ newsId: Number(newsId) });
        if (existingNews?.image?.public_id) {
          await cloudinary.uploader.destroy(existingNews.image.public_id);
        }

        // Upload new image
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'news_images',
          resource_type: 'image'
        });
        
        updateData.image = {
          public_id: result.public_id,
          url: result.secure_url
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
      } finally {
        // Remove temporary file
        fs.unlinkSync(req.file.path);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const updatedNews = await NewsModel.findOneAndUpdate(
      { newsId: Number(newsId) },
      updateData,
      { new: true }
    );

    if (!updatedNews) {
      return res.status(404).json({ error: "News not found" });
    }

    res.status(200).json(updatedNews);
  } catch (error) {
    console.error("Error updating news:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await NewsModel.findOne({ newsId: Number(newsId) });

    if (!news) {
      return res.status(404).json({ error: "News not found" });
    }

    // Delete image from Cloudinary if it exists
    if (news.image?.public_id) {
      await cloudinary.uploader.destroy(news.image.public_id);
    }

    await NewsModel.findOneAndDelete({ newsId: Number(newsId) });

    res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export const getNewsImage = async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await NewsModel.findOne({ newsId: Number(newsId) });

    if (!news || !news.image || !news.image.url) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Redirect to Cloudinary URL
    res.redirect(news.image.url);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};