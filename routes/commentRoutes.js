const express = require('express');
const Comment = require('../models/comment');

const router = express.Router();


router.get("/:betId", async (req, res) => {
    try {
      const comments = await Comment.find({ betId: req.params.betId });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });
  
  // Add a new comment
  router.post("/", async (req, res) => {
    try {
      const { betId, username, text } = req.body;
  
      // Check if data is missing
      if (!betId || !username || !text) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const comment = new Comment({ betId, username, text });
      await comment.save();
  
      res.status(201).json(comment); // Use status 201 for created
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

module.exports = router;