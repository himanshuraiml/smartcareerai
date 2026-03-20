import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { authMiddleware, adminMiddleware, editorOrAdminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ── Public endpoints (no auth required) ─────────────────────────────────
router.get('/posts', blogController.getPublishedPosts.bind(blogController));
router.get('/posts/slug/:slug', blogController.getPublishedPostBySlug.bind(blogController));

// ── Auth-required endpoints ───────────────────────────────────────────────
router.use(authMiddleware);

router.get('/my-posts', blogController.getMyPosts.bind(blogController));
router.get('/posts/:id', blogController.getPostById.bind(blogController));

// ── Editor/Admin only (write operations) ─────────────────────────────────
router.post('/posts', editorOrAdminMiddleware, blogController.createPost.bind(blogController));
router.put('/posts/:id', editorOrAdminMiddleware, blogController.updatePost.bind(blogController));
router.delete('/posts/:id', editorOrAdminMiddleware, blogController.deletePost.bind(blogController));
router.post('/posts/:id/submit', editorOrAdminMiddleware, blogController.submitForReview.bind(blogController));

// ── Admin-only endpoints ──────────────────────────────────────────────────
router.get('/admin/posts', adminMiddleware, blogController.listAllPosts.bind(blogController));
router.post('/admin/posts/:id/publish', adminMiddleware, blogController.publishPost.bind(blogController));
router.post('/admin/posts/:id/reject', adminMiddleware, blogController.rejectPost.bind(blogController));
router.post('/admin/posts/:id/archive', adminMiddleware, blogController.archivePost.bind(blogController));

export { router as blogRouter };
