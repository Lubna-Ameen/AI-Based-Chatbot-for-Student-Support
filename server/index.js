
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

require('dotenv').config();

const app = express();
const PORT = 3002;
const MONGO_URI ="mongodb+srv://16s19162_db_user:Admin123@cluster0.kn4vkqj.mongodb.net/Students?retryWrites=true&w=majority";
 
mongoose.set("bufferCommands", false);

app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
  },
  studentId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserModel = mongoose.models.users || mongoose.model("users", userSchema);
const OtpModel = mongoose.models.otps || mongoose.model("otps", otpSchema);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Database Connected..");
  })
  .catch((error) => {
    console.log("Database Connection Error.." + error.message);
  });

app.get("/getUsers", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const users = await UserModel.find({}).select("-password");
    res.send(users);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Read Error",
      error: error.message,
    });
  }
});

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const createOrUpdateOtp = async (email) => {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await OtpModel.findOneAndUpdate(
    { email },
    { code, expiresAt, createdAt: new Date() },
    { upsert: true, new: true }
  );
  return code;
};

const sendOtpEmail = async (email, code) => {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PORT
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    });
  } else {
    console.log(`OTP for ${email}: ${code} (SMTP not configured)`);
  }
};

app.post("/register", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const { name, email, password, role = "student", studentId = null } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User Already Exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      studentId,
    });

    await newUser.save();

    const code = await createOrUpdateOtp(normalizedEmail);
    await sendOtpEmail(normalizedEmail, code);

    res.status(201).send({
      success: true,
      message: "Registration successful. Verification code sent to your email.",
      email: normalizedEmail,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Registration Error",
      error: error.message,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (!user.verified) {
      return res.status(403).send({
        success: false,
        message: "Email not verified. Please verify your email before logging in.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({
        success: false,
        message: "Invalid Password",
      });
    }

    res.send({
      success: true,
      message: "Login Successful",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Login Error",
      error: error.message,
    });
  }
});

app.post("/send-otp", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.verified) {
      return res.status(400).send({
        success: false,
        message: "Email is already verified",
      });
    }

    const code = await createOrUpdateOtp(normalizedEmail);
    await sendOtpEmail(normalizedEmail, code);

    res.send({
      success: true,
      message: "OTP has been resent to your email.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Failed to resend OTP",
      error: error.message,
    });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await OtpModel.findOne({
      email: normalizedEmail,
      code: otp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).send({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    user.verified = true;
    await user.save();
    await OtpModel.deleteMany({ email: normalizedEmail });

    res.send({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Verification Error",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server Connected at port no ${PORT}`);
});
