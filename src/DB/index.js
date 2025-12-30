import mongoose from "mongoose";

const connectDB= async ()=>{
    try{
        const MONGO_URL=process.env.MONGO_URI;
        await mongoose.connect(MONGO_URL);
        console.log("🎉MONGODB Connected Successfully");
    }
    catch(error)
    {
        console.log("MONODB Connection Failed",error);
    }
}
export default connectDB;