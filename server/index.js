import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import UserModel from "./models/Users.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

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

//Register API
app.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            studentId
        } = req.body;
        // Check Existing User
        const existingUser = await UserModel.findOne({
            email: email
        });
        if (existingUser) { //Prevents duplicate accounts using same email
            return res.send({
                success: false,
                message: "User Already Exists"
            });

        }
        // Encrypt Password
        const hashedPassword = await bcrypt.hash(password, 10);//Converts password into secure encrypted form
        // Create User
        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            role,
            studentId
 
        });
        await newUser.save(); //Save user to database
        res.send({
            success: true,
            message: "Registration Successful"
        });
    }
    catch (error) {
        res.send({
            success: false,
            message: "Registration Error",
            error: error.message
        });
    }

    // log(req.body);
   app.post("/login", async (req, res) => {
    const {name, email, password} = req.body;
    let user  = await UserModel.findOne({email: email});
    // if the user doesn't exist, create a new one
    if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new UserModel(
            {name, 
             email,
             password: hashedPassword,
            role: "student"
            }
        );
        await user.save();
    }
    // compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password,
         user.password);  
    if (!isPasswordValid) {
        return res.send({
            success: false,
            message: "Invalid Password"
        });
    }
    res.send({
        success: true,
        message: "Login Successful",

    });
});
        