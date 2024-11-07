import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  const owner = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  if (title == "" || description == "")
    throw new ApiError(404, "Title and description are required.");

  if (!videoLocalPath) throw new ApiError(404, "Video file missing");
  if (!thumbnailLocalPath) throw new ApiError(404, "Thumbnail file is missing");

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // console.log(videoFile)

  if (!videoFile.url)
    throw new ApiError(400, "Error while uploading your video");
  if (!thumbnail.url)
    throw new ApiError(400, "Error while uploading your thumbnail");

  const video = await Video.create({
    videoFile: videoFile?.url,
    thumbnail: thumbnail?.url,
    title: title,
    description: description,
    duration: videoFile.duration,
    views: 0,
    isPublished: true,
    owner: owner,
  });

  const uploadedVideo = await Video.findById(video._id);
  if (!uploadedVideo)
    throw new ApiError(500, "Something went wrong while uploading the video");

  // console.log(uploadedVideo);

  return await res
    .status(200)
    .json(new ApiResponse(200, uploadedVideo, "Video uploaded successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
