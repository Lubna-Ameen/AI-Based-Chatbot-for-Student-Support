
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const crypto = require("crypto");

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

const allowedClientOrigins = new Set(
  (process.env.CLIENT_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedClientOrigins.has(origin)),
  credentials: true,
}));
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
  phoneNumber: { type: String, default: "", trim: true },
  program: { type: String, default: "", trim: true },
  academicYear: { type: String, default: "", trim: true },
  department: { type: String, default: "", trim: true },
  gpa: { type: Number, min: 0, default: null },
  riskStatus: { type: String, default: "", trim: true },
  aiPrediction: { type: String, default: "", trim: true },
  alerts: { type: [String], default: [] },
  recommendations: { type: [String], default: [] },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const studentDepartments = [
  "Business Studies",
  "Engineering",
  "Information Technology (IT)",
  "Applied Sciences",
  "Pharmacy",
  "Fashion Design",
];
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
const adminAccountSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, default: "", trim: true, maxlength: 100 },
  title: { type: String, default: "", trim: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const adminSessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  csrfHash: { type: String, required: true },
  adminEmail: { type: String, required: true, lowercase: true, trim: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now },
});
const adminOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
const adminPasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
const academicCourseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, trim: true, maxlength: 30 },
  courseName: { type: String, required: true, trim: true, maxlength: 160 },
  creditHours: { type: Number, required: true, min: 0.1, max: 100 },
  grade: { type: String, default: "", trim: true, maxlength: 20 },
  attendancePercentage: { type: Number, default: null, min: 0, max: 100 },
  status: { type: String, enum: ["registered", "completed", "failed"], required: true },
});
const academicSemesterSchema = new mongoose.Schema({
  semester: { type: String, required: true, trim: true, maxlength: 80 },
  semesterGPA: { type: Number, min: 0, default: null },
  cgpa: { type: Number, min: 0, default: null },
  lcgpa: { type: Number, min: 0, default: null },
  courses: { type: [academicCourseSchema], default: [] },
});
const studyPlanCourseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, trim: true, maxlength: 30 },
  courseName: { type: String, required: true, trim: true, maxlength: 160 },
  creditHours: { type: Number, required: true, min: 0.1, max: 100 },
});
const academicWarningSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, maxlength: 40 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  issuedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "resolved"], default: "active" },
});
const academicRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, unique: true },
  academicLevel: { type: String, default: "", trim: true, maxlength: 80 },
  verified: { type: Boolean, default: false },
  semesters: { type: [academicSemesterSchema], default: [] },
  studyPlan: { type: [studyPlanCourseSchema], default: [] },
  studyPlanVerified: { type: Boolean, default: false },
  academicWarnings: { type: [academicWarningSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});
const academicAuditSchema = new mongoose.Schema({
  adminEmail: { type: String, required: true, lowercase: true, trim: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  changedFields: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now },
});
/* Mongoose models for users, OTPs, and password resets. These will be used to interact with the MongoDB database. */
const UserModel = mongoose.models.users || mongoose.model("users", userSchema);
const OtpModel = mongoose.models.otps || mongoose.model("otps", otpSchema);
const PasswordResetModel =
  mongoose.models.password_resets || mongoose.model("password_resets", passwordResetSchema);
const AdminAccountModel =
  mongoose.models.admin_accounts || mongoose.model("admin_accounts", adminAccountSchema);
const AdminSessionModel =
  mongoose.models.admin_sessions || mongoose.model("admin_sessions", adminSessionSchema);
const AdminOtpModel = mongoose.models.admin_otps || mongoose.model("admin_otps", adminOtpSchema);
const AdminPasswordResetModel =
  mongoose.models.admin_password_resets ||
  mongoose.model("admin_password_resets", adminPasswordResetSchema);
const AcademicRecordModel =
  mongoose.models.academic_records || mongoose.model("academic_records", academicRecordSchema);
const AcademicAuditModel =
  mongoose.models.academic_audits || mongoose.model("academic_audits", academicAuditSchema);

