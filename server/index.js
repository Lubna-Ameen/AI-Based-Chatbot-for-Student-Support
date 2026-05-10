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