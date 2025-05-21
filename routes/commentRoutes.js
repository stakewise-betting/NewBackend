// backend >> routes/comments.js
import express from 'express';
import Comment from '../models/comment.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation

const router = express.Router();

// --- Helper function to build comment tree ---
const buildCommentTree = (comments) => {
    const commentMap = {};
    const rootComments = [];

    // First pass: Create a map and initialize replies array
    comments.forEach(comment => {
        // Check if comment is a Mongoose document or plain object
        const commentObj = comment.toObject ? comment.toObject() : { ...comment };
        commentObj.replies = [];
        commentMap[commentObj._id.toString()] = commentObj;
    });

    // Second pass: Link replies to parents
    comments.forEach(commentData => {
        const commentId = commentData._id.toString();
        const comment = commentMap[commentId]; // Get the object from map
        
        if (comment.parentId) {
            const parentIdStr = comment.parentId.toString();
            if (commentMap[parentIdStr]) {
                // Only add if parent exists (and hasn't been pruned if we were doing that)
                commentMap[parentIdStr].replies.push(comment);
                // Sort replies within parent by creation date (oldest first for reading flow)
                commentMap[parentIdStr].replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            } else {
                // Optional: Handle orphaned replies if needed, though fetching by betId should prevent this unless parent was hard-deleted.
                // If we marked parent as deleted, it will still be in the map.
                console.warn(`Orphaned comment found (or parent not fetched): ${comment._id}, parentId: ${parentIdStr}`);
                // Decide if you want to add orphans to root or ignore them
                // rootComments.push(comment); // Example: Add orphans to root
            }
        } else {
            rootComments.push(comment);
        }
    });

    // Sort root comments by creation date (newest first)
    rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return rootComments;
};


// Fetch comments for a bet (structured as a tree)
router.get("/:betId", async (req, res) => {
    try {
        // Fetch all comments for the bet, including deleted ones to maintain structure
        const allComments = await Comment.find({ betId: req.params.betId })
                                        .populate('userId', 'fname lname') // Populate user details if needed, but keep username from comment creation
                                        .sort({ createdAt: 1 }); // Sort by oldest first for easier tree building

        // Filter sensitive info from deleted comments BEFORE building the tree
        const processedComments = allComments.map(comment => {
            // Make sure we're working with a Mongoose document with proper methods
            const commentObj = comment.toObject ? comment.toObject() : { ...comment };
            
            if (commentObj.isDeleted) {
                return {
                    ...commentObj, // Keep essential fields like _id, parentId, createdAt, replies array placeholder
                    text: "[deleted]",
                    username: "User", // Or keep username, or anonymize
                    userId: null, // Remove sensitive user ref
                    likes: 0,
                    likedBy: []
                };
            }
            // Ensure username is populated correctly if needed (using the stored one is often better)
            // If userId was populated, you could construct username here, but it's already stored.
            // commentObj.username = commentObj.userId ? `${commentObj.userId.fname} ${commentObj.userId.lname}` : 'User';
            return commentObj; // Return the original comment if not deleted
        });

        const commentTree = buildCommentTree(processedComments); // Use processed comments

        res.json(commentTree);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Error fetching comments", error: error.message });
    }
});

// Add a new comment or reply
router.post("/", async (req, res) => {
    try {
        // parentId is optional (for replies)
        const { betId, userId, text, parentId } = req.body;

        if (!betId || !userId || !text) {
            return res.status(400).json({ message: "Required fields are missing (betId, userId, text)" });
        }
        if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: "Invalid parentId format" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const username = `${user.fname} ${user.lname}`;

        // Check if parent comment exists if parentId is provided
        if (parentId) {
            const parentComment = await Comment.findById(parentId);
            if (!parentComment || parentComment.isDeleted) { // Don't allow replying to deleted comments
                return res.status(404).json({ message: "Parent comment not found or has been deleted" });
            }
            if (parentComment.betId !== betId) {
                return res.status(400).json({ message: "Parent comment does not belong to the same bet" });
            }
        }

        const comment = new Comment({
            betId,
            userId,
            username,
            text,
            parentId: parentId || null // Set parentId if provided, otherwise null
        });

        await comment.save();

        // Return the newly created comment (client will add it to the tree)
        // Optionally populate user data if needed, but we have username
        res.status(201).json(comment);

    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Like a comment (No change needed for threading logic)
router.post("/like/:commentId", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid userId is required" });
        }
        const comment = await Comment.findById(req.params.commentId);
        // Allow liking/unliking even if deleted? Maybe not.
        if (!comment || comment.isDeleted) return res.status(404).json({ message: "Comment not found or deleted" });

        const userIdObj = new mongoose.Types.ObjectId(userId);

        if (!comment.likedBy.some(id => id.equals(userIdObj))) {
            comment.likedBy.push(userIdObj);
            // comment.likes = comment.likedBy.length; // More reliable
        }
        comment.likes = comment.likedBy.length; // Update likes count based on array length
        await comment.save();
        // Return the updated comment or just likes/likedBy
        res.json({ likes: comment.likes, likedBy: comment.likedBy });
    } catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).json({ message: "Error updating like count" });
    }
});

// Unlike a comment (No change needed for threading logic)
router.post("/unlike/:commentId", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid userId is required" });
        }
        const comment = await Comment.findById(req.params.commentId);
        // Allow liking/unliking even if deleted? Maybe not.
        if (!comment || comment.isDeleted) return res.status(404).json({ message: "Comment not found or deleted" });

        const userIdObj = new mongoose.Types.ObjectId(userId);

        comment.likedBy = comment.likedBy.filter(id => !id.equals(userIdObj));
        comment.likes = comment.likedBy.length; // Update likes count based on array length

        await comment.save();
        res.json({ likes: comment.likes, likedBy: comment.likedBy });
    } catch (error) {
        console.error("Error unliking comment:", error);
        res.status(500).json({ message: "Error updating like count" });
    }
});

// Delete a comment (Mark as deleted)
router.delete("/:commentId", async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userIdFromRequest = req.body.userId; // User attempting the delete

        if (!userIdFromRequest) {
            return res.status(400).json({ message: "User ID is required to delete a comment." });
        }
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid commentId format" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) { // Check if already deleted
            return res.status(404).json({ message: "Comment not found or already deleted" });
        }

        // Check ownership
        if (comment.userId.toString() !== userIdFromRequest) {
            return res.status(403).json({ message: "You are not authorized to delete this comment." });
        }

        // Mark as deleted instead of removing
        comment.isDeleted = true;
        comment.text = "[deleted]"; // Overwrite text
        // Optional: Clear potentially sensitive info if needed, though not strictly required if frontend handles 'isDeleted'
        // comment.userId = null; // Or keep for potential future restoration/moderation? Decide based on policy.
        // comment.username = "[deleted]"; // Anonymize
        // comment.likes = 0; // Reset likes?
        // comment.likedBy = [];

        await comment.save();

        // Return the modified comment object so frontend knows it's deleted
        res.json({
            message: "Comment marked as deleted",
            comment: { // Send back key info for UI update
                _id: comment._id,
                isDeleted: comment.isDeleted,
                text: comment.text,
                username: comment.username, // Or anonymized version
                parentId: comment.parentId,
                likes: comment.likes,
                likedBy: comment.likedBy
            }
        });

    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Error deleting comment", error: error.message });
    }
});

export default router;