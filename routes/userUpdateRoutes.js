import express from "express";
import {
  updatefname,
  updatelname,
  updateUsername,
//   updatePassword,
//   updateEmail,
//   updateProfilePicture,
   updateBirthday,
   updateGender,
//   updatePhone,
//   updateTimezone,
//   updateCountry,
} from "../controllers/userUpdateController.js";
import userAuth from "../middleware/userAuth.js";

const userUpdateRouter = express.Router();

userUpdateRouter.post("/updatefname",userAuth, updatefname);
userUpdateRouter.post("/updatelname",userAuth, updatelname);
userUpdateRouter.post("/updateUsername",userAuth, updateUsername);
// userUpdateRouter.post("/updateEmail", updateEmail);
// userUpdateRouter.post("/updatePassword", updatePassword);
// userUpdateRouter.post("/updateProfilePicture", updateProfilePicture);
userUpdateRouter.post("/updateBirthday",userAuth, updateBirthday);
userUpdateRouter.post("/updateGender",userAuth, updateGender);
// userUpdateRouter.post("/updatePhone", updatePhone);
// userUpdateRouter.post("/updateTimezone", updateTimezone);
// userUpdateRouter.post("/updateCountry", updateCountry);

export default userUpdateRouter;