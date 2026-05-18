import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";
import { seedAdmin } from "./config/seedAdmin";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await seedAdmin();

    const baseUrl =
      process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: ${baseUrl}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
