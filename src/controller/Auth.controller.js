import User from "../models/Auth.models.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/Token.js";
//Signup Controller
export const Signup = async (req, res) => {
    try {
        let { email, password, phone, address } = req.body;
        //Validation
        if ( !email || !password || !phone || !address) {
            return res.status(400)
                .json({
                    message: "email and password and all fields are required",
                    success: false,
                })
        }
        //Validation for password
        if (password.length < 6) {
            return res.status(400)
                .json({
                    message: "Password at lest 6 Charectors",
                    success: false,
                })
        }
        //Email Normalisation
        email = email.toLowerCase();

        //Find the email in Data base
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409)
                .json({
                    message: "User Already Exist",
                    success: false,
                })
        }
        // Hash the password
        const hashPassoword = await bcrypt.hash(password, 10);

        //create a user in model
        const newUser = await User.create({
            email,
            password: hashPassoword,
            phone,
            address,
        })

        return res.status(201)
            .json({
                message: "User Create Successfully",
                success: true,
            })
    }
    catch (error) {
        console.log(error);
        return res.status(500)
            .json({
                message: "Internal Server Error",
                success: false,
            })
    }
}

//Login Controller
export const Login = async (req, res) => {
    try {
        let { email, password } = req.body;

        //Validation
        if (!email || !password) {
            return res.status(400)
                .json({
                    message: "Email and Password are required",
                    success: false,
                })
        }
        //Email Normalise
        email = email.toLowerCase();

        //Check if user exist or not
        const user = await User.findOne({ email })
            .select("+password")
        if (!user) {
            return res.status(404)
                .json({
                    message: "User is Not Found",
                    success: false,
                })
        }

        //Check the password is correct or not
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401)
                .json({
                    message: "Password is not Correct",
                    success: false,
                })
        }
        //Access Token here from utils -> Token.js
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        //Saving refresh Token to DB
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
            path: "/",
        })

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
              maxAge: 60 * 60 * 1000,  
            path: "/",
        })
        return res.status(200)
            .json({
                message: "Login Successfully",
                success: true,
            })
    }
    catch (error) {
        console.log(error);
        res.status(500)
            .json({
                message: "Internal Server Error",
                success: false,
            })
    }
}


//Refresh Controller
import jwt from "jsonwebtoken";
import User from "../models/Auth.models.js";
import { generateAccessToken, generateRefreshToken } from "../utils/Token.js";

export const refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.refresh_token;

    if (!oldRefreshToken) {
      return res.status(401).json({
        message: "Refresh token missing",
        success: false,
      });
    }

    // verify refresh token
    const decoded = jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== oldRefreshToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
        success: false,
      });
    }

    // generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // update refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    // set cookies again
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      oldAccessToken: req.cookies.access_token || null,
      oldRefreshToken,
      newAccessToken,
      newRefreshToken,
    });

  } catch (error) {
    return res.status(401).json({
      message: "Refresh token expired or invalid",
      success: false,
    });
  }
};



export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    // Remove refresh token from DB 
    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: "" } }
      );
    }

    // Clear cookies
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};