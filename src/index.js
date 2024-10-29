// require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";
import express from "express";
import connectDB  from "./db/index.js";

dotenv.config({
  path: "./env",
});
const app = express();

//iffe
/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("Error", (error) => {
      console.log("ERR: ", error);
    });

    app.listen(process.env.PORT, () => {
      console.log(`App listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
})();
*/

connectDB();
