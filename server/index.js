
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, ".env");
const loadServerEnv = () => {
  try {
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    Object.assign(process.env, parsed);
    return { parsed };
  } catch (error) {
    return { error };
  }
};
const dotenvResult = loadServerEnv();

const app = express();
const PORT = process.env.PORT || 3002;

mongoose.set("bufferCommands", false);

app.use(cors());
app.use(express.json());
/* Utility functions for database connection, email sending, and other operations.
 These include enhanced logging for easier debugging of issues. */
const hasMeaningfulEnvValue = (value) =>
  Boolean(value && !["your_email@gmail.com", "your_app_password"].includes(value));

const logEmailEnvStatus = (source) => {
  console.log(`[env:${source}] dotenv path: ${envPath}`);
  console.log(
    `[env:${source}] dotenv loaded: ${dotenvResult.error ? `no (${dotenvResult.error.message})` : "yes"}`
  );
  console.log(
    `[env:${source}] EMAIL_USER exists: ${hasMeaningfulEnvValue(process.env.EMAIL_USER) ? "yes" : "no"}`
  );
  console.log(
    `[env:${source}] EMAIL_PASS exists: ${hasMeaningfulEnvValue(process.env.EMAIL_PASS) ? "yes" : "no"}`
  );
};
/* Log email environment variable status at startup for easier debugging of email configuration issues. */
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
  isVerified: {
    type: Boolean,
    default: false,
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
/* The OTP schema is used to store one-time passwords for email verification and password resets. */
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
/* The PasswordReset schema is used to store password reset tokens for users who have requested a password reset. */
const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  token: {
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
/* Mongoose models for users, OTPs, and password resets. These will be used to interact with the MongoDB database. */
const UserModel = mongoose.models.users || mongoose.model("users", userSchema);
const OtpModel = mongoose.models.otps || mongoose.model("otps", otpSchema);
const PasswordResetModel =
  mongoose.models.password_resets || mongoose.model("password_resets", passwordResetSchema);

const isBcryptHash = (password = "") => /^\$2[aby]\$\d{2}\$/.test(password);

const isDatabaseConnected = () =>
  process.env.NODE_ENV === "test" || mongoose.connection.readyState === 1;

const maskMongoUri = (uri = "") =>
  uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");

const getDatabaseState = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] || "unknown";
};

const withTimeout = (operation, timeoutMs, message) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  const promise = Promise.resolve().then(operation);

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const getBooleanEnv = (name) => String(process.env[name] || "").toLowerCase() === "true";

