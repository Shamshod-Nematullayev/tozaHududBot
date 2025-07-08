import mongoose from "mongoose";

export async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGO as string, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 50000,
    });
    console.log(`Ma'lumotlar bazasiga ulandi`);
  } catch (error: any) {
    console.error("MongoDB ulanishda xatolik:", error.message);
    process.exit(1);
  }
}
