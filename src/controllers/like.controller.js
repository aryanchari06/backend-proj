import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) throw new ApiError(400, "Invalid video link");
  const fetchedVideo = await Video.findById(videoId);
  if (!fetchedVideo) throw new ApiError(404, "Video not found");

  const isLiked = await Like.findOne(
    {
      video: videoId,
      likedBy: req.user._id,
    },
    {
      new: true,
    }
  );

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        "Video liked/unliked": fetchedVideo,
      },
      "Video liked/unliked sucessfully "
    )
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!commentId) throw new ApiError(400, "Invalid comment link");
  const fetchedComment = await Comment.findById(commentId);
  if (!fetchedComment) throw new ApiError(404, "Comment not found");

  const isLiked = await Like.findOne(
    {
      comment: commentId,
      likedBy: req.user._id,
    },
    {
      new: true,
    }
  );

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        "Comment liked/ unliked": fetchedComment,
      },
      "Comment liked/ unliked sucessfully "
    )
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!tweetId) throw new ApiError(400, "Invalid tweet link");
  const fetchedTweet = await Tweet.findById(tweetId);
  if (!fetchedTweet) throw new ApiError(404, "Tweet not found");

  const isLiked = await Like.findOne(
    {
      tweet: tweetId,
      likedBy: req.user._id,
    },
    {
      new: true,
    }
  );

  if (isLiked) {
    await Like.findByIdAndDelete(isLiked._id);
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        "Tweet liked/unliked": fetchedTweet,
      },
      "Tweet liked/unliked sucessfully "
    )
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: req.user._id,
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "videoOwner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "videoLikes",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$videoLikes",
              },
            },
          },
        ],
      },
    },
  ]);
  if (!likedVideos) throw new ApiError(400, "Could not fetch liked videos");

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully!")
    );
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
