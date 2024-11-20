// require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});
// const app = express();

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'self' https://vercel.live; script-src-elem 'self' https://vercel.live; style-src 'self'; img-src 'self'; connect-src 'self'; font-src 'self';"
  );
  next();
});

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("ERR: ", err);
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Service running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error while connecting to MONGODB !!!", error);
  });

export default (req, res) => {
  app(req, res); // This ensures Vercel handles the request to the Express app
};

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
