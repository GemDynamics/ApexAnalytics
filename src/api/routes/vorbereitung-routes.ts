import express from 'express';
import { VorbereitungController } from '../controllers/vorbereitung-controller';

const router = express.Router();

// Vorbereitungsrouten
router.get('/:vertragId', VorbereitungController.getVorbereitungByVertragId);
router.post('/', VorbereitungController.saveVorbereitung);
router.delete('/:vertragId', VorbereitungController.deleteVorbereitung);

// Klauselstrategien
router.get('/:vertragId/strategien/:klauselId', VorbereitungController.getKlauselStrategie);
router.post('/:vertragId/strategien/:klauselId', VorbereitungController.saveKlauselStrategie);

export default router; 