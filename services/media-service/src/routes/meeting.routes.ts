import { Router } from 'express';
import {
    createMeeting,
    getMeeting,
    joinMeeting,
    leaveMeeting,
    endMeeting,
    getIceServers,
    admitParticipant,
    kickParticipant,
    getParticipants,
} from '../controllers/meeting.controller';

const router = Router();

router.post('/', createMeeting);
router.get('/ice-servers', getIceServers);
router.get('/:id', getMeeting);
router.post('/:id/join', joinMeeting);
router.delete('/:id/leave', leaveMeeting);
router.post('/:id/end', endMeeting);
router.get('/:id/participants', getParticipants);
router.post('/:id/admit/:participantId', admitParticipant);
router.post('/:id/kick/:participantId', kickParticipant);

export { router as meetingRouter };
