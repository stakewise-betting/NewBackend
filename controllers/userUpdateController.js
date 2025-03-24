import userModel from "../models/userModel.js";
import cloudinary from "../config/cloudinaryConfig.js";

export const updatefname = async (req, res) => {
  try {
    const { fname } = req.body;
    const user = await userModel.findById(req.user.id); // req.user.id is set by the userAuth middleware
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.fname = fname;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "First name updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatelname = async (req, res) => {
  try {
    const { lname } = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.lname = lname;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Last name updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.username = username;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User name updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGender = async (req, res) => {
  try {
    const { gender } = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.gender = gender;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Gender updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBirthday = async (req, res) => {
  try {
    const { birthday } = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.birthday = birthday;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Birthday updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Deleting the previous image from Cloudinary
    if (user.avatarSrc) {
      const avatarUrl = user.avatarSrc;
      
      const urlParts = avatarUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `profile_pictures/${publicIdWithExtension}`;

      await cloudinary.uploader.destroy(publicId); // Delete the previous image from Cloudinary
    }

    // Upload the new image to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "profile_pictures",
        public_id: `user_${user._id}_${Date.now()}`,
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: "fill" }],
        timeout: 60000,
        resource_type: 'auto',
      }
    );

    // Save Cloudinary URL to the user's avatar field
    user.avatarSrc = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      avatarUrl: result.secure_url,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