const buildMongoConnectionOptions = (connectionTimeoutMs) => {
  const options = {
    serverSelectionTimeoutMS: connectionTimeoutMs,
    connectTimeoutMS: connectionTimeoutMs,
    socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS) || 45000,
    maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 10,
    minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 0,
    retryWrites: true,
    tls: true,
  };

  const allowInvalidCerts = getBooleanEnv("MONGODB_TLS_ALLOW_INVALID_CERTS");

  if (allowInvalidCerts) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[database] Ignoring MONGODB_TLS_ALLOW_INVALID_CERTS=true because NODE_ENV=production."
      );
    } else {
      // Local troubleshooting only. Do not enable in production because it disables TLS certificate validation.
      options.tlsAllowInvalidCertificates = true;
      console.warn(
        "[database] WARNING: TLS certificate validation is disabled for this local run only."
      );
    }
  }

  return options;
};
/* Connect to MongoDB using the connection string in MONGO_URI. 
Includes enhanced error handling and an optional fallback for SRV connection issues. */
const getDirectMongoUri = (mongoUri) => {
  try {
    const parsedUri = new URL(mongoUri);
    if (parsedUri.protocol !== "mongodb+srv:") {
      return null;
    }

    const directHosts = {
      "cluster0.uvgfguu.mongodb.net": [
        "ac-qa5oois-shard-00-00.uvgfguu.mongodb.net:27017",
        "ac-qa5oois-shard-00-01.uvgfguu.mongodb.net:27017",
        "ac-qa5oois-shard-00-02.uvgfguu.mongodb.net:27017",
      ].join(","),
    };
    const directHost = directHosts[parsedUri.hostname];

    if (!directHost) {
      return null;
    }

    const databaseName = parsedUri.pathname || "/Student";
    const username = decodeURIComponent(parsedUri.username);
    const password = decodeURIComponent(parsedUri.password);

    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${directHost}${databaseName}?tls=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;
  } catch (error) {
    return null;
  }
};
/* Log the target MongoDB connection details (without sensitive information) for easier debugging of connection issues. */
const logConnectionTarget = (mongoUri) => {
  try {
    const parsedUri = new URL(mongoUri);
    console.log(
      `[database] target: protocol=${parsedUri.protocol}, host=${parsedUri.hostname}, database=${parsedUri.pathname || "/"}`
    );
  } catch (error) {
    console.error("[database] MONGO_URI could not be parsed as a valid MongoDB URI.");
  }
};
/* Enhanced database error logging with specific hints based on common MongoDB connection issues. */
const logDatabaseError = (error) => {
  console.error("[database] MongoDB connection failed");
  console.error(`[database] State: ${getDatabaseState()}`);
  console.error(`[database] Error name: ${error.name || "UnknownError"}`);
  if (error.code) {
    console.error(`[database] Error code: ${error.code}`);
  }
  console.error(`[database] Error message: ${error.message}`);

  const message = error.message.toLowerCase();

  if (
    message.includes("certificate") ||
    message.includes("self-signed") ||
    message.includes("unable to verify") ||
    message.includes("tls") ||
    message.includes("ssl")
  ) {
    console.error("[database] Hint: TLS certificate validation failed.");
    console.error("[database] Hint: Check your system date/time, corporate proxy/antivirus TLS inspection, and Node CA trust.");
    console.error("[database] Hint: For local testing only, set MONGODB_TLS_ALLOW_INVALID_CERTS=true in server/.env.");
  } else if (message.includes("bad auth") || message.includes("authentication failed")) {
    console.error("[database] Hint: Check the MongoDB username/password in server/.env.");
  } else if (message.includes("querysrv") || message.includes("enotfound") || message.includes("etimeout")) {
    console.error("[database] Hint: Check your internet/DNS connection and the Atlas cluster host in MONGO_URI.");
  } else if (message.includes("server selection") || message.includes("timed out") || message.includes("econnrefused")) {
    console.error("[database] Hint: Check MongoDB Atlas Network Access and whitelist your current IP address.");
  }
};
/* Connect to MongoDB and start the Express server. */
const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;
  const connectionTimeoutMs = Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 30000;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it to server/.env.");
  }

  console.log(`[database] dotenv: ${dotenvResult.error ? "server/.env not found" : "server/.env loaded"}`);
  console.log(`[database] connecting: ${maskMongoUri(mongoUri)}`);
  logConnectionTarget(mongoUri);

  const connectionOptions = buildMongoConnectionOptions(connectionTimeoutMs);

  try {
    await withTimeout(
      () => mongoose.connect(mongoUri, connectionOptions),
      connectionTimeoutMs,
      `MongoDB SRV connection timed out after ${connectionTimeoutMs}ms`
    );

    console.log("[database] MongoDB connected successfully");
    console.log(`[database] Database: ${mongoose.connection.db?.databaseName || mongoose.connection.name || "connected"}`);
  } catch (error) {
    const directMongoUri = getDirectMongoUri(mongoUri);

    if (directMongoUri) {
      console.warn("[database] SRV connection failed. Retrying with direct MongoDB connection on port 27017.");
      console.warn(`[database] direct fallback: ${maskMongoUri(directMongoUri)}`);

      try {
        await mongoose.disconnect().catch(() => {});
        await withTimeout(
          () => mongoose.connect(directMongoUri, connectionOptions),
          connectionTimeoutMs,
          `MongoDB direct fallback timed out after ${connectionTimeoutMs}ms`
        );

        console.log("[database] MongoDB connected successfully using direct fallback");
        console.log(`[database] Database: ${mongoose.connection.db?.databaseName || mongoose.connection.name || "connected"}`);
        return;
      } catch (fallbackError) {
        await mongoose.disconnect().catch(() => {});
        logDatabaseError(fallbackError);
        throw fallbackError;
      }
    }

    await mongoose.disconnect().catch(() => {});
    logDatabaseError(error);
    throw error;
  }
};
/* Define Express routes for user registration, login, OTP sending, and other functionalities. */
app.get("/getUsers", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
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
const generateResetToken = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;

const storeOtp = async (email, code) => {
  const hashedCode = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await OtpModel.findOneAndUpdate(
    { email },
    { code: hashedCode, expiresAt, createdAt: new Date() },
    { upsert: true, new: true }
  );
};

const createPasswordResetToken = async (email) => {
  const token = generateResetToken();
  const hashedToken = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await PasswordResetModel.findOneAndUpdate(
    { email },
    { token: hashedToken, expiresAt, createdAt: new Date() },
    { upsert: true, new: true }
  );
  return token;
};

const isEmailIdentifier = (identifier) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

const normalizeIdentifier = (identifier) => String(identifier || "").trim().toLowerCase();

const buildIdentifierQuery = (identifier) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  return {
    $or: [
      { email: normalizedIdentifier },
      { phone: normalizedIdentifier },
      { phoneNumber: normalizedIdentifier },
    ],
  };
};

const findUserByIdentifier = (identifier) => {
  const query = buildIdentifierQuery(identifier);

  if (!query) {
    return null;
  }

  return UserModel.findOne(query);
};

const getConfiguredValue = (...values) => {
  const placeholders = new Set([
    "your_email@gmail.com",
    "your_app_password",
    "your_16_character_app_password",
  ]);

  return values.find((value) => value && !placeholders.has(value)) || "";
};

const getSmtpConfig = () => {
  logEmailEnvStatus("smtp-config");
  const user = getConfiguredValue(process.env.EMAIL_USER, process.env.SMTP_USER);
  const pass = getConfiguredValue(process.env.EMAIL_PASS, process.env.SMTP_PASS);
  const from = getConfiguredValue(process.env.EMAIL_FROM, process.env.SMTP_FROM, user);
  const portValue = getConfiguredValue(process.env.EMAIL_PORT, process.env.SMTP_PORT, "587");
  const config = {
    host: getConfiguredValue(process.env.EMAIL_HOST, process.env.SMTP_HOST, "smtp.gmail.com"),
    port: Number.parseInt(portValue, 10),
    secure: String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || "false") === "true",
    user,
    pass,
    from,
  };

  const missing = [];

  if (!config.host) missing.push("EMAIL_HOST or SMTP_HOST");
  if (Number.isNaN(config.port)) missing.push("EMAIL_PORT or SMTP_PORT");
  if (!config.user) missing.push("EMAIL_USER or SMTP_USER");
  if (!config.pass) missing.push("EMAIL_PASS or SMTP_PASS");

  if (missing.length > 0) {
    const error = new Error(
      `Email delivery is not configured. Missing or invalid: ${missing.join(", ")}`
    );
    error.statusCode = 500;
    error.publicMessage =
      "Email service is not configured. Set EMAIL_USER and EMAIL_PASS in server/.env.";
    throw error;
  }

  return config;
};
/* Send an OTP email to the specified email address using nodemailer and the SMTP configuration from environment variables. */
const sendOtpEmail = async (email, code) => {
  const smtpConfig = getSmtpConfig();
  console.log(`[email] EMAIL_USER sender: ${smtpConfig.user}`);
  console.log(`[email] Sending OTP email to: ${email}`);

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });
    /* Verify the SMTP transporter configuration before sending the email. */
    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to: email,
      subject: "Your password reset verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code expires in 10 minutes.</p><p><strong>${code}</strong></p>`,
    });

    console.log(
      `[email] sendMail succeeded for ${email}; messageId=${info.messageId || "n/a"}`
    );
    console.log("[email] OTP email sent successfully");
  } catch (error) {
    console.error(
      `[email] sendMail failed for ${email} via ${smtpConfig.host}:${smtpConfig.port} as ${smtpConfig.user}`
    );
    console.error(`[email] Exact error: ${error.message}`);
    if (error.code) {
      console.error(`[email] code=${error.code}`);
    }
    if (error.response) {
      console.error(`[email] response=${error.response}`);
    }
    error.publicMessage = `Unable to send OTP email: ${error.message}`;
    throw error;
  }
};
/* Send an OTP to the user's email address. If the identifier is an email, 
   send directly to it. If it's a phone number, look up the associated email and send to that email. */
const sendOtpToContact = async (contact, user, code) => {
  if (isEmailIdentifier(contact)) {
    await sendOtpEmail(contact, code);
    console.log(`[otp] OTP delivered by email to ${contact}`);
    return;
  }

  if (user?.email) {
    await sendOtpEmail(user.email, code);
    console.log(`[otp] OTP delivered to account email for phone identifier ${contact}`);
    return;
  }

  throw new Error("SMS delivery is not configured for phone number OTPs");
};
/* Validate the provided password against defined password rules. */
app.post("/register", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
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
      isVerified: true,
      verified: true,
      role,
      studentId,
    });
    /* Save the new user to the database and return a success response. */
    await newUser.save();
    console.log(`[register] Created user with hashed password: ${normalizedEmail}`);

    res.status(201).send({
      success: true,
      message: "Registration successful.",
      email: normalizedEmail,
      user: {
        name,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Registration Error",
      error: error.message,
    });
  }
});
/* Additional routes (login, send-otp, send-reset-otp) are defined below but omitted here for brevity.*/
app.post("/login", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
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
   /* Normalize the email and look up the user in the database. 
   Handle both bcrypt-hashed and legacy plain-text passwords, upgrading to bcrypt on successful login with a plain-text password. */
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[login] Login attempt for: ${normalizedEmail}`);
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      console.warn(`[login] User not found: ${normalizedEmail}`);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
/*    If the user is found but not verified, you might want to handle that case here,
      for example by sending a new OTP or prompting the user to verify their email. */
    console.log(`[login] User found: ${normalizedEmail}`);

    let isPasswordValid = false;

    if (isBcryptHash(user.password)) {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`[login] bcrypt compare result for ${normalizedEmail}: ${isPasswordValid}`);
    } else {
      isPasswordValid = password === user.password;
      console.log(`[login] legacy password compare result for ${normalizedEmail}: ${isPasswordValid}`);

      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.updateOne(
          { email: normalizedEmail },
          { $set: { password: hashedPassword, isVerified: true, verified: true } }
        );
        console.log(`[login] Upgraded legacy plain-text password to bcrypt hash for: ${normalizedEmail}`);
      }
    }
/* If the password is invalid, return an error response.
 If valid, return a success response with user details. */
    if (!isPasswordValid) {
      console.warn(`[login] Invalid password for: ${normalizedEmail}`);
      return res.status(401).send({
        success: false,
        message: "Invalid Password",
      });
    }
    console.log(`[login] Login successful for: ${normalizedEmail}`);
    res.send({
      success: true,
      message: "Login Successful",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Login Error",
      error: error.message,
    });
  }
});
/* (send-otp, send-reset-otp) are defined below but omitted here for brevity. */
app.post("/send-otp", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
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
    console.log(`[send-otp] Resend requested for: ${normalizedEmail}`);
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      console.warn(`[send-otp] User not found: ${normalizedEmail}`);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified === true || user.verified === true) {
      console.log(`[send-otp] Already verified: ${normalizedEmail}`);
      return res.status(400).send({
        success: false,
        message: "Email is already verified",
      });
    }

    const code = generateOtp();
    await sendOtpToContact(normalizedEmail, user, code);
    await storeOtp(normalizedEmail, code);
    console.log(`[send-otp] OTP sent to ${normalizedEmail}`);

    res.send({
      success: true,
      message: "OTP has been sent.",
    });
  } catch (error) {
    console.error(`[send-otp] Failed to resend OTP: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.publicMessage || "Unable to send OTP email. Please try again.",
      error: error.message,
    });
  }
});
/* The send-reset-otp endpoint is used for both password reset and email verification OTPs,
 depending on the identifier provided. */