const ADMIN_IDENTITIES = [
  { email: "admin@studentsupport.ai", passwordHashEnv: "ADMIN_1_PASSWORD_HASH" },
  { email: "support.admin@studentsupport.ai", passwordHashEnv: "ADMIN_2_PASSWORD_HASH" },
];
const ADMIN_SESSION_COOKIE = "student_support_admin_session";
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ADMIN_TOKEN_BYTES = 32;
const getAdminIdentity = (email) =>
  ADMIN_IDENTITIES.find((identity) => identity.email === normalizeIdentifier(email));
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const safeTokenEquals = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};
const getAdminPasswordHash = (identity) => {
  const passwordHash = process.env[identity.passwordHashEnv] || "";
  return isBcryptHash(passwordHash) ? passwordHash : "";
};
const adminRequestLimits = new Map();
const createRateLimiter = (keyPrefix, limit, windowMs) => (req, res, next) => {
  const now = Date.now();
  const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || "unknown"}`;
  const current = adminRequestLimits.get(key);
  if (!current || current.resetAt <= now) {
    adminRequestLimits.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (current.count >= limit) {
    res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).send({ success: false, message: "Too many attempts. Please try again later." });
  }
  current.count += 1;
  return next();
};
const adminLoginLimiter = createRateLimiter("admin-login", 5, 15 * 60 * 1000);
const adminResetLimiter = createRateLimiter("admin-reset", 3, 15 * 60 * 1000);
const adminVerifyLimiter = createRateLimiter("admin-reset-verify", 8, 15 * 60 * 1000);

const ensureAdminAccount = async (identity) => {
  let account = await AdminAccountModel.findOne({ email: identity.email });
  if (account) return account;
  const configuredHash = getAdminPasswordHash(identity);
  if (!configuredHash) return null;
  account = await AdminAccountModel.findOneAndUpdate(
    { email: identity.email },
    {
      $setOnInsert: {
        email: identity.email,
        passwordHash: configuredHash,
        displayName: "",
        title: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return account;
};

const getRequestCookie = (req, name) => {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
};

const adminAuthMiddleware = async (req, res, next) => {
  const publicAuthPaths = new Set([
    "/auth/login",
    "/auth/forgot-password",
    "/auth/verify-reset-otp",
    "/auth/reset-password",
  ]);
  if (publicAuthPaths.has(req.path)) return next();
  if (!isDatabaseConnected()) {
    return res.status(503).send({ success: false, message: "Database not connected" });
  }

  try {
    const token = getRequestCookie(req, ADMIN_SESSION_COOKIE);
    if (!token) return res.status(401).send({ success: false, message: "Admin authentication required" });
    const session = await AdminSessionModel.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session) return res.status(401).send({ success: false, message: "Admin session expired" });
    req.admin = { email: session.adminEmail, session };

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const csrfToken = req.get("x-csrf-token") || "";
      if (!csrfToken || !safeTokenEquals(hashToken(csrfToken), session.csrfHash)) {
        return res.status(403).send({ success: false, message: "CSRF validation failed" });
      }
    }
    return next();
  } catch (error) {
    console.error(`[admin-auth] Session validation failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to validate Admin session" });
  }
};

app.use("/admin", adminAuthMiddleware);

const isBcryptHash = (password = "") => /^\$2[aby]\$\d{2}\$/.test(password);

let activeDatabaseConnection = null;

const isDatabaseConnected = () => {
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  const connection = activeDatabaseConnection || mongoose.connection;

  if (!connection) {
    return false;
  }

  const readyState = connection.readyState;
  const hasDatabase = Boolean(connection.db && connection.db.databaseName);

  return readyState === 1 || hasDatabase;
};

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

    activeDatabaseConnection = mongoose.connection;
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

        activeDatabaseConnection = mongoose.connection;
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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildIdentifierQuery = (identifier) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  const email = isEmailIdentifier(normalizedIdentifier)
    ? { $regex: `^${escapeRegex(normalizedIdentifier)}$`, $options: "i" }
    : normalizedIdentifier;

  return {
    $or: [
      { email },
      { phone: normalizedIdentifier },
      { phoneNumber: normalizedIdentifier },
    ],
  };
};

const findStudentByIdentifier = (identifier) => {
  const query = buildIdentifierQuery(identifier);

  if (!query) {
    return null;
  }

  return UserModel.findOne({
    $and: [{ role: { $ne: "admin" } }, query],
  });
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
  console.log("[email] Sending OTP email.");

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
    await transporter.sendMail({
      from: smtpConfig.from,
      to: email,
      subject: "Your password reset verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code expires in 10 minutes.</p><p><strong>${code}</strong></p>`,
    });

    console.log("[email] OTP email sent successfully");
  } catch (error) {
    console.error(`[email] OTP delivery failed (${error.name || "Error"}).`);
    error.publicMessage = `Unable to send OTP email: ${error.message}`;
    throw error;
  }
};
/* Send an OTP to the user's email address. If the identifier is an email, 
   send directly to it. If it's a phone number, look up the associated email and send to that email. */
const sendOtpToContact = async (contact, user, code) => {
  if (isEmailIdentifier(contact)) {
    await sendOtpEmail(contact, code);
    return;
  }

  if (user?.email) {
    await sendOtpEmail(user.email, code);
    return;
  }

  throw new Error("SMS delivery is not configured for phone number OTPs");
};
const adminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: ADMIN_SESSION_TTL_MS,
});

const issueAdminSession = async (res, email) => {
  const token = crypto.randomBytes(ADMIN_TOKEN_BYTES).toString("base64url");
  const csrfToken = crypto.randomBytes(ADMIN_TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
  await AdminSessionModel.create({
    tokenHash: hashToken(token),
    csrfHash: hashToken(csrfToken),
    adminEmail: email,
    expiresAt,
  });
  res.cookie(ADMIN_SESSION_COOKIE, token, adminCookieOptions());
  return csrfToken;
};

const adminPasswordIsValid = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

app.post("/admin/auth/login", adminLoginLimiter, async (req, res) => {
  try {
    if (!isDatabaseConnected()) return res.status(503).send({ success: false, message: "Database not connected" });
    const email = normalizeIdentifier(req.body.email);
    const { password } = req.body;
    const identity = getAdminIdentity(email);
    if (!identity || typeof password !== "string") {
      return res.status(401).send({ success: false, message: "Invalid Admin email or password" });
    }
    const account = await ensureAdminAccount(identity);
    if (!account) {
      return res.status(503).send({
        success: false,
        message: "Admin credentials are not configured on the server",
      });
    }
    if (!(await bcrypt.compare(password, account.passwordHash))) {
      return res.status(401).send({ success: false, message: "Invalid Admin email or password" });
    }
    const csrfToken = await issueAdminSession(res, email);
    return res.send({
      success: true,
      admin: { email, displayName: account.displayName || "", title: account.title || "" },
      csrfToken,
    });
  } catch (error) {
    console.error(`[admin-auth] Login failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to sign in to Admin Portal" });
  }
});

app.post("/admin/auth/forgot-password", adminResetLimiter, async (req, res) => {
  try {
    if (!isDatabaseConnected()) return res.status(503).send({ success: false, message: "Database not connected" });
    const identity = getAdminIdentity(req.body.email);
    const account = identity ? await ensureAdminAccount(identity) : null;
    if (account) {
      const code = crypto.randomInt(100000, 1000000).toString();
      await sendOtpEmail(identity.email, code);
      await AdminOtpModel.findOneAndUpdate(
        { email: identity.email },
        {
          codeHash: await bcrypt.hash(code, 10),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        { upsert: true, new: true }
      );
    }
    return res.send({ success: true, message: "If the account is eligible, a verification code has been sent." });
  } catch (error) {
    console.error(`[admin-auth] Password recovery request failed (${error.name || "Error"}).`);
    return res.status(error.statusCode || 500).send({
      success: false,
      message: error.publicMessage || "Unable to process password recovery",
    });
  }
});

app.post("/admin/auth/verify-reset-otp", adminVerifyLimiter, async (req, res) => {
  try {
    const identity = getAdminIdentity(req.body.email);
    const code = String(req.body.code || "").trim();
    if (!identity || !/^\d{6}$/.test(code)) {
      return res.status(400).send({ success: false, message: "Invalid or expired verification code" });
    }
    const otp = await AdminOtpModel.findOne({
      email: identity.email,
      expiresAt: { $gt: new Date() },
    });
    if (!otp || !(await bcrypt.compare(code, otp.codeHash))) {
      return res.status(400).send({ success: false, message: "Invalid or expired verification code" });
    }
    const resetToken = crypto.randomBytes(ADMIN_TOKEN_BYTES).toString("base64url");
    await AdminPasswordResetModel.findOneAndUpdate(
      { email: identity.email },
      {
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      { upsert: true, new: true }
    );
    await AdminOtpModel.deleteMany({ email: identity.email });
    return res.send({ success: true, resetToken });
  } catch (error) {
    console.error(`[admin-auth] Verification failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to verify reset code" });
  }
});

app.post("/admin/auth/reset-password", adminResetLimiter, async (req, res) => {
  try {
    const identity = getAdminIdentity(req.body.email);
    const { resetToken, password } = req.body;
    if (!identity || !resetToken || !adminPasswordIsValid(password)) {
      return res.status(400).send({ success: false, message: "Invalid reset request or password" });
    }
    const reset = await AdminPasswordResetModel.findOne({
      email: identity.email,
      tokenHash: hashToken(String(resetToken)),
      expiresAt: { $gt: new Date() },
    });
    if (!reset) return res.status(400).send({ success: false, message: "Invalid or expired reset session" });
    const passwordHash = await bcrypt.hash(password, 12);
    await AdminAccountModel.updateOne(
      { email: identity.email },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
    await Promise.all([
      AdminPasswordResetModel.deleteMany({ email: identity.email }),
      AdminOtpModel.deleteMany({ email: identity.email }),
      AdminSessionModel.deleteMany({ adminEmail: identity.email }),
    ]);
    res.clearCookie(ADMIN_SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.send({ success: true, message: "Admin password updated successfully" });
  } catch (error) {
    console.error(`[admin-auth] Password reset failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to reset Admin password" });
  }
});

app.get("/admin/auth/csrf", async (req, res) => {
  try {
    const csrfToken = crypto.randomBytes(ADMIN_TOKEN_BYTES).toString("base64url");
    req.admin.session.csrfHash = hashToken(csrfToken);
    await req.admin.session.save();
    return res.send({ success: true, csrfToken });
  } catch (error) {
    console.error(`[admin-auth] CSRF token refresh failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to refresh Admin security token" });
  }
});

app.get("/admin/auth/me", async (req, res) => {
  try {
    const account = await AdminAccountModel.findOne({ email: req.admin.email })
      .select("email displayName title");
    if (!account) return res.status(401).send({ success: false, message: "Admin account not found" });
    return res.send({ success: true, admin: account });
  } catch (error) {
    console.error(`[admin-auth] Profile lookup failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to load Admin profile" });
  }
});

app.put("/admin/profile", async (req, res) => {
  try {
    const displayName = String(req.body.displayName || "").trim();
    const title = String(req.body.title || "").trim();
    if (displayName.length > 100 || title.length > 100) {
      return res.status(400).send({ success: false, message: "Profile fields must be 100 characters or fewer" });
    }
    const account = await AdminAccountModel.findOneAndUpdate(
      { email: req.admin.email },
      { $set: { displayName, title, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).select("email displayName title");
    return res.send({ success: true, admin: account });
  } catch (error) {
    console.error(`[admin-auth] Profile update failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to update Admin profile" });
  }
});

app.post("/admin/auth/logout", async (req, res) => {
  try {
    await AdminSessionModel.deleteOne({ tokenHash: req.admin.session.tokenHash });
    res.clearCookie(ADMIN_SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.send({ success: true, message: "Logged out" });
  } catch (error) {
    console.error(`[admin-auth] Logout failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to log out" });
  }
});

app.post("/admin/auth/change-password", async (req, res) => {
  try {
    const account = await AdminAccountModel.findOne({ email: req.admin.email });
    if (!account || !(await bcrypt.compare(String(req.body.currentPassword || ""), account.passwordHash))) {
      return res.status(401).send({ success: false, message: "Current password is incorrect" });
    }
    if (!adminPasswordIsValid(req.body.password)) {
      return res.status(400).send({ success: false, message: "New password does not meet the required password rules" });
    }
    await AdminAccountModel.updateOne(
      { email: req.admin.email },
      { $set: { passwordHash: await bcrypt.hash(req.body.password, 12), updatedAt: new Date() } }
    );
    await AdminSessionModel.deleteMany({ adminEmail: req.admin.email });
    res.clearCookie(ADMIN_SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.send({ success: true, message: "Password changed. Please sign in again." });
  } catch (error) {
    console.error(`[admin-auth] Password change failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to change Admin password" });
  }
});

/* Validate the provided password against defined password rules. */
app.post("/register", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).send({
        success: false,
        message: "Database not connected",
      });
    }

    const { name, email, password, studentId = null, phoneNumber = "", program = "", academicYear = "", department = "" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!String(department).trim()) {
      return res.status(400).send({
        success: false,
        message: "Department is required",
      });
    }

    if (!studentDepartments.includes(String(department).trim())) {
      return res.status(400).send({
        success: false,
        message: "Invalid department selected",
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
      role: "student",
      studentId,
      phoneNumber,
      program,
      academicYear,
      department,
    });
    /* Save the new user to the database and return a success response. */
    await newUser.save();
    console.log("[register] Student account created.");

    res.status(201).send({
      success: true,
      message: "Registration successful.",
      email: normalizedEmail,
      user: {
        _id: newUser._id,
        name,
        email: normalizedEmail,
        studentId: newUser.studentId,
        phoneNumber: newUser.phoneNumber,
        program: newUser.program,
        academicYear: newUser.academicYear,
        department: newUser.department,
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
    console.log("[login] Student login attempt.");
    const user = await findStudentByIdentifier(normalizedEmail);

    if (!user) {
      console.warn("[login] Student account not found.");
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
/*    If the user is found but not verified, you might want to handle that case here,
      for example by sending a new OTP or prompting the user to verify their email. */
    let isPasswordValid = false;

    if (isBcryptHash(user.password)) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.password;

      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword, isVerified: true, verified: true } }
        );
        console.log("[login] Legacy student password upgraded.");
      }
    }
/* If the password is invalid, return an error response.
 If valid, return a success response with user details. */
    if (!isPasswordValid) {
      console.warn("[login] Invalid student password.");
      return res.status(401).send({
        success: false,
        message: "Invalid Password",
      });
    }
    console.log("[login] Student login successful.");
    res.send({
      success: true,
      message: "Login Successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        phoneNumber: user.phoneNumber,
        program: user.program,
        academicYear: user.academicYear,
        department: user.department,
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
    const user = await findStudentByIdentifier(normalizedEmail);

    if (!user) {
      console.warn("[send-otp] Student account not found.");
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified === true || user.verified === true) {
      console.log("[send-otp] Student account is already verified.");
      return res.status(400).send({
        success: false,
        message: "Email is already verified",
      });
    }

    const code = generateOtp();
    await sendOtpToContact(normalizedEmail, user, code);
    await storeOtp(normalizedEmail, code);
    console.log("[send-otp] Verification code sent.");

    res.send({
      success: true,
      message: "OTP has been sent.",
    });
  } catch (error) {
    console.error(`[send-otp] Failed to resend verification code (${error.name || "Error"}).`);
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
    if (!contact) {
      return res.status(400).send({
        success: false,
        message: "Email or phone number is required",
      });
    }

    const normalizedContact = normalizeIdentifier(contact);
    const user = await findStudentByIdentifier(normalizedContact);

    if (!user) {
      console.warn("[send-reset-otp] Student account not found.");
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
/* For password reset, we want to allow sending an OTP even if the email is already verified,
 because the user might have forgotten their password. For email verification, 
 we check if the user is already verified and return an error if so. */
    const code = generateOtp();
    await sendOtpToContact(normalizedContact, user, code);
    await storeOtp(normalizedContact, code);
    console.log("[send-reset-otp] Password-reset code sent.");

    res.send({
      success: true,
      message: "OTP has been sent.",
    });
  } catch (error) {
    console.error(`[send-reset-otp] Failed to send reset code (${error.name || "Error"}).`);
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
    const otpRecord = await OtpModel.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    });
/* If no OTP record is found or the provided OTP does not match the stored hashed OTP, return an error response. */
    if (!otpRecord || !(await bcrypt.compare(normalizedOtp, otpRecord.code))) {
      console.warn("[verify-otp] Invalid or expired verification code.");
      return res.status(400).send({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await findStudentByIdentifier(normalizedEmail);

    if (!user) {
      console.warn("[verify-otp] Student account not found for valid code.");
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
   /* If the OTP is valid, mark the user as verified and create a password reset token for them.
    Then, delete all OTP records for that email to prevent reuse. */
    const resetToken = await createPasswordResetToken(normalizedEmail);
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          verified: true,
        },
      }
    );
    const deleteResult = await OtpModel.deleteMany({ email: normalizedEmail });
    console.log(`[verify-otp] Verification code records removed: ${deleteResult.deletedCount ?? 0}`);

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
    const user = await findStudentByIdentifier(normalizedEmail);

    if (!user) {
      console.warn("[reset-password] Student account not found.");
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    const resetRecord = await PasswordResetModel.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord || !(await bcrypt.compare(String(resetToken), resetRecord.token))) {
      console.warn("[reset-password] Invalid or expired reset session.");
      return res.status(400).send({
        success: false,
        message: "Invalid or expired reset session",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.updateOne(
      { _id: user._id },
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
    console.log("[reset-password] Student password updated.");

    res.send({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(`[reset-password] Password reset error (${error.name || "Error"}).`);
    res.status(500).send({
      success: false,
      message: "Password reset error",
      error: error.message,
    });
  }
});

const calculateAcademicMetrics = (record) => {
  if (!record?.verified) return { available: false };
  const latestCourses = new Map();
  for (const semester of record.semesters || []) {
    for (const course of semester.courses || []) {
      latestCourses.set(String(course.courseCode).toUpperCase(), course);
    }
  }
  const courses = [...latestCourses.values()];
  const completedCourses = courses.filter((course) => course.status === "completed");
  const studyPlan = record.studyPlanVerified ? record.studyPlan || [] : [];
  const completedCodes = new Set(
    completedCourses.map((course) => String(course.courseCode).toUpperCase())
  );
  const attendanceValues = courses
    .map((course) => course.attendancePercentage)
    .filter((value) => Number.isFinite(value));
  const plannedCredits = studyPlan.reduce((total, course) => total + course.creditHours, 0);
  const completedCreditHours = completedCourses.reduce(
    (total, course) => total + course.creditHours,
    0
  );

  return {
    available: true,
    completedCourses: completedCourses.length,
    failedCourses: courses.filter((course) => course.status === "failed").length,
    registeredCourses: courses.filter((course) => course.status === "registered").length,
    completedCreditHours,
    remainingCourses: record.studyPlanVerified
      ? studyPlan.filter((course) => !completedCodes.has(String(course.courseCode).toUpperCase()))
      : null,
    academicProgressPercentage:
      record.studyPlanVerified && plannedCredits > 0
        ? Math.min(100, Math.round((completedCreditHours / plannedCredits) * 10000) / 100)
        : null,
    averageAttendancePercentage: attendanceValues.length
      ? Math.round((attendanceValues.reduce((total, value) => total + value, 0) / attendanceValues.length) * 100) / 100
      : null,
  };
};

const isValidAcademicRecordPayload = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
    return false;
  }
  const fields = [
    "academicLevel",
    "verified",
    "semesters",
    "studyPlan",
    "studyPlanVerified",
    "academicWarnings",
  ];
  if (Object.keys(body).some((key) => !fields.includes(key))) return false;
  if (body.academicLevel !== undefined && typeof body.academicLevel !== "string") return false;
  if (body.verified !== undefined && typeof body.verified !== "boolean") return false;
  if (body.studyPlanVerified !== undefined && typeof body.studyPlanVerified !== "boolean") return false;
  if (body.semesters !== undefined && !Array.isArray(body.semesters)) return false;
  if (body.studyPlan !== undefined && !Array.isArray(body.studyPlan)) return false;
  if (body.academicWarnings !== undefined && !Array.isArray(body.academicWarnings)) return false;

  const courseCodes = (courses) =>
    courses.map((course) => String(course.courseCode || "").trim().toUpperCase());
  if (body.studyPlan && new Set(courseCodes(body.studyPlan)).size !== body.studyPlan.length) return false;
  if (body.semesters) {
    for (const semester of body.semesters) {
      if (!semester || typeof semester !== "object" || typeof semester.semester !== "string") return false;
      if (!Array.isArray(semester.courses)) return false;
      for (const gpa of [semester.semesterGPA, semester.cgpa, semester.lcgpa]) {
        if (gpa !== undefined && gpa !== null && (!Number.isFinite(gpa) || gpa < 0)) return false;
      }
      if (new Set(courseCodes(semester.courses)).size !== semester.courses.length) return false;
    }
  }
  if (body.studyPlan && body.studyPlan.some((course) =>
    !course || typeof course !== "object" ||
    !String(course.courseCode || "").trim() ||
    !String(course.courseName || "").trim() ||
    !Number.isFinite(course.creditHours) ||
    course.creditHours <= 0
  )) return false;
  if (body.semesters && body.semesters.some((semester) => semester.courses.some((course) =>
    !course || typeof course !== "object" ||
    !String(course.courseCode || "").trim() ||
    !String(course.courseName || "").trim() ||
    !Number.isFinite(course.creditHours) ||
    course.creditHours <= 0 ||
    !["registered", "completed", "failed"].includes(course.status) ||
    (course.attendancePercentage !== undefined &&
      course.attendancePercentage !== null &&
      (!Number.isFinite(course.attendancePercentage) ||
        course.attendancePercentage < 0 ||
        course.attendancePercentage > 100))
  ))) return false;
  if (body.academicWarnings && body.academicWarnings.some((warning) =>
    !warning || typeof warning !== "object" ||
    !String(warning.code || "").trim() ||
    !String(warning.description || "").trim()
  )) return false;
  return true;
};

const academicRecordForStudent = async (studentId) =>
  AcademicRecordModel.findOne({ studentId }).lean();

app.get("/admin/students/:id/academics", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send({ success: false, message: "Invalid student ID" });
    }
    const student = await UserModel.findOne({ _id: req.params.id, role: { $ne: "admin" } })
      .select("name email studentId department program academicYear");
    if (!student) return res.status(404).send({ success: false, message: "Student not found" });
    const record = await academicRecordForStudent(student._id);
    return res.send({
      success: true,
      student,
      academicRecord: record,
      calculations: calculateAcademicMetrics(record),
    });
  } catch (error) {
    console.error(`[admin-academics] Record lookup failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to load academic record" });
  }
});

app.put("/admin/students/:id/academics", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send({ success: false, message: "Invalid student ID" });
    }
    if (!isValidAcademicRecordPayload(req.body)) {
      return res.status(400).send({ success: false, message: "Invalid academic record" });
    }
    if (
      req.body.studyPlanVerified === true &&
      (req.body.verified !== true || !req.body.studyPlan?.length)
    ) {
      return res.status(400).send({
        success: false,
        message: "Verify the academic record and provide a study plan before verifying the plan",
      });
    }
    const student = await UserModel.findOne({ _id: req.params.id, role: { $ne: "admin" } })
      .select("_id");
    if (!student) return res.status(404).send({ success: false, message: "Student not found" });

    const changedFields = Object.keys(req.body);
    const record = await AcademicRecordModel.findOneAndUpdate(
      { studentId: student._id },
      { $set: { ...req.body, studentId: student._id, updatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    await AcademicAuditModel.create({
      adminEmail: req.admin.email,
      studentId: student._id,
      changedFields,
      createdAt: new Date(),
    });
    return res.send({
      success: true,
      academicRecord: record,
      calculations: calculateAcademicMetrics(record),
    });
  } catch (error) {
    const invalidRecord = error.name === "ValidationError" || error.name === "CastError";
    if (!invalidRecord) console.error(`[admin-academics] Record update failed (${error.name || "Error"}).`);
    return res.status(invalidRecord ? 400 : 500).send({
      success: false,
      message: invalidRecord ? "Academic record contains invalid values" : "Unable to save academic record",
    });
  }
});

const escapePdfText = (value) =>
  String(value ?? "—")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");

const createPdfBuffer = (title, lines) => {
  const wrapLine = (line) => {
    const value = escapePdfText(line);
    const chunks = [];
    for (let index = 0; index < value.length; index += 90) {
      chunks.push(value.slice(index, index + 90));
    }
    return chunks.length ? chunks : [""];
  };
  const contentLines = [title, "", ...lines].flatMap(wrapLine);
  const pageLines = [];
  for (let index = 0; index < contentLines.length; index += 50) {
    pageLines.push(contentLines.slice(index, index + 50));
  }
  const pageObjectIds = pageLines.map((_, index) => 3 + index * 2);
  const fontObjectId = 3 + pageLines.length * 2;
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageLines.length} >>`,
  ];
  for (const [index, page] of pageLines.entries()) {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = pageObjectId + 1;
    const textCommands = [
      "BT",
      "/F1 11 Tf",
      "50 780 Td",
      "14 TL",
      ...page.flatMap((line, lineIndex) => [
        `(${line}) Tj`,
        ...(lineIndex < page.length - 1 ? ["T*"] : []),
      ]),
      "ET",
    ].join("\n");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${Buffer.byteLength(textCommands, "ascii")} >>\nstream\n${textCommands}\nendstream`
    );
  }
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
};

const getAdminSummaryReport = async () => {
  const [students, records] = await Promise.all([
    UserModel.find({ role: { $ne: "admin" } }).select("name email department program").lean(),
    AcademicRecordModel.find({ verified: true }).lean(),
  ]);
  const recordByStudent = new Map(records.map((record) => [String(record.studentId), record]));
  const gpas = records.flatMap((record) =>
    (record.semesters || [])
      .map((semester) => semester.cgpa)
      .filter((gpa) => Number.isFinite(gpa))
  );
  const metrics = records.map(calculateAcademicMetrics);
  const attendance = metrics
    .map((record) => record.averageAttendancePercentage)
    .filter(Number.isFinite);
  const warnings = records.flatMap((record) =>
    (record.academicWarnings || []).filter((warning) => warning.status === "active")
  );
  return {
    generatedAt: new Date(),
    studentCount: students.length,
    verifiedAcademicRecords: records.length,
    averageCGPA: gpas.length
      ? Math.round((gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length) * 100) / 100
      : null,
    averageAttendancePercentage: attendance.length
      ? Math.round((attendance.reduce((sum, value) => sum + value, 0) / attendance.length) * 100) / 100
      : null,
    activeAcademicWarnings: warnings.length,
    students: students.map((student) => {
      const record = recordByStudent.get(String(student._id));
      return {
        name: student.name,
        studentId: student.studentId,
        department: student.department,
        program: student.program,
        cgpa: record
          ? (record.semesters || []).filter((semester) => Number.isFinite(semester.cgpa)).at(-1)?.cgpa ?? null
          : null,
      };
    }),
  };
};

app.get("/admin/reports/summary", async (req, res) => {
  try {
    return res.send({ success: true, report: await getAdminSummaryReport() });
  } catch (error) {
    console.error(`[admin-reports] Summary generation failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to generate Admin summary" });
  }
});

app.get("/admin/reports/summary.pdf", async (req, res) => {
  try {
    const report = await getAdminSummaryReport();
    const lines = [
      `Generated: ${report.generatedAt.toISOString()}`,
      `Student count: ${report.studentCount}`,
      `Verified academic records: ${report.verifiedAcademicRecords}`,
      `Average CGPA: ${report.averageCGPA ?? "Unavailable"}`,
      `Average attendance: ${report.averageAttendancePercentage ?? "Unavailable"}`,
      `Active academic warnings: ${report.activeAcademicWarnings}`,
      "",
      "Student academic summary:",
      ...report.students.map((student) =>
        `${student.studentId || "No ID"} | ${student.name} | ${student.department || "—"} | ${student.program || "—"} | CGPA ${student.cgpa ?? "Unavailable"}`
      ),
    ];
    res.type("application/pdf").attachment("admin-summary-report.pdf");
    return res.send(createPdfBuffer("Admin Summary Report", lines));
  } catch (error) {
    console.error(`[admin-reports] PDF generation failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to generate Admin summary PDF" });
  }
});

app.get("/admin/reports/students/:id/academic.pdf", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send({ success: false, message: "Invalid student ID" });
    }
    const student = await UserModel.findOne({ _id: req.params.id, role: { $ne: "admin" } })
      .select("name email studentId department program academicYear");
    if (!student) return res.status(404).send({ success: false, message: "Student not found" });
    const record = await academicRecordForStudent(student._id);
    const metrics = calculateAcademicMetrics(record);
    const lines = [
      `Student: ${student.name}`,
      `University ID: ${student.studentId || "Unavailable"}`,
      `Department: ${student.department || "Unavailable"}`,
      `Major: ${student.program || "Unavailable"}`,
      `Academic level: ${record?.academicLevel || "Unavailable"}`,
      `Record verified: ${record?.verified ? "Yes" : "No"}`,
      `Completed credit hours: ${metrics.completedCreditHours ?? "Unavailable"}`,
      `Academic progress: ${metrics.academicProgressPercentage ?? "Unavailable"}`,
      `Average attendance: ${metrics.averageAttendancePercentage ?? "Unavailable"}`,
      `Active academic warnings: ${(record?.academicWarnings || []).filter((warning) => warning.status === "active").length}`,
      "",
      "Semester records:",
      ...(record?.verified
        ? (record.semesters || []).map((semester) =>
          `${semester.semester} | GPA ${semester.semesterGPA ?? "Unavailable"} | CGPA ${semester.cgpa ?? "Unavailable"} | LCGPA ${semester.lcgpa ?? "Unavailable"}`
        )
        : ["Academic record has not been verified."]),
    ];
    res.type("application/pdf").attachment(`academic-report-${student.studentId || req.params.id}.pdf`);
    return res.send(createPdfBuffer("Student Academic Report", lines));
  } catch (error) {
    console.error(`[admin-reports] Student PDF generation failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to generate student academic PDF" });
  }
});

app.get("/admin/risk-monitoring", async (req, res) => {
  try {
    const parseOptionalThreshold = (value) => {
      if (!String(value || "").trim()) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const lowGpaLimit = parseOptionalThreshold(process.env.ADMIN_LOW_GPA_THRESHOLD);
    const attendanceLimit = parseOptionalThreshold(process.env.ADMIN_ATTENDANCE_THRESHOLD);
    const [students, records] = await Promise.all([
      UserModel.find({ role: { $ne: "admin" } }).select("name email studentId department program").lean(),
      AcademicRecordModel.find({ verified: true }).lean(),
    ]);
    const studentById = new Map(students.map((student) => [String(student._id), student]));
    const monitoredStudents = records.map((record) => {
      const student = studentById.get(String(record.studentId));
      if (!student) return null;
      const metrics = calculateAcademicMetrics(record);
      const gpa = (record.semesters || []).filter((semester) => Number.isFinite(semester.cgpa)).at(-1)?.cgpa ?? null;
      return {
        studentId: student.studentId,
        name: student.name,
        department: student.department,
        gpa,
        lowGpa: lowGpaLimit !== null && gpa !== null && gpa < lowGpaLimit,
        attendance: metrics.averageAttendancePercentage,
        attendanceConcern:
          attendanceLimit !== null &&
          metrics.averageAttendancePercentage !== null &&
          metrics.averageAttendancePercentage < attendanceLimit,
        academicWarnings: (record.academicWarnings || []).filter((warning) => warning.status === "active"),
        mlPrediction: "Prediction unavailable",
      };
    }).filter(Boolean);
    return res.send({
      success: true,
      thresholdsConfigured: {
        lowGpa: lowGpaLimit !== null,
        attendance: attendanceLimit !== null,
      },
      students: monitoredStudents,
    });
  } catch (error) {
    console.error(`[admin-risk] Monitoring data failed (${error.name || "Error"}).`);
    return res.status(500).send({ success: false, message: "Unable to load risk monitoring data" });
  }
});

app.get("/admin/students", async (req, res) => {
  try {
    if (!isDatabaseConnected()) return res.status(503).send({ success: false, message: "Database not connected" });
    const students = await UserModel.find({ role: { $ne: "admin" } }).select("-password").sort({ createdAt: -1 });
    res.send({ success: true, students });
  } catch (error) {
    res.status(500).send({ success: false, message: "Unable to load students", error: error.message });
  }
});

app.get("/admin/students/:id", async (req, res) => {
  try {
    if (!isDatabaseConnected()) return res.status(503).send({ success: false, message: "Database not connected" });
    const studentQuery = UserModel.findOne({ _id: req.params.id, role: { $ne: "admin" } });
    const student = await (typeof studentQuery?.select === "function" ? studentQuery.select("-password") : studentQuery);
    if (!student) return res.status(404).send({ success: false, message: "Student not found" });
    res.send({ success: true, student });
  } catch (error) {
    res.status(500).send({ success: false, message: "Unable to load student details", error: error.message });
  }
});

app.put("/admin/students/:id", async (req, res) => {
  try {
    if (!isDatabaseConnected()) return res.status(503).send({ success: false, message: "Database not connected" });
    const allowed = [
      "name", "email", "studentId", "phoneNumber", "program", "academicYear",
      "department", "gpa", "riskStatus", "aiPrediction", "alerts", "recommendations",
    ];
    if (Object.keys(req.body).some((key) => !allowed.includes(key))) {
      return res.status(400).send({ success: false, message: "Unsupported student fields" });
    }
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (key === "alerts" || key === "recommendations") {
        if (!Array.isArray(req.body[key]) || req.body[key].some((item) => typeof item !== "string")) {
          return res.status(400).send({ success: false, message: `${key} must be a list of text values` });
        }
        updates[key] = req.body[key].map((item) => item.trim()).filter(Boolean);
      } else if (key === "gpa") {
        const value = Number(req.body.gpa);
        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).send({ success: false, message: "GPA must be a non-negative number" });
        }
        updates.gpa = value;
      } else {
        if (typeof req.body[key] !== "string") {
          return res.status(400).send({ success: false, message: `${key} must be text` });
        }
        updates[key] = req.body[key].trim();
      }
    }
    if (!Object.keys(updates).length) {
      return res.status(400).send({ success: false, message: "No student fields were provided" });
    }
    if (updates.email) updates.email = updates.email.toLowerCase();
    if (updates.email && !isEmailIdentifier(updates.email)) {
      return res.status(400).send({ success: false, message: "Enter a valid student email address" });
    }
    const student = await UserModel.findOneAndUpdate(
      { _id: req.params.id, role: { $ne: "admin" } },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");
    if (!student) return res.status(404).send({ success: false, message: "Student not found" });
    await AcademicAuditModel.create({
      adminEmail: req.admin.email,
      studentId: student._id,
      changedFields: Object.keys(updates),
      createdAt: new Date(),
    });
    return res.send({ success: true, student });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).send({ success: false, message: "Student fields contain invalid values" });
    }
    console.error(`[admin-students] Student update failed (${error.name || "Error"}).`);
    return res.status(error.code === 11000 ? 409 : 500).send({
      success: false,
      message: error.code === 11000 ? "Email already exists" : "Unable to update student",
    });
  }
});

app.get("/admin/reports/student-summary", async (req, res) => {
  try {
    if (!isDatabaseConnected()) return res.status(503).send({ success: false, message: "Database not connected" });
    const [totalStudents, verifiedStudents, programStats] = await Promise.all([
      UserModel.countDocuments({ role: { $ne: "admin" } }),
      UserModel.countDocuments({ role: { $ne: "admin" }, $or: [{ isVerified: true }, { verified: true }] }),
      UserModel.aggregate([{ $match: { role: { $ne: "admin" } } }, { $group: { _id: { $ifNull: ["$program", "Not specified"] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);
    res.send({ success: true, report: { totalStudents, verifiedStudents, unverifiedStudents: totalStudents - verifiedStudents, studentsByProgram: programStats.map(({ _id, count }) => ({ program: _id || "Not specified", count })), generatedAt: new Date() } });
  } catch (error) {
    res.status(500).send({ success: false, message: "Unable to generate report", error: error.message });
  }
});

if (require.main === module) {
  const startServer = async () => {
    try {
      await connectDatabase();
      console.log("[server] Database-backed routes are ready.");
      const server = app.listen(PORT, "localhost", () => {
        console.log(`[server] API server running on http://localhost:${PORT}`);
        logEmailEnvStatus("startup");
      });

      server.on("error", (error) => {
        console.error(`[server] Failed to start API server: ${error.message}`);
      });
    } catch (error) {
      console.error("[server] Failed to initialize MongoDB connection.");
      console.error(`[server] ${error.message}`);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = {
  app,
  connectDatabase,
  loadServerEnv,
  UserModel,
  OtpModel,
  PasswordResetModel,
  AdminAccountModel,
  AdminSessionModel,
  AdminOtpModel,
  AdminPasswordResetModel,
  AcademicRecordModel,
  AcademicAuditModel,
};
