import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
// import { verifyToken } from "../lib/jwt";

const prisma = new PrismaClient();

class LikeController {
  async create(req: Request, res: Response) {
    try {
      const { status, comment } = req.body;
      const worker_id = parseInt(req.params.worker_id);

      // Validate worker_id
      if (!worker_id || isNaN(worker_id)) {
        return res.status(400).json({ 
          success: false,
          message: "Valid worker ID is required" 
        });
      }

      // Validate status
      if (!status || (status !== "like" && status !== "dislike")) {
        return res.status(400).json({ 
          success: false,
          message: "Status must be either 'like' or 'dislike'" 
        });
      }

      // Check if worker exists and is active
      const worker = await prisma.worker.findUnique({
        where: { id: worker_id },
        select: { active: true }
      });

      if (!worker) {
        return res.status(404).json({
          success: false, 
          message: "Worker not found"
        });
      }

      if (!worker.active) {
        return res.status(400).json({
          success: false,
          message: "This worker is not active"
        });
      }

      // Create like/dislike record
      const like = await prisma.like_history.create({
        data: {
          worker_id,
          is_liked: status === "like",
          comment: comment || null
        }
      });

      // Update worker totals
      await prisma.worker.update({
        where: { id: worker_id },
        data: status === "like" 
          ? { total_likes: { increment: 1 } }
          : { total_dislikes: { increment: 1 } }
      });

      return res.status(201).json({
        success: true,
        data: like
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
}

export default new LikeController();
