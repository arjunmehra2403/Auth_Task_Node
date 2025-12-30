import express from "express";
import {  Login, logout, refreshToken, Signup } from "../controller/Auth.controller.js";
import { verifyJwt } from "../middleware/Auth.middleware.js";
import User from "../models/Auth.models.js";
const router = express.Router();

router.post("/login", Login)  //Login = Controller
router.post("/signup", Signup) //Signup = Controller
router.post("/refresh", refreshToken);
router.get("/me", verifyJwt, async (req, res) => {
    const user = await User.findById(req.userId).select("-password -refreshToken");
    res.status(200).json({
        success: true,
        user,
    });
});
router.post("/logout", logout);



export default router;