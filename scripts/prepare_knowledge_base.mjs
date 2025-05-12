// Script zum Befüllen der Convex Knowledge Base mit Knowledge Chunks
// Dieses Skript liest JSON-Dateien aus dem Verzeichnis ../knowledge_base_chunks,
// generiert Embeddings über eine Convex Action und speichert die Daten über eine Convex Mutation.

// Wichtig: Dieses Skript ist für die Ausführung in einer Node.js-Umgebung gedacht.
// Stellen Sie sicher, dass 'convex' und 'dotenv' installiert sind: 
// npm install convex dotenv
// oder yarn add convex dotenv

import path from 'path';
import fs from 'fs'; // Geändert von 'fs/promises'
import { ConvexHttpClient } from 'convex/browser'; // oder 'convex/values' je nach Bedarf
import { api } from '../convex/_generated/api.js'; // Pfad anpassen, falls nötig. .js ist wichtig für Node.js ES Modules
import 'dotenv/config'; // Lädt .env oder .env.local in process.env

// Konfiguration
// Annahme: Das Skript liegt in einem Unterverzeichnis (z.B. 'scripts')
// und 'knowledge_base_chunks' liegt im Hauptverzeichnis des Projekts.
const SCRIPT_DIR_RAW = path.dirname(new URL(import.meta.url).pathname.startsWith('/') && process.platform === 'win32' ? new URL(import.meta.url).pathname.substring(1) : new URL(import.meta.url).pathname);
const SCRIPT_DIR = decodeURIComponent(SCRIPT_DIR_RAW);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..'); // Gehe ein Verzeichnis nach oben vom Skriptverzeichnis
const CHUNKS_DIR_RAW = path.join(PROJECT_ROOT, 'knowledge_base_chunks');
const CHUNKS_DIR = decodeURIComponent(CHUNKS_DIR_RAW); // Sicherstellen, dass der finale Pfad auch dekodiert ist
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Fehler: NEXT_PUBLIC_CONVEX_URL ist nicht in .env.local gesetzt.");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log(`Lese Wissens-Chunks aus ${CHUNKS_DIR}...`);
  try {
    const files = fs.readdirSync(CHUNKS_DIR).filter(file => file.endsWith('.json'));
    console.log(`${files.length} Wissens-Chunk-Dateien gefunden in ${CHUNKS_DIR}`);

    if (files.length === 0) {
      console.log("Keine JSON-Dateien im Verzeichnis gefunden. Skript wird beendet.");
      return;
    }

    const knowledgeChunksData = files.map(file => {
      const filePath = path.join(CHUNKS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      let textContent = null;
      if (typeof data.textContent === 'string' && data.textContent.trim() !== "") {
        textContent = data.textContent;
      } else if (typeof data.text_content === 'string' && data.text_content.trim() !== "") {
        textContent = data.text_content;
      }

      if (textContent === null) {
        console.warn(`Datei ${file} hat weder gültigen 'textContent' noch 'text_content' und wird übersprungen.`);
      }
      return {
        fileName: file,
        textContent: textContent,
        metadata: data.metadata || { sourceFile: file } 
      };
    }).filter(chunk => chunk.textContent !== null); 

    if (knowledgeChunksData.length === 0) {
      console.log("Keine Wissens-Chunks mit gültigem Textinhalt gefunden. Skript wird beendet.");
      return;
    }

    console.log(`${knowledgeChunksData.length} Chunks mit gültigem Textinhalt werden verarbeitet.`);

    // Texte für Embedding vorbereiten
    const textsToEmbed = knowledgeChunksData.map(chunk => chunk.textContent);

    // Embeddings über Convex Action abrufen
    console.log("Rufe Embeddings über Convex Action 'api.kbProcessing.getEmbeddings' ab...");
    const embeddings = await convex.action(api.kbProcessing.getEmbeddings, { 
        textsToEmbed: textsToEmbed,
        taskType: "RETRIEVAL_DOCUMENT" 
    });

    if (!embeddings || embeddings.length !== knowledgeChunksData.length) {
      console.error("Fehler: Anzahl der Embeddings stimmt nicht mit der Anzahl der Chunks überein oder Embeddings sind null.");
      console.error("Erhaltene Embeddings:", embeddings ? embeddings.length : 'null');
      console.error("Erwartete Anzahl:", knowledgeChunksData.length);
      process.exit(1);
    }

    console.log(`${embeddings.length} Embeddings erfolgreich abgerufen.`);

    // Daten für die Speicherung vorbereiten
    const chunksToStore = knowledgeChunksData.map((chunk, index) => ({
      textContent: chunk.textContent,
      metadata: chunk.metadata,
      embedding: embeddings[index]
    }));

    // Daten in Batches an Convex Mutation senden
    console.log("Speichere Chunks mit Embeddings über Convex Mutation 'api.kbProcessing.storeKnowledgeChunkBatch'...");
    const BATCH_SIZE = 50; // Anpassbare Batch-Größe
    let totalStoredCount = 0;

    for (let i = 0; i < chunksToStore.length; i += BATCH_SIZE) {
      const batch = chunksToStore.slice(i, i + BATCH_SIZE);
      console.log(`Verarbeite Batch ${Math.floor(i / BATCH_SIZE) + 1} von ${Math.ceil(chunksToStore.length / BATCH_SIZE)} (Größe: ${batch.length})...`);
      const result = await convex.mutation(api.kbProcessing.storeKnowledgeChunkBatch, { chunks: batch });
      console.log(`Batch gespeichert: ${result.storedCount} Chunks. IDs:`, result.storedIds ? result.storedIds.join(', ') : 'N/A');
      totalStoredCount += result.storedCount || 0;
    }

    console.log(`Prozess abgeschlossen. Insgesamt ${totalStoredCount} Chunks in der Convex Datenbank gespeichert.`);

  } catch (error) {
    console.error("Fehler bei der Verarbeitung der Knowledge Base Chunks:", error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Unerwarteter Fehler im Hauptprozess:", err);
  process.exit(1);
}); 