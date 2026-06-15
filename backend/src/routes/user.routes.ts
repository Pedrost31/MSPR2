import express from "express";
import {
  createUserController,
  getUsersController,
  getUserByIdController
} from "../controllers/user.controller";

const router = express.Router();

router.post("/", createUserController);
router.get("/", getUsersController);
router.get("/:id", getUserByIdController);

export default router;