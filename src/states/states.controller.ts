import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../lib/jwt";

// Single PrismaClient instance to avoid multiple instances during hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

class StatesController {
  async getAll(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }

      const totalWorkers = await prisma.worker.count();
      const activeWorkers = await prisma.worker.count({ where: { active: true } });
      const inactiveWorkers = await prisma.worker.count({ where: { active: false } });

      const feedbackCounts = await prisma.like_history.groupBy({
        by: ['is_liked'],
        _count: true,
      });

      const totalLikes = feedbackCounts.find((record: any) => record.is_liked)?._count ?? 0;
      const totalDislikes = feedbackCounts.find((record: any) => !record.is_liked)?._count ?? 0;
      const totalFeedback = totalLikes + totalDislikes;
      const engagementRate = totalWorkers > 0 ? (totalFeedback / totalWorkers) : 0;

      const topPerformingWorker = await prisma.worker.findFirst({
        orderBy: { total_likes: 'desc' },
        include: { organization: true },
      });

      const mostDislikedWorker = await prisma.worker.findFirst({
        orderBy: { total_dislikes: 'desc' },
        include: { organization: true },
      });

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const feedbackThisMonth = await prisma.like_history.count({ where: { created_at: { gte: startOfMonth } } });
      const newWorkersThisMonth = await prisma.worker.count({ where: { created_at: { gte: startOfMonth } } });

      const workerDistributionByDepartment = await prisma.worker.groupBy({
        by: ['department'],
        _count: true,
      });

      const workerByActiveStatus = await prisma.worker.groupBy({
        by: ['active'],
        _count: true,
      });

      const response = {
        workerDistributionByDepartment,
        workerByActiveStatus,
        totalWorkers,
        activeWorkers,
        inactiveWorkers,
        totalFeedback,
        engagementRate,
        topPerformingWorker,
        mostDislikedWorker,
        feedbackThisMonth,
        newWorkersThisMonth,
      };

      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error("Get statistics error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : "Error details are not available in production mode."
      });
    }
  }
}

export default new StatesController();
