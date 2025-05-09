import express from 'express';
import { SimulationController } from '../controllers/simulation-controller';

const router = express.Router();

// Simulationsrouten
router.post('/start/:vertragId', SimulationController.startSimulation);
router.post('/:id/nachricht', SimulationController.verarbeiteNachricht);
router.post('/:id/beenden', SimulationController.beendeSimulation);
router.get('/:id', SimulationController.getSimulationById);
router.get('/vertrag/:vertragId/aktiv', SimulationController.getAktiveSimulationByVertragId);
router.delete('/:id', SimulationController.deleteSimulation);

export default router; 