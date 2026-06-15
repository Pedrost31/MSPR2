import { Request, Response } from "express";
import { createUser, getUsers, getUserById } from "../services/user.service";

export const createUserController = (req: Request, res: Response) => {
  const user = createUser(req.body);
  res.json(user);
};

export const getUsersController = (req: Request, res: Response) => {
  res.json(getUsers());
};
export const getUserByIdController = (req: Request, res: Response) => {
  const id = req.params.id as string;

  const user = getUserById(id);
  res.json(user);
};