const request = require("supertest");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { app, loadServerEnv, UserModel, OtpModel, PasswordResetModel } = require("./index");

const originalEnv = { ...process.env };

const mockEmailDelivery = () => {
  process.env.EMAIL_USER = "sender@example.com";
  process.env.EMAIL_PASS = "app-password";
  const sendMail = jest.fn().mockResolvedValue({ messageId: "test-message-id" });
  jest.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail });
  return sendMail;
};

describe("server API", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  test("register API responds correctly", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue(null);
    const saveSpy = jest.spyOn(UserModel.prototype, "save").mockResolvedValue({});
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate");

    const response = await request(app).post("/register").send({
      name: "Test Student",
      email: "TEST@example.com",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      email: "test@example.com",
    });
    expect(saveSpy.mock.instances[0].password).not.toBe("password123");
    expect(await bcrypt.compare("password123", saveSpy.mock.instances[0].password)).toBe(true);
    expect(saveSpy.mock.instances[0].isVerified).toBe(true);
    expect(otpSpy).not.toHaveBeenCalled();
  });

  test("loads email variables from server .env by explicit path", () => {
    const savedEnv = { ...process.env };
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    loadServerEnv();

    expect(process.env.EMAIL_USER).toBeTruthy();
    expect(process.env.EMAIL_PASS).toBeTruthy();

    process.env = savedEnv;
  });

  test("login API responds correctly", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      password: hashedPassword,
      isVerified: false,
    });

    const response = await request(app).post("/login").send({
      email: "TEST@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Login Successful",
    });
  });

  test("login accepts and upgrades legacy plain-text password", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      password: "password123",
      isVerified: false,
    });
    const updateSpy = jest.spyOn(UserModel, "updateOne").mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });

    const response = await request(app).post("/login").send({
      email: "TEST@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalled();
    const update = updateSpy.mock.calls[0][1].$set;
    expect(update.password).not.toBe("password123");
    expect(await bcrypt.compare("password123", update.password)).toBe(true);
    expect(update.isVerified).toBe(true);
    expect(response.body).toMatchObject({
      success: true,
      message: "Login Successful",
    });
  });

  test("verify OTP updates isVerified and removes OTP", async () => {
    const hashedOtp = await bcrypt.hash("123456", 10);
    jest.spyOn(OtpModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      code: hashedOtp,
      expiresAt: new Date(Date.now() + 60000),
    });
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: false,
    });
    const updateSpy = jest.spyOn(UserModel, "updateOne").mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    const deleteSpy = jest.spyOn(OtpModel, "deleteMany").mockResolvedValue({
      deletedCount: 1,
    });
    const resetTokenSpy = jest
      .spyOn(PasswordResetModel, "findOneAndUpdate")
      .mockResolvedValue({});

    const response = await request(app).post("/verify-otp").send({
      email: "TEST@example.com",
      otp: "123456",
    });

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      {
        $or: [
          { email: "test@example.com" },
          { phone: "test@example.com" },
          { phoneNumber: "test@example.com" },
        ],
      },
      {
        $set: {
          isVerified: true,
          verified: true,
        },
      }
    );
    expect(deleteSpy).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(response.body).toMatchObject({
      success: true,
      message: "Email verified successfully",
      resetToken: expect.any(String),
    });
    expect(resetTokenSpy).toHaveBeenCalledWith(
      { email: "test@example.com" },
      expect.objectContaining({
        token: expect.not.stringMatching(response.body.resetToken),
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
      }),
      { upsert: true, new: true }
    );
  });

  test("reset password updates user password with bcrypt hash", async () => {
    const hashedToken = await bcrypt.hash("reset-token", 10);
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
    });
    jest.spyOn(PasswordResetModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60000),
    });
    const updateSpy = jest.spyOn(UserModel, "updateOne").mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    const resetDeleteSpy = jest.spyOn(PasswordResetModel, "deleteMany").mockResolvedValue({
      deletedCount: 1,
    });
    const otpDeleteSpy = jest.spyOn(OtpModel, "deleteMany").mockResolvedValue({
      deletedCount: 1,
    });

    const response = await request(app).post("/reset-password").send({
      email: "TEST@example.com",
      resetToken: "reset-token",
      password: "NewPass1234!",
    });

    expect(response.status).toBe(200);
    const update = updateSpy.mock.calls[0][1].$set;
    expect(update.password).not.toBe("NewPass1234!");
    expect(await bcrypt.compare("NewPass1234!", update.password)).toBe(true);
    expect(update.isVerified).toBe(true);
    expect(update.verified).toBe(true);
    expect(resetDeleteSpy).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(otpDeleteSpy).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(response.body).toMatchObject({
      success: true,
      message: "Password reset successfully",
    });
  });

  test("send reset OTP allows already verified users", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = mockEmailDelivery();

    const response = await request(app).post("/send-reset-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(200);
    expect(otpSpy).toHaveBeenCalledWith(
      { email: "test@example.com" },
      expect.objectContaining({
        code: expect.not.stringMatching(/^\d{6}$/),
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
      }),
      { upsert: true, new: true }
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Your password reset verification code",
      })
    );
    expect(response.body).toMatchObject({
      success: true,
      message: "OTP has been sent.",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("send reset OTP rejects missing users", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue(null);
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate");

    const response = await request(app).post("/send-reset-otp").send({
      email: "missing@example.com",
    });

    expect(response.status).toBe(404);
    expect(otpSpy).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({
      success: false,
      message: "User not found",
    });
  });

  test("forgot password alias sends reset OTP", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = mockEmailDelivery();

    const response = await request(app).post("/forgot-password").send({
      identifier: "TEST@example.com",
    });

    expect(response.status).toBe(200);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
      })
    );
    expect(response.body).toMatchObject({
      success: true,
      message: "OTP has been sent.",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("reset OTP ignores placeholder EMAIL values and uses SMTP fallback", async () => {
    process.env.EMAIL_USER = "your_email@gmail.com";
    process.env.EMAIL_PASS = "your_app_password";
    process.env.SMTP_USER = "sender@example.com";
    process.env.SMTP_PASS = "app-password";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "student@example.com",
      isVerified: true,
      verified: true,
    });
    jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = jest.fn().mockResolvedValue({ messageId: "test-message-id" });
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail });

    const response = await request(app).post("/send-reset-otp").send({
      identifier: "student@example.com",
    });

    expect(response.status).toBe(200);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          user: "sender@example.com",
          pass: "app-password",
        },
      })
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
      })
    );
  });

  test("send reset OTP returns clear email config error", async () => {
    process.env.EMAIL_USER = "your_email@gmail.com";
    process.env.EMAIL_PASS = "your_app_password";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASS = "";
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).post("/send-reset-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[send-reset-otp] Failed to send reset OTP:")
    );
    expect(response.body).toMatchObject({
      success: false,
      message: "Email service is not configured. Set EMAIL_USER and EMAIL_PASS in server/.env.",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("send reset OTP fails without storing OTP when sendMail fails", async () => {
    process.env.EMAIL_USER = "sender@example.com";
    process.env.EMAIL_PASS = "app-password";
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate");
    const sendMail = jest.fn().mockRejectedValue(new Error("SMTP rejected message"));
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).post("/send-reset-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(500);
    expect(sendMail).toHaveBeenCalled();
    expect(otpSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[email] Exact error: SMTP rejected message"
    );
    expect(response.body).toMatchObject({
      success: false,
      message: "Unable to send OTP email: SMTP rejected message",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("send OTP returns generated code for unverified users", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: false,
      verified: false,
    });
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = mockEmailDelivery();

    const response = await request(app).post("/send-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(200);
    expect(otpSpy).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      success: true,
      message: "OTP has been sent.",
    });
    expect(response.body.otp).toBeUndefined();
  });
});
