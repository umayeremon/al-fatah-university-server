/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../errors/AppError";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { TUserRole } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { verifyToken } from "../modules/Auth/auth.utils";

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req?.headers?.authorization;

    // check the token sent from client
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }
    // verify the token

    let decoded;
    try {
      decoded = verifyToken(token, config.jwt_access_token as string);
    } catch (err) {
      console.log(err);
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    const { role, userId, iat } = decoded;

    const user = await User.isUserExistsByCustomId(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }
    const isDeleted = user?.isDeleted;
    if (isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, "This user is deleted");
    }
    const isBlocked = user?.status;
    if (isBlocked === "blocked") {
      throw new AppError(httpStatus.NOT_FOUND, "This user is blocked");
    }

    const passwordChangedAt = user.passwordChangedAt;

    if (
      passwordChangedAt &&
      User.isJwtIssuedBeforePasswordChanged(passwordChangedAt, iat as number)
    ) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }
    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }
    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;
