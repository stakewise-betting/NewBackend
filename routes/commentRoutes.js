// backend >> const express = require('express');
import Comment from '../models/comment.js';
import express from 'express';
import User from '../models/userModel.js';
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
        const { betId, userId, text } = req.body; // Expect userId in request body
        if (!betId || !userId || !text) return res.status(400).json({ message: "All fields are required (betId, userId, text)" });

        const user = await User.findById(userId); // Fetch user from database using userId
        if (!user) return res.status(404).json({ message: "User not found" }); // Validate user exists
        const username = user.name; // Get username from the user object

        const comment = new Comment({ betId, userId, username, text }); // Save userId and username
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
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
        const commentId = req.params.commentId;
        const userIdFromRequest = req.body.userId; // Expect userId of the user trying to delete

        if (!userIdFromRequest) {
            return res.status(400).json({ message: "User ID is required to delete a comment." });
        }

        const comment = await Comment.findById(commentId).populate('userId'); // Populate userId to access user info
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check if the user trying to delete is the comment owner
        if (comment.userId._id.toString() !== userIdFromRequest) {
            return res.status(403).json({ message: "You are not authorized to delete this comment." }); // 403 Forbidden
        }

        await Comment.findByIdAndDelete(commentId);
        res.json({ message: "Comment deleted" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Error deleting comment", error: error.message });
    }
});

export default router;