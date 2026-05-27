import mongoose from "mongoose";

const mongourl=process.env.MONGO_DB_URL;

mongoose.connect(mongourl)
.then(()=>console.log(" mongo db connection sucessfull"))
.catch((err)=>console.log(err));
