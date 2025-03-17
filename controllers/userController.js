import { auth } from "google-auth-library";
import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    console.log("User ID from middleware:", req.user.id); // Debugging log

    const user = await userModel
      .findById(req.user.id)
      .select("_id fname lname username email isAccountVerified picture walletAddress authProvider phone country birthday gender avatarSrc");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database" });
    }

    return res.status(200).json({
      success: true,
      userData: {
        id: user._id,
        fname: user.fname,
        lname: user.lname,
        username: user.username,
        email: user.email,
        picture: user.picture,
        authProvider: user.authProvider,
        walletAddress: user.walletAddress,
        isAccountVerified: user.isAccountVerified,
        phone: user.phone,
        country: user.country,
        birthday: user.birthday,
        gender: user.gender,
        avatarSrc: user.avatarSrc,
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error); // Log error for debugging
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
