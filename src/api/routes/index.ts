import express from 'express';
import vertragRoutes from './vertrag-routes';
import vorbereitungRoutes from './vorbereitung-routes';
import simulationRoutes from './simulation-routes';
import feedbackRoutes from './feedback-routes';

const router = express.Router();

// API Version
router.use('/api/v1/vertraege', vertragRoutes);
router.use('/api/v1/vorbereitungen', vorbereitungRoutes);
router.use('/api/v1/simulationen', simulationRoutes);
router.use('/api/v1/feedback', feedbackRoutes);

export default router; 