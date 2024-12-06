import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!channelId) throw new ApiError(400, "Invalid Channel Link");

  const fetchedChannel = await User.findById(channelId);
  if (!fetchedChannel) throw new ApiError(404, "Channel not found");

  const isSubscribedToChannel = await Subscription.findOne(
    {
      subscriber: req.user._id,
      channel: new mongoose.Types.ObjectId(channelId),
    },
    {
      new: true,
    }
  );
  if (isSubscribedToChannel) {
    await Subscription.findByIdAndDelete(isSubscribedToChannel._id);
  } else {
    const subscribeToChannel = await Subscription.create({
      subscriber: req.user._id,
      channel: new mongoose.Types.ObjectId(channelId),
    });
    if (!subscribeToChannel)
      throw new ApiError(500, "Failed to subscribe to channel");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        "Subscribed/Unsubscribed to/from channel: ": fetchedChannel,
      },
      "Successfully subscribed/unsubscribed to channel"
    )
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(400, "Invalid channel link");

  const userChannelSubsribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "channelSubscribers",
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
    {
      $addFields: {
        channelSubscriberCount: {
          $size: "$channelSubscribers",
        },
      },
    },
  ]);

  if (!userChannelSubsribers) throw new ApiError(404, "Channel not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userChannelSubsribers,
        "Channel subscribers fetched sucessfully!"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) throw new ApiError(400, "Invalid subscriber link");

  const userChannelsSubsribedTo = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelsUserSubscribedTo",
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
    {
      $addFields: {
        channelsSubscribedCount: {
          $size: "$channelsUserSubscribedTo",
        },
      },
    },
  ]);

  if (!userChannelsSubsribedTo) throw new ApiError(404, "Subscriber not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userChannelsSubsribedTo,
        "Channels subscribered fetched sucessfully!"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
