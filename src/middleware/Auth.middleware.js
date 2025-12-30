import jwt from "jsonwebtoken";

export const verifyJwt = (req, res, next) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        message: "Access token missing",
        success: false,
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    req.userId = decoded.userId; 
    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired access token",
      success: false,
    });
  }
};
