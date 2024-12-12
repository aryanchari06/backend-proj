import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  //used to verify before logout
  try {
    // const token =
    //   req.cookies?.accessToken ||
    //   req.header("Authorization")?.replace("Bearer ", "");

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.error("Token is missing");
      throw new ApiError(401, "Unauthorised request, token is missing");
    }
    // console.log("TOken:", token);
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); //this is where you get the user info by decoding it
    // console.log(decodedToken);
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) throw new ApiError(401, "Invalid Access Token");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
