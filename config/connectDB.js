const { default: mongoose } = require("mongoose");

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGO, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 50000,
    });
    console.log(`Ma'lumotlar bazasiga ulandi`);
  } catch (error) {
    console.error("MongoDB ulanishda xatolik:", err.message);
    process.exit(1);
  }
}

module.exports = { connectDb };