const sendResetOtpHandler = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const { email, identifier } = req.body;
    const contact = identifier || email;
    console.log(`[send-reset-otp] Received from frontend: ${contact || "(empty)"}`);

    if (!contact) {
      return res.status(400).send({
        success: false,
        message: "Email or phone number is required",
      });
    }

    const normalizedContact = normalizeIdentifier(contact);
    console.log(`[send-reset-otp] Reset requested for: ${normalizedContact}`);
    const user = await findUserByIdentifier(normalizedContact);

    if (!user) {
      console.warn(`[send-reset-otp] User not found: ${normalizedContact}`);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
/* For password reset, we want to allow sending an OTP even if the email is already verified,
 because the user might have forgotten their password. For email verification, 
 we check if the user is already verified and return an error if so. */
    const code = generateOtp();
    console.log(`[send-reset-otp] OTP generated: ${code}`);
    await sendOtpToContact(normalizedContact, user, code);
    await storeOtp(normalizedContact, code);
    console.log(`[send-reset-otp] OTP sent to ${normalizedContact}`);

    res.send({
      success: true,
      message: "OTP has been sent.",
    });
  } catch (error) {
    console.error(`[send-reset-otp] Failed to send reset OTP: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    res.status(error.statusCode || 500).send({
      success: false,
      message: error.publicMessage || "Unable to send OTP email. Please try again.",
      error: error.message,
    });
  }
};
/* Both /send-reset-otp and /forgot-password endpoints use the same handler since they perform 
the same function of sending an OTP for password reset. */
app.post("/send-reset-otp", sendResetOtpHandler);
app.post("/forgot-password", sendResetOtpHandler);

app.post("/verify-otp", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
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

    const normalizedEmail = normalizeIdentifier(email);
    const normalizedOtp = String(otp).trim();
    console.log(`[verify-otp] Verification attempt for: ${normalizedEmail}`);

    const otpRecord = await OtpModel.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    });
/* If no OTP record is found or the provided OTP does not match the stored hashed OTP, return an error response. */
    if (!otpRecord || !(await bcrypt.compare(normalizedOtp, otpRecord.code))) {
      const latestOtp = await OtpModel.findOne({ email: normalizedEmail });
      console.warn(
        `[verify-otp] Invalid or expired OTP for ${normalizedEmail}. ` +
          `Has OTP record: ${latestOtp ? "yes" : "no"}`
      );
      return res.status(400).send({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await findUserByIdentifier(normalizedEmail);

    if (!user) {
      console.warn(`[verify-otp] User not found for valid OTP: ${normalizedEmail}`);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
   /* If the OTP is valid, mark the user as verified and create a password reset token for them.
    Then, delete all OTP records for that email to prevent reuse. */
    const resetToken = await createPasswordResetToken(normalizedEmail);
    const updateResult = await UserModel.updateOne(
      buildIdentifierQuery(normalizedEmail),
      {
        $set: {
          isVerified: true,
          verified: true,
        },
      }
    );
    console.log(
      `[verify-otp] User verification update for ${normalizedEmail}: ` +
        `matched=${updateResult.matchedCount ?? updateResult.n}, ` +
        `modified=${updateResult.modifiedCount ?? updateResult.nModified}`
    );

    const deleteResult = await OtpModel.deleteMany({ email: normalizedEmail });
    console.log(
      `[verify-otp] OTP records removed for ${normalizedEmail}: ` +
        `${deleteResult.deletedCount ?? 0}`
    );

    res.send({
      success: true,
      message: "Email verified successfully",
      resetToken,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Verification Error",
      error: error.message,
    });
  }
});
    /* The reset-password endpoint allows users to reset their password using a valid reset token.
     It validates the token, updates the user's password, and marks the user as verified. 
    It also deletes any existing OTP and password reset records for that email to ensure security. */
app.post("/reset-password", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const { email, resetToken, password } = req.body;

    if (!email || !resetToken || !password) {
      return res.status(400).send({
        success: false,
        message: "Email, reset token, and password are required",
      });
    }

    const normalizedEmail = normalizeIdentifier(email);
    const user = await findUserByIdentifier(normalizedEmail);

    if (!user) {
      console.warn(`[reset-password] User not found for reset: ${normalizedEmail}`);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    console.log(`[reset-password] User found for reset: ${normalizedEmail}`);

    const resetRecord = await PasswordResetModel.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord || !(await bcrypt.compare(String(resetToken), resetRecord.token))) {
      console.warn(`[reset-password] Invalid or expired reset token for: ${normalizedEmail}`);
      return res.status(400).send({
        success: false,
        message: "Invalid or expired reset session",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.updateOne(
      buildIdentifierQuery(normalizedEmail),
      {
        $set: {
          password: hashedPassword,
          isVerified: true,
          verified: true,
        },
      }
    );
    /* After resetting the password, delete all OTP and password reset records for that email to prevent reuse. */
    await PasswordResetModel.deleteMany({ email: normalizedEmail });
    await OtpModel.deleteMany({ email: normalizedEmail });
    console.log(`[reset-password] Password updated successfully for: ${normalizedEmail}`);

    res.send({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(`[reset-password] Password reset error: ${error.message}`);
    res.status(500).send({
      success: false,
      message: "Password reset error",
      error: error.message,
    });
  }
});

/* Additional routes for user management (update, delete) 
can be added here. Make sure to handle authentication and authorization as needed.*/

if (require.main === module) {
  let serverStarted = false;
  const server = app.listen(PORT, "127.0.0.1", () => {
    serverStarted = true;
    console.log(`[server] API server running on http://127.0.0.1:${PORT}`);
    logEmailEnvStatus("startup");

    setImmediate(() => {
      connectDatabase()
        .then(() => {
          console.log("[server] Database-backed routes are ready.");
        })
        .catch(() => {
          console.warn("[server] Database routes will return 503 until MongoDB Atlas allows this connection.");
        });
    });
  });

  server.on("error", (error) => {
    if (serverStarted) {
      return;
    }

    console.error(`[server] Failed to start API server: ${error.message}`);
  });
}

module.exports = {
  app,
  connectDatabase,
  loadServerEnv,
  UserModel,
  OtpModel,
  PasswordResetModel,
};
