import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist
  if (!name || !description)
    throw new ApiError(404, "Playlist name or description missing");

  const createdPlaylist = await Playlist.create({
    name: name,
    description: description,
    videos: [],
    owner: new mongoose.Types.ObjectId(req.user._id),
  });

  if (!createPlaylist) throw new ApiError(400, "Could not create playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(200, createdPlaylist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId || isValidObjectId(userId))
    throw new ApiError(400, "Invalid user ID");

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: userId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
      },
    },
    {
      $match: {
        isPublished: true,
      },
    },
  ]);

  if (!userPlaylists) throw new ApiError(400, "Could not fetch user playlists");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPlaylists,
        "User playlists fetched successfully!"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId || !isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist ID");

  const fetchedPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: playlistId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
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
        playlistVideoCount: {
          $size: "$playlistVideos",
        },
      },
    },
  ]);

  if (!playlistId) throw new ApiError(404, "Playlist not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, fetchedPlaylist, "Playlist fetched successfully!")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId)
    throw new ApiError(404, "Playlist ID or Video ID is missing");

  const fetchedVideo = await Video.findById(videoId);
  if (!fetchedVideo) throw new ApiError(404, "Requested video not found");

  const videoAddedToPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: fetchedVideo._id,
      },
    },
    {
      new: true,
    }
  );

  if (!videoAddedToPlaylist)
    throw new ApiError(500, "Could not add the video to the playlist");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        "Video added to the playlist: ": fetchedVideo,
      },
      "Video added to the playlist successfully!"
    )
  );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  const videoRemovedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  if (!videoRemovedPlaylist)
    throw new ApiError(400, "Could not remove video from the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoRemovedPlaylist,
        "Video removed from playlist successfully!"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!playlistId || isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist id");

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist)
    throw new ApiError(400, "Could not delete the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully!")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId || isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist id");

  if (!name && !description)
    throw new ApiError(404, "Name and description are missing");

  const updatedPlaylsit = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        $or: [{ name, description }],
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylsit) throw new ApiError(500, "Could not update playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylsit, "Playlist updated sucessfully!")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
