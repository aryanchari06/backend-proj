import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) throw new ApiError(400, "Invalid video link");

  const videoComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commentOwner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
          // {
          //       $lookup: {
          //         from: "users",
          //         localField: "_id",
          //         foreignField: "owner",
          //         as: "commentOwner",
          //       },
          //     },
          
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "commentLikes",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "likedBy",
              foreignField: "_id",
              as: "commentLikedByUsers",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        commentLikesCount: {
          $size: "$commentLikes",
        },
        hasUserLikedComment: {
          $cond: {
            if: { $in: [req.user?._id, "$commentLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  console.log(videoComments);

  if (!videoComments) throw new ApiError(400, "Could not find video comments");

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoComments, "Video comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // TODO: add a comment to a video'
  if (!videoId) throw new ApiError(404, "Invalid link");
  if (!req.body.content) throw new ApiError(400, "Comment content is missing");

  const postedComment = await Comment.create({
    content: req.body.content,
    video: videoId,
    owner: req.user._id,
  });

  if (!postedComment)
    throw new ApiError(400, "Could not add comment on the video");

  return res
    .status(200)
    .json(new ApiResponse(200, postedComment, "Comment added successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: req.body.content,
      },
    },
    { new: true }
  );
  if (!updatedComment) throw new ApiError(400, "Could not update your comment");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment updated successfully!")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const deleteComment = await Comment.findByIdAndDelete(commentId);
  if (!deleteComment)
    throw new ApiError(
      400,
      "There was some problem while deleting your comment"
    );

  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "Comment deleted successfully!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
