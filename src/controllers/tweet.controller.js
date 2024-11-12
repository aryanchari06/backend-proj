import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const postedTweet = await Tweet.create({
    content: req.body.content,
    owner: req.user._id,
  });

  if (!postedTweet) throw new ApiError(400, "Failed to create tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, postedTweet, "Tweet created successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: req.user._id,
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "tweetLikes",
      },
    },
    {
      $addFields: {
        tweetLikes: {
          $size: "$tweetLikes",
        },
      },
    },
  ]);
  if (!userTweets) throw new ApiError(400, "Could not fetch user tweets");

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  if (!tweetId) throw new ApiError(404, "Invalid Tweet Link");

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: req.body.content,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedTweet) throw new ApiError(400, "Could not update tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!tweetId) throw new ApiError(404, "Invalid Tweet Link");

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) throw new ApiError(400, "Could not delete tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
