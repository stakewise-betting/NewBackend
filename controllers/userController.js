import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    console.log("User ID from middleware:", req.user.id); // Debugging log

    const user = await userModel
      .findById(req.user.id)
      .select("name email isAccountVerified");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database" });
    }

    return res.status(200).json({
      success: true,
      userData: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error); // Log error for debugging
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
