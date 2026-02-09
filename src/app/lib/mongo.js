import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "Voxy";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    console.log("Reusing existing database connection");
    return mongoose.connection;
  }

  console.log("Establishing new database connection");
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: DB_NAME
    });
    console.log("Database connection established");
    return mongoose.connection;
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error("Could not connect to database");
  }
}

export default connectToDatabase;
