// backend >> const express = require('express');
const Comment = require('../models/comment');
const express = require('express');
const router = express.Router();


// Fetch comments for a bet
router.get("/:betId", async (req, res) => {
    try {
        const comments = await Comment.find({ betId: req.params.betId }).sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching comments" });
    }
});

// Add a new comment
router.post("/", async (req, res) => {
    try {
        const { betId, username, text } = req.body;
        if (!betId || !username || !text) return res.status(400).json({ message: "All fields are required" });

        const comment = new Comment({ betId, username, text });
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Like a comment
router.post("/like/:commentId", async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        comment.likes += 1;
        await comment.save();
        res.json({ likes: comment.likes });
    } catch (error) {
        res.status(500).json({ message: "Error updating like count" });
    }
});

// Unlike a comment - new route
router.post("/unlike/:commentId", async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        comment.likes = Math.max(0, comment.likes - 1); // Ensure likes don't go below 0
        await comment.save();
        res.json({ likes: comment.likes });
    } catch (error) {
        res.status(500).json({ message: "Error updating like count" });
    }
});


// Delete a comment
router.delete("/:commentId", async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.commentId);
        res.json({ message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting comment" });
    }
});

module.exports = router;