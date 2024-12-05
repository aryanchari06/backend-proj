import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   //TODO: get all videos based on query, sort, pagination
//   const options = {
//     page: parseInt(page),
//     limit: parseInt(limit),
//   };

//   const pipeline = [];

//   if (query) {
//     pipeline.push({
//       $match: {
//         $or: [
//           { title: { $regex: query, $options: "i" } },
//           { description: { $regex: query, $options: "i" } },
//         ],
//       },
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "videoOwner",
//         pipeline: [{ $project: { username: 1, avatar: 1 } }],
//       },
//     });
//   }

//   if (sortBy) {
//     pipeline.push({
//       $sort: {
//         [sortBy]: parseInt(sortType), //sortType = 1 (ascending), -1(descending)
//       },
//     });
//   }

//   pipeline.push({
//     $skip: (options.page - 1) * limit,
//   });

//   pipeline.push({
//     $limit: options.limit,
//   });

//   const fetchedVideos = Video.aggregate();
//   const videoList = await Video.aggregatePaginate(fetchedVideos, options);

//   if (!videoList) throw new ApiError(400, "Could not fetch videos");
//   // console.log(videoList);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, videoList, "Videos fetched sucessfully"));
// });

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = 1,
    userId,
  } = req.query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const pipeline = [];

  // Match videos based on search query
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  // Match videos based on userId if provided
  if (userId) {
    pipeline.push({
      $match: { owner: userId },
    });
  }

  // Lookup to fetch video owner details
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "videoOwner",
      pipeline: [{ $project: { username: 1, avatar: 1 } }],
    },
  });
  pipeline.push(
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
    }
  );

  // Sort videos
  pipeline.push({
    $sort: {
      [sortBy]: parseInt(sortType, 10), // Ensure sortType is parsed as integer
    },
  });

  // Pagination stages
  pipeline.push(
    { $skip: (options.page - 1) * options.limit },
    { $limit: options.limit }
  );

  // Perform aggregation with pagination
  const fetchedVideos = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  if (!fetchedVideos) {
    throw new ApiError(400, "Could not fetch videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, fetchedVideos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const initialViews = 0;
  // TODO: get video, upload to cloudinary, create video
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

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
    views: initialViews,
    isPublished: true,
    owner: req.user._id,
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
  if (!videoId?.trim() || !isValidObjectId(videoId))
    throw new ApiError(404, "Invalid link");
  // const fetchedVideo = await Video.findById(videoId)

  const fetchedVideo = await Video.aggregate([
    {
      //find the video on the database
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },

    // //get owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoOwner",
        pipeline: [
          {
            //display username, fullname and avatar of the owner only
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    // //get a list of likes on the video
    {
      $lookup: {
        from: "likes", //you are in "video" and want to get data from "likes"
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },

    // //get a list of comments on the video
    {
      $lookup: {
        from: "comments", //you are in video and want to get from comments
        localField: "_id",
        foreignField: "video",
        as: "videoComments",
        // pipeline: [
        //   {
        //     $lookup: {
        //       from: "users",
        //       localField: "_id",
        //       foreignField: "owner",
        //       as: "commentOwner",
        //     },
        //   },
        //   {
        //     $lookup: {
        //       from: "likes",
        //       localField: "_id",
        //       foreignField: "comment",
        //       as: "commentLikes",
        //       pipeline: [
        //         {
        //           $project: {
        //             likedBy: 1,
        //           },
        //         },
        //         {
        //           $lookup: {
        //             from: "users",
        //             localField: "likedBy",
        //             foreignField: "_id",
        //             as: "commentLikedByUsers",
        //             pipeline: [
        //               {
        //                 $project: {
        //                   fullname: 1,
        //                   username: 1,
        //                   avatar: 1,
        //                 },
        //               },
        //             ],
        //           },
        //         },
        //       ],
        //     },
        //   },
        //   {
        //     $addFields: {
        //       commentLikesCount: {
        //         $size: "$commentLikes",
        //       },
        //       hasUserLikedComment: {
        //         $cond: {
        //           if: { $in: [req.user?._id, "$commentLikes.likedBy"] },
        //           then: true,
        //           else: false,
        //         },
        //       },
        //     },
        //   },
        // ],
      },
    },

    // //add video likes and comments count and if you have liked the video
    {
      $addFields: {
        videoLikesCount: {
          $size: "$videoLikes",
        },
        videoCommentsCount: {
          $size: "$videoComments",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$videoLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);
  // console.log(fetchedVideo);

  if (!fetchedVideo) throw new ApiError(404, "Video not found");

  const currentUser = await User.findById(req.user._id);

  if (!currentUser.watchHistory.includes(fetchedVideo[0]._id)) {
    const addVideoToUserWatchHistory = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          watchHistory: fetchedVideo[0]._id,
        },
      }
    );

    if (!addVideoToUserWatchHistory)
      throw new ApiError(500, "Could not add video to watch history");
  }

  await Video.updateOne(
    {
      _id: new mongoose.Types.ObjectId(videoId),
    },
    {
      $inc: {
        views: 1,
      },
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, fetchedVideo, "Video fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) throw new ApiError(400, "Invalid video link");

  const { title, description } = req.body;
  const thumbnailLocal = req.file?.path;
  console.log(thumbnailLocal);
  if (!title || !description || !thumbnailLocal)
    throw new ApiError(400, "All fields are necessary");

  const thumbnail = await uploadOnCloudinary(thumbnailLocal);
  if (!thumbnail) throw new ApiError(400, "Failed to upload thumbnail");

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  if (!updateVideo) throw new ApiError(500, "Failed to update video details");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) throw new ApiError(400, "Invalid link");

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deleteVideo)
    throw new ApiError(500, "Something went wrong while deleting the video");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Invalid link");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const statusToggledVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  if (!statusToggledVideo)
    throw new ApiError(400, "Error updating toggle video");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        statusToggledVideo,
        "Video publish status toggled successfully!"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
