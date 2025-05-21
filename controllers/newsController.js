import NewsModel from "../models/news.js";
import multer from "multer";
import fs from "fs";
import path from "path";

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter to accept only images
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

    // Validate required fields
    if (!newsId || !title || !content || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if news already exists
    const existingNews = await NewsModel.findOne({ newsId });
    if (existingNews) {
      return res
        .status(409)
        .json({ error: "News with this ID already exists" });
    }

    // Create new news item with default values
    const newsData = {
      newsId,
      title,
      content,
      category,
      author: author || "Admin",
      publishDate: Date.now(),
    };

    // Handle image upload if present
    if (req.file) {
      newsData.image = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
        filename: req.file.filename
      };
      
      // Remove temporary file after saving to database
      fs.unlinkSync(req.file.path);
    }

    // Create and save the news item
    const news = new NewsModel(newsData);
    const savedNews = await news.save();
    
    res.status(201).json(savedNews);
  } catch (error) {
    console.error("Error saving news:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "News with this ID already exists" });
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

    // Create update object with only provided fields
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (author) updateData.author = author;

    // Handle image update if present
    if (req.file) {
      updateData.image = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
        filename: req.file.filename
      };
      
      // Remove temporary file after saving to database
      fs.unlinkSync(req.file.path);
    }

    // Validate that at least one field is being updated
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
    const deletedNews = await NewsModel.findOneAndDelete({ newsId: Number(newsId) });

    if (!deletedNews) {
      return res.status(404).json({ error: "News not found" });
    }

    res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Add a new endpoint to get image by newsId
export const getNewsImage = async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await NewsModel.findOne({ newsId: Number(newsId) });

    if (!news || !news.image || !news.image.data) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set('Content-Type', news.image.contentType);
    res.send(news.image.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};