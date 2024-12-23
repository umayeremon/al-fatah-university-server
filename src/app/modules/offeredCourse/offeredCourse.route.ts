import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { zOfferedCourseValidations } from "./offeredCourse.validation";
import { offeredCourseControllers } from "./offeredCourse.controller";
import auth from "../../middlewares/auth";
import { userRole } from "../Auth/auth.const";

const router = Router();

router.post(
  "/create-offered-course",
  validateRequest(
    zOfferedCourseValidations.zCreateOfferedCourseValidationSchema,
  ),
  offeredCourseControllers.createOfferedCourse,
);
router.get(
  "/",
  auth(userRole.Admin, userRole.Faculty, userRole.Student),
  offeredCourseControllers.getAllOfferedCourse,
);
router.get("/:id", offeredCourseControllers.getSingleOfferedCourse);
router.patch(
  "/:id",
  validateRequest(
    zOfferedCourseValidations.zUpdateOfferedCourseValidationSchema,
  ),
  offeredCourseControllers.updateOfferedCourse,
);
router.delete("/:id", offeredCourseControllers.deleteOfferedCourse);

export const offeredCourseRouter = router;
