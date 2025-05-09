import express from 'express';
import { VertragController } from '../controllers/vertrag-controller';

const router = express.Router();

// Vertragsrouten
router.get('/', VertragController.getAllVertraege);
router.get('/:id', VertragController.getVertragById);
router.post('/', VertragController.createVertrag);
router.put('/:id', VertragController.updateVertrag);
router.delete('/:id', VertragController.deleteVertrag);

// Klauselrouten
router.get('/:vertragId/klauseln/:klauselId', VertragController.getKlausel);
router.post('/:vertragId/klauseln', VertragController.addKlausel);
router.put('/:vertragId/klauseln/:klauselId', VertragController.updateKlausel);
router.delete('/:vertragId/klauseln/:klauselId', VertragController.removeKlausel);

export default router; 