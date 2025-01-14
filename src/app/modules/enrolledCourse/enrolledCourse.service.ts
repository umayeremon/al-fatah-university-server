import AppError from "../../errors/AppError";
import { OfferedCourse } from "../offeredCourse/offeredCourse.model";
import { TEnrolledCourse } from "./enrolledCourse.interface";
import httpStatus from "http-status";
import { EnrolledCourse } from "./enrolledCourse.model";
import { Student } from "../student/student.model";
import mongoose from "mongoose";

const createEnrolledCourseIntoDb = async (
  userId: string,
  payload: TEnrolledCourse,
) => {
  const { offeredCourse } = payload;
  const isOfferedCourseExists = await OfferedCourse.findById(offeredCourse);

  if (!isOfferedCourseExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Offered course not found!");
  }

  if (isOfferedCourseExists.maxCapacity <= 0) {
    throw new AppError(httpStatus.NOT_FOUND, "Room is full!");
  }

  const student = await Student.findOne({ id: userId }).select("_id");
  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student not found!");
  }

  const isStudentAlreadyEnrolled = await EnrolledCourse.findOne({
    semesterRegistration: isOfferedCourseExists?.semesterRegistration,
    offeredCourse,
    student: student?._id,
  });

  if (isStudentAlreadyEnrolled) {
    throw new AppError(httpStatus.CONFLICT, "Student already enrolled!");
  }

  const enrolledCourse = {
    semesterRegistration: isOfferedCourseExists?.semesterRegistration,
    academicSemester: isOfferedCourseExists?.academicSemester,
    academicFaculty: isOfferedCourseExists?.academicFaculty,
    academicDepartment: isOfferedCourseExists?.academicDepartment,
    offeredCourse: offeredCourse,
    course: isOfferedCourseExists?.course,
    student: student?._id,
    faculty: isOfferedCourseExists?.faculty,
    isEnrolled: true,
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await EnrolledCourse.create([enrolledCourse], { session });

    if (!result) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Failed to enrolled this course!",
      );
    }

    const maxCapacity = isOfferedCourseExists.maxCapacity;
    await OfferedCourse.findByIdAndUpdate(offeredCourse, {
      maxCapacity: maxCapacity - 1,
    });

    await session.commitTransaction();
    await session.endSession();
    return result;
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

export const enrolledCourseServices = {
  createEnrolledCourseIntoDb,
};
