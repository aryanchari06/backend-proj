import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// Global cache to store connection (works in Vercel’s serverless model)
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(`${MONGODB_URI}/${DB_NAME}`, {
            maxPoolSize: 10, // Prevent excessive connections
        });
    }

    cached.conn = await cached.promise;
    console.log(`\n MONGODB connected !! DB HOST: ${cached.conn.connection.host}`);
    return cached.conn;
};

export default connectDB;
