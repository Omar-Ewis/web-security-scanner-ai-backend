import { Request, Response } from "express";

import { ChatSessionModel } from "../../DataBase/models/ChatSession.Model";
import {
  ChatMessageModel,
  ChatRoleEnum,
} from "../../DataBase/models/ChatMessage.Model";

import { NotFoundException, UnauthorizedException } from "../../utils/response/error.response";
import axios from "axios"

export const createSession = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const session = await ChatSessionModel.create({
    userId: req.user._id,
    title: "New Chat",
    lastMessage: "",
  });

  return res.status(201).json({
    message: "Session created successfully",
    data: session,
  });
};

export const getAllSessions = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const sessions = await ChatSessionModel.find({
    userId: req.user._id,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return res.status(200).json({
    message: "Sessions fetched successfully",
    data: sessions,
  });
};

export const getSessionMessages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { sessionId } = req.params;

  const session = await ChatSessionModel.findOne({
    _id: sessionId,
    userId: req.user._id,
  }).lean();

  if (!session) {
    throw new NotFoundException(
      "This Session Not Found"
    );
  }

  const messages = await ChatMessageModel.find({
    sessionId,
    userId: req.user._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json({
    message: "Messages fetched successfully",
    data: messages,
  });
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const session = await ChatSessionModel.findOne({
    _id: sessionId,
    userId: req.user._id,
  });

  if (!session) {
    throw new UnauthorizedException(
      "You are not allowed to access this session"
    );
  }

  await ChatMessageModel.create({
    sessionId,
    userId: req.user._id,
    role: ChatRoleEnum.USER,
    content: message,
  });

  // const history = (
  //   await ChatMessageModel.find({
  //     sessionId,
  //     userId: req.user._id,
  //   })
  //     .sort({ createdAt: -1 })
  //     .limit(20)
  //     .lean()
  // ).reverse();

  const aiResponse = await axios.post(
    process.env.AI_CHATBOT_API_URL as string,
    {
      question: message,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 1000 * 60 * 5,
    }
  );

  const aiReply = aiResponse.data?.answer || "No AI response";

  const assistantMessage = await ChatMessageModel.create({
    sessionId,
    userId: req.user._id,
    role: ChatRoleEnum.ASSISTANT,
    content: aiReply,
  });

  if (session.title === "New Chat") {
    session.title =
      message.length > 30 ? message.slice(0, 30) + "..." : message;
  }

  session.lastMessage = aiReply;

  await session.save();

  return res.status(201).json({
    message: "Message sent successfully",
    data: assistantMessage,
  });
};

export const deleteSession = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.user) {
    throw new UnauthorizedException("Unauthorized");
  }

  const { sessionId } = req.params;

  const session = await ChatSessionModel.findOne({
    _id: sessionId,
    userId: req.user._id,
  });

  if (!session) {
    throw new UnauthorizedException(
      "You are not allowed to delete this session"
    );
  }

  // delete all messages in this session
  await ChatMessageModel.deleteMany({
    sessionId,
    userId: req.user._id,
  });

  // delete session itself
  await ChatSessionModel.findByIdAndDelete(sessionId);

  return res.status(200).json({
    message: "Session deleted successfully",
  });
};