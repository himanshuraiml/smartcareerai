import { Request, Response, NextFunction } from 'express';
import { blogService } from '../services/blog.service';
import { BlogPostStatus } from '@prisma/client';

export class BlogController {
    // ── Public (no auth) ────────────────────────────────────────

    async getPublishedPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const { category, page, limit } = req.query;
            const result = await blogService.getPublishedPosts({
                category: category as string,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
            });
            res.json({ success: true, data: result.posts, pagination: result.pagination });
        } catch (error) {
            next(error);
        }
    }

    async getPublishedPostBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const post = await blogService.getPublishedPostBySlug(req.params.slug);
            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    // ── Authenticated (any logged-in user) ───────────────────────

    async getMyPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = req.query;
            const result = await blogService.getMyPosts(
                req.user!.id,
                page ? parseInt(page as string) : 1,
                limit ? parseInt(limit as string) : 20,
            );
            res.json({ success: true, data: result.posts, pagination: result.pagination });
        } catch (error) {
            next(error);
        }
    }

    async createPost(req: Request, res: Response, next: NextFunction) {
        try {
            const post = await blogService.createPost({
                ...req.body,
                authorId: req.user!.id,
            });
            res.status(201).json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    async getPostById(req: Request, res: Response, next: NextFunction) {
        try {
            const post = await blogService.getPostById(req.params.id, req.user!.id, req.user!.role);
            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    async updatePost(req: Request, res: Response, next: NextFunction) {
        try {
            const post = await blogService.updatePost(req.params.id, req.body, req.user!.id, req.user!.role);
            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    async deletePost(req: Request, res: Response, next: NextFunction) {
        try {
            await blogService.deletePost(req.params.id, req.user!.id, req.user!.role);
            res.json({ success: true, message: 'Post deleted' });
        } catch (error) {
            next(error);
        }
    }

    async submitForReview(req: Request, res: Response, next: NextFunction) {
        try {
            const post = await blogService.submitForReview(req.params.id, req.user!.id);
            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    // ── Admin only ──────────────────────────────────────────────

    async listAllPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const { status, category, page, limit } = req.query;
            const result = await blogService.listAllPosts({
                status: status as BlogPostStatus,
                category: category as string,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20,
            });
            res.json({ success: true, data: result.posts, pagination: result.pagination });
        } catch (error) {
            next(error);
        }
    }

    async publishPost(req: Request, res: Response, next: NextFunction) {
        try {
            const post = await blogService.publishPost(req.params.id);
            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    async rejectPost(req: Request, res: Response, next: NextFunction) {
        try {
            const { note } = req.body;
            const post = await blogService.rejectPost(req.params.id, note || '');
            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }

    async archivePost(req: Request, res: Response, next: NextFunction) {
        try {
            const post = await blogService.archivePost(req.params.id);
            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }
}

export const blogController = new BlogController();
