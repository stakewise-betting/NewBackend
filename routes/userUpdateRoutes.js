import express from "express";
import {
  updatefname,
  updatelname,
  updateUsername,
//   updatePassword,
   updateProfilePicture,
   updateBirthday,
   updateGender,
   updatePhone,
   updateLanguage,
} from "../controllers/userUpdateController.js";
import userAuth from "../middleware/userAuth.js";
import upload from "../middleware/multerConfig.js";

const userUpdateRouter = express.Router();

userUpdateRouter.post("/updatefname",userAuth, updatefname);
userUpdateRouter.post("/updatelname",userAuth, updatelname);
userUpdateRouter.post("/updateUsername",userAuth, updateUsername);
// userUpdateRouter.post("/updatePassword", updatePassword);
userUpdateRouter.post("/updateProfilePicture", userAuth, upload.single("avatar"), updateProfilePicture);
userUpdateRouter.post("/updateBirthday",userAuth, updateBirthday);
userUpdateRouter.post("/updateGender",userAuth, updateGender);
userUpdateRouter.post("/updatePhone", userAuth, updatePhone);
userUpdateRouter.post("/updateLanguage", userAuth, updateLanguage);

export default userUpdateRouter;