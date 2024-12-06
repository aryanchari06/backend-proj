import mongoose, { mongo } from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const channelId = req.user._id;

  const userChannel = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $project: {
        avatar: 0,
        coverImage: 0,
        email: 0,
        fullname: 0,
        username: 0,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "channelVideos",
        pipeline: [
          {
            $project: {
              title: 1,
              isPublished: 1,
              views: 1,
            },
          },
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "videoLikes",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              videoLikesCount: {
                $size: "$videoLikes",
              },
            },
          },
        ],
      },
    },

    {
      $addFields: {
        totalLikesCount: {
          $sum: "$channelVideos.videoLikesCount",
        },
        totalViews: {
          $sum: "$channelVideos.views",
        },
        totalVideosCount: {
          $size: "$channelVideos",
        },
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "channelSubscribers",
        pipeline: [
          {
            $project: {
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$channelSubscribers",
        },
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        watchHistory: 0,
      },
    },
  ]);

  if (!userChannel) throw new ApiError(400, "Could not fetch channel details");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userChannel,
        "User channel stats fetched successfully!"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoOwner",
        pipeline: [
          {
            $project: {
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!channelVideos) throw new ApiError(404, "Channel videos not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelVideos,
        "Channel videos fetched successfully!"
      )
    );
});

export { getChannelStats, getChannelVideos };
