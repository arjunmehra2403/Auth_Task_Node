//pure express
import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/Auth.routes.js";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

const app = express();

//Middlewares
app.use(helmet());

//cokkie parser
app.use(cookieParser());

//Cors
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:4040",
    credentials: true,
}));
//Body parser
app.use(express.json({ limit: "10kb" }));

//Rate Limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // 100 requests per IP
    message: "Too many requests, please try again later"
})
app.use("/api",limiter);

//Default route
app.get("/", (req, res) => {
    res.send("API is working perfectly");
})

//Routes
app.use("/api/v1", routes);

//If Route is not found
app.use((req, res) => {
    return res.status(404)
        .json({
            message: "Route not Found",
            success: false,
        })
})

//Global Error handler
app.use((err,res)=>{
    console.error(err.stack);
    res.status(err.status || 500)
    .json({
        message:"Internal Server Error",
        success:false,
    })
})

export default app;