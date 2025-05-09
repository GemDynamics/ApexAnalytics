import { test, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { apiResolver } from 'next/dist/server/api-utils/node';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Handlers
import { handleSimulationStart } from '../../app/api/simulationen/[vertragId]/start/route';
import { handleSimulationNachricht } from '../../app/api/simulationen/[simulationId]/nachricht/route';
import { handleSimulationBeenden } from '../../app/api/simulationen/[simulationId]/beenden/route';
import { handleFeedbackGenerate } from '../../app/api/simulationen/[simulationId]/generate-feedback/route';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  // Seed test data
  // ...
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('Vollständiger Simulationsworkflow', async () => {
  // 1. Verhandlungsvorbereitung anlegen
  const vorbereitungRes = await fetch('/api/vertraege/test-vertrag-id/vorbereitung', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      globaleZiele: 'Testziele für Integration',
      nichtVerhandelbarePunkte: 'Testgrenzen für Integration',
      klauselStrategien: [
        {
          klauselId: 'test-klausel-1',
          argumente: 'Testargumente 1',
          strategie: 'Teststrategie 1'
        }
      ]
    })
  });
  expect(vorbereitungRes.status).toBe(200);
  
  // 2. Simulation starten
  const startRes = await fetch('/api/simulationen/test-vertrag-id/start', {
    method: 'POST'
  });
  expect(startRes.status).toBe(200);
  const simulation = await startRes.json();
  
  // 3. Nachricht senden
  const nachrichtRes = await fetch(`/api/simulationen/${simulation.id}/nachricht`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nachricht: 'Test-Nachricht' })
  });
  expect(nachrichtRes.status).toBe(200);
  
  // 4. Simulation beenden
  const beendenRes = await fetch(`/api/simulationen/${simulation.id}/beenden`, {
    method: 'POST'
  });
  expect(beendenRes.status).toBe(200);
  
  // 5. Feedback generieren
  const feedbackRes = await fetch(`/api/simulationen/${simulation.id}/generate-feedback`, {
    method: 'POST'
  });
  expect(feedbackRes.status).toBe(200);
  const feedback = await feedbackRes.json();
  
  // Prüfungen
  expect(feedback).toHaveProperty('gesamtBewertung');
  expect(feedback).toHaveProperty('stärken');
  expect(feedback).toHaveProperty('verbesserungsPotenzial');
  expect(feedback).toHaveProperty('emotionaleIntelligenz');
  expect(feedback).toHaveProperty('tippsNächsteVerhandlung');
}); 