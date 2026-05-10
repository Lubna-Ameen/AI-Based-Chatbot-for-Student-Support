import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import UserModel from "./models/Users.js";
import bcrypt from 'bcrypt';

const app=express(); //cors() → يسمح للفرونت والباك يتواصلوا
express.json()       // يخلي السيرفر يقرأ بيانات JSON المرسلة من المستخدم
app.use(cors());
app.use(express.json());

app.listen(3002,()=>{
    console.log("Server Connected at port no 3002");
})
const conStr="mongodb+srv:Admin:18434734@cluster0.kn4vkqj.mongodb.net/"
mongoose.connect(conStr)
    .then(()=>{console.log("Database Connected..")})
    .catch((error)=>{console.log("Database Connection Error.."+error)});

    // http://localhost:3002/getUsers
    app.get("/getUsers",async(req,res)=>{
    try{
        const users=await UserModel.find({});
        res.send(users);
    }
    catch(error){
        res.send("Read Error.."+error)
    }
});

const mongoose = require("mongoose"); //Import Mongoose
 const UserSchema = new mongoose.Schema({  //Creates structure for user data
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["student", "admin"],
        default: "student"
    },
    studentId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;

