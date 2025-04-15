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
import checkUserActive from "../middleware/checkUserActive.js";


const userUpdateRouter = express.Router();

userUpdateRouter.post("/updatefname", userAuth, checkUserActive, updatefname);
userUpdateRouter.post("/updatelname", userAuth, checkUserActive, updatelname);
userUpdateRouter.post("/updateUsername", userAuth, checkUserActive, updateUsername);
userUpdateRouter.post("/updateProfilePicture", userAuth, checkUserActive, upload.single("avatar"), updateProfilePicture);
userUpdateRouter.post("/updateBirthday", userAuth, checkUserActive, updateBirthday);
userUpdateRouter.post("/updateGender", userAuth, checkUserActive, updateGender);
userUpdateRouter.post("/updatePhone", userAuth, checkUserActive, updatePhone);
userUpdateRouter.post("/updateLanguage", userAuth, checkUserActive, updateLanguage);


export default userUpdateRouter;