const mongoose = require("mongoose");
const { connectDatabase, UserModel, OtpModel } = require("./index");

const email = (process.argv[2] || "").toLowerCase().trim();
const shouldMarkVerified = process.argv.includes("--mark-verified");

const run = async () => {
  if (!email) {
    throw new Error("Usage: node checkVerification.js <email> [--mark-verified]");
  }

  await connectDatabase();

  const user = await UserModel.findOne({ email })
    .select("email isVerified verified createdAt role")
    .lean();

  if (!user) {
    console.log(JSON.stringify({ found: false, email }));
    return;
  }

  console.log(JSON.stringify({ found: true, before: user }));

  if (!shouldMarkVerified || user.isVerified === true) {
    console.log(
      JSON.stringify({
        updated: false,
        reason: user.isVerified === true ? "already verified" : "mark-verified flag not provided",
      })
    );
    return;
  }

  const updateResult = await UserModel.updateOne(
    { email },
    {
      $set: {
        isVerified: true,
        verified: true,
      },
    }
  );
  const otpDeleteResult = await OtpModel.deleteMany({ email });
  const updatedUser = await UserModel.findOne({ email })
    .select("email isVerified verified createdAt role")
    .lean();

  console.log(
    JSON.stringify({
      updated: true,
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      otpDeleted: otpDeleteResult.deletedCount,
      after: updatedUser,
    })
  );
};

run()
  .catch((error) => {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
