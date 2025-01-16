import {  Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../lib/jwt";

const prisma = new PrismaClient();

class WorkersController {
  async create(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const { fullname, department } = req.body;
      if (!fullname) {
        return res.status(400).json({
          success: false,
          message: "Fullname is required",
        });
      }

      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Department is required",
        });
      }

      const workerExist = await prisma.worker.findFirst({
        where: {
          AND: [{ fullname: fullname }, { department: department }],
        },
      });

      console.log(workerExist);

      if (workerExist) {
        return res.status(409).json({
          success: false,
          message: "Username already exists in this department",
        });
      }

      const worker = await prisma.worker.create({
        data: {
          fullname,
          department,
          organization: {
            connect: {
              id: decoded.id,
            },
          },
          // Remove the active field since it defaults to true in schema
        },
      });

      return res.status(201).json({
        success: true,
        message: "Worker created successfully",
        workerId: worker.id,
      });
    } catch (error) {
      console.error("Create worker error:", error.toString());
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      // Get pagination parameters from query string
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Get total count of workers
      const totalWorkers = await prisma.worker.count({
        where: {
          organization_id: decoded.id,
          // active: true, // Assuming you want to count only active workers
        },
      });

      // Get paginated workers
      const workers = await prisma.worker.findMany({
        where: {
          organization_id: decoded.id,
          // active: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: "desc", // Optional: sort by creation date
        },
      });

      return res.status(200).json({
        success: true,
        workers,
        pagination: {
          total: totalWorkers,
          page,
          limit,
          totalPages: Math.ceil(totalWorkers / limit),
        },
      });
    } catch (error) {
      console.error("Get workers error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      // Validate token
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token", 
        });
      }

      // Validate and parse ID parameter
      const { id } = req.params;
      const workerId = parseInt(id);
      if (isNaN(workerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid worker ID format",
        });
      }

      // Get worker details
      const worker = await prisma.worker.findFirst({
        where: {
          id: workerId,
          organization_id: decoded.id, // Fixed field name
          // active: true,
        },
        select: {
          id: true,
          fullname: true,
          department: true, // Added department
          total_likes: true,
          total_dislikes: true,
          created_at: true,
          updated_at: true,
          organization: {
            select: {
              name: true,
              wilaya: true,
              commune: true
            }
          }
        },
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: "Worker not found or inactive",
        });
      }

      // Check if worker exists in other organizations
      const existForDifferentOrganization = await prisma.worker.findFirst({
        where: {
          fullname: worker.fullname,
          organization_id: {
            not: decoded.id,
          },
          active: true,
        },
      });

      if (existForDifferentOrganization) {
        return res.status(409).json({
          success: false,
          message: "Worker already exists in another organization",
          details: {
            worker_id: worker.id,
            organization_id: decoded.id
          }
        });
      }

      // Get like history
      const likeHistory = await prisma.like_history.findMany({
        where: {
          worker_id: workerId
        },
        orderBy: {
          created_at: 'desc'
        },

      });

      return res.status(200).json({
        success: true,
        data: {
          worker,
          recent_likes: likeHistory
        }
      });

    } catch (error) {
      console.error("Get worker error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const { id } = req.params;
      const { fullname } = req.body;

      if (!fullname) {
        return res.status(400).json({
          success: false,
          message: "Fullname is required",
        });
      }

      const worker = await prisma.worker.updateMany({
        where: {
          id: parseInt(id),
          organizationId: decoded.id,
          active: true,
        },
        data: {
          fullname,
        },
      });

      if (worker.count === 0) {
        return res.status(404).json({
          success: false,
          message: "Worker not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Worker updated successfully",
      });
    } catch (error) {
      console.error("Update worker error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }

      const { id } = req.params;
      const worker = await prisma.worker.updateMany({
        where: {
          id: parseInt(id),
          organizationId: decoded.id,
        },
        data: {
          active: false,
        },
      });

      if (worker.count === 0) {
        return res.status(404).json({
          success: false,
          message: "Worker not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Worker deleted successfully",
      });
    } catch (error) {
      console.error("Delete worker error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async changeStatus(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }
  
      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
  
      // Retrieve the worker's current status
      const worker = await prisma.worker.findFirst({
        where: {
          id: parseInt(req.params.id),
          organization_id: decoded.id,
        },
      });
  
      if (!worker) {
        return res.status(404).json({
          success: false,
          message: "Worker not found",
        });
      }
  
      // Toggle the active status
      const updatedWorker = await prisma.worker.update({
        where: {
          id: worker.id,
        },
        data: {
          active: !worker.active, // Toggle the active status
        },
      });
  
      return res.status(200).json({
        success: true,
        message: updatedWorker.active
          ? "Worker activated successfully"
          : "Worker deactivated successfully",
      });
    } catch (error) {
      console.error("Change worker status error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
  
}

export default new WorkersController();
