import express from 'express';
import { FeedbackController } from '../controllers/feedback-controller';

const router = express.Router();

// Feedbackrouten
router.get('/:simulationId', FeedbackController.getFeedbackBySimulationId);
router.post('/:simulationId/generate', FeedbackController.generiereFeedback);

export default router; 