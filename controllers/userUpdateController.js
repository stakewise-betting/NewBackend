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
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Deleting the previous image from Cloudinary
    if (user.avatarSrc) {
      const avatarUrl = user.avatarSrc;

      const urlParts = avatarUrl.split("/");
      const publicIdWithExtension = urlParts[urlParts.length - 1].split(".")[0];
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
        resource_type: "auto",
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

export const updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.phone = phone;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Phone number updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const user
      = await userModel.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.language = language;
    await user.save(); 
    res
      .status(200)
      .json({ success: true, message: "Language updated successfully" });
  }
  catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export const updateProfile = async (req, res) => {
  const userId = req.user._id; // Get user ID from authenticated token
  const { fname, lname, username } = req.body; // Destructure expected fields

  // Validation (ensure username is provided)
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
  }

  try {
      const user = await userModel.findById(userId);
       if (!user) {
           return res.status(404).json({ success: false, message: 'User not found.' });
       }

       // Update fields directly on the fetched user object
       user.username = username.trim();
       user.fname = fname === '' ? null : (fname || user.fname); // Update if provided, allow clearing, else keep original
       user.lname = lname === '' ? null : (lname || user.lname); // Update if provided, allow clearing, else keep original

       // Add validation checks if needed (e.g., username regex, length) before saving

      const updatedUser = await user.save(); // Use save() to trigger Mongoose validation/middleware

      // Exclude sensitive fields before sending back
      const userToSend = updatedUser.toObject(); // Convert to plain object
      delete userToSend.password;
      delete userToSend.verifyOtp;
      // ... delete other sensitive fields ...

      res.status(200).json({ success: true, message: 'Profile updated successfully.', user: userToSend });

  } catch (error) {
      console.error("Error updating user profile:", error);
      if (error.code === 11000 && error.keyPattern?.username) {
          return res.status(400).json({ success: false, message: 'Username is already taken.' });
      }
       if (error.name === 'ValidationError') {
          // Handle Mongoose validation errors
          const messages = Object.values(error.errors).map((el) => el.message);
          return res.status(400).json({ success: false, message: messages.join('. ') });
      }
      res.status(500).json({ success: false, message: 'Error updating profile.', error: error.message });
  }
};
