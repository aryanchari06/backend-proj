import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message

  const healthcheckResponse = {
    message: "OK",
    status: 200,
  };

  return res.status(200).json(new ApiResponse(200, healthcheckResponse, "OK"));
});

export { healthcheck };
