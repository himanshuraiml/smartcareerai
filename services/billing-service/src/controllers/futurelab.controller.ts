import { Request, Response, NextFunction } from 'express';
import { futureLabService } from '../services/futurelab.service';

export const futureLabController = {

    // GET /future-lab/tracks
    getTracks: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const tracks = await futureLabService.getTracks(userId);
            res.json({ success: true, data: tracks });
        } catch (err) {
            next(err);
        }
    },

    // GET /future-lab/tracks/:slug
    getTrack: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { slug } = req.params;
            const track = await futureLabService.getTrack(slug, userId);
            if (!track) return res.status(404).json({ success: false, message: 'Track not found' });
            res.json({ success: true, data: track });
        } catch (err) {
            next(err);
        }
    },

    // GET /future-lab/labs/:id
    getLabDetails: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { id } = req.params;
            const lab = await futureLabService.getLabDetails(id, userId);
            if (!lab) return res.status(404).json({ success: false, message: 'Lab not found' });
            res.json({ success: true, data: lab });
        } catch (err) {
            next(err);
        }
    },

    // POST /future-lab/labs/:labId/start
    startLab: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { labId } = req.params;
            const { trackId } = req.body;
            if (!trackId) return res.status(400).json({ success: false, message: 'trackId is required' });
            const result = await futureLabService.startLab({ userId, trackId, labId });
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    // POST /future-lab/labs/:labId/complete
    completeLab: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { labId } = req.params;
            const { trackId } = req.body;
            if (!trackId) return res.status(400).json({ success: false, message: 'trackId is required' });
            const result = await futureLabService.completeLab({ userId, trackId, labId });
            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    },

    // GET /future-lab/challenges/active
    getActiveChallenge: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const challenge = await futureLabService.getActiveChallenge(userId);
            res.json({ success: true, data: challenge });
        } catch (err) {
            next(err);
        }
    },

    // GET /future-lab/challenges
    getAllChallenges: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const challenges = await futureLabService.getAllChallenges(userId);
            res.json({ success: true, data: challenges });
        } catch (err) {
            next(err);
        }
    },

    // POST /future-lab/challenges/:challengeId/submit
    submitChallenge: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { challengeId } = req.params;
            const { githubUrl, writeup } = req.body;
            if (!githubUrl && !writeup) {
                return res.status(400).json({ success: false, message: 'Provide a GitHub URL or writeup' });
            }
            const result = await futureLabService.submitChallenge({ userId, challengeId, githubUrl, writeup });
            res.status(201).json({ success: true, data: result });
        } catch (err: any) {
            if (err.message?.includes('already submitted') || err.message?.includes('deadline')) {
                return res.status(400).json({ success: false, message: err.message });
            }
            next(err);
        }
    },

    // GET /future-lab/challenges/:challengeId/leaderboard
    getLeaderboard: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { challengeId } = req.params;
            const leaderboard = await futureLabService.getChallengeLeaderboard(challengeId);
            res.json({ success: true, data: leaderboard });
        } catch (err) {
            next(err);
        }
    },

    // GET /future-lab/stats
    getUserStats: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const stats = await futureLabService.getUserLabStats(userId);
            res.json({ success: true, data: stats });
        } catch (err) {
            next(err);
        }
    },
};
