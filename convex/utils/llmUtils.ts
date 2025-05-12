"use strict";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 Sekunde
const MAX_BACKOFF_MS = 16000; // Maximale Wartezeit (z.B. 16 Sekunden)

/**
 * Führt einen Fetch-Aufruf mit einer Retry-Logik für bestimmte HTTP-Statuscodes durch.
 * @param url Die URL, die aufgerufen werden soll.
 * @param options Die RequestInit-Optionen für den Fetch-Aufruf.
 * @param attempt Der aktuelle Versuchszähler (intern verwendet).
 * @returns Eine Promise, die zur Response des Fetch-Aufrufs auflöst.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempt: number = 1
): Promise<Response> {
  console.log(`API Call (Attempt ${attempt}): ${options.method || 'GET'} ${url}`);
  try {
    const response = await fetch(url, options);

    // Statuscodes, die einen Retry auslösen sollen (z.B. Ratenlimits, Serverfehler)
    if ([429, 500, 502, 503, 504].includes(response.status)) {
      if (attempt <= MAX_RETRIES) {
        // Exponentieller Backoff mit Jitter und Maximalwert
        let backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        backoffTime = Math.min(backoffTime, MAX_BACKOFF_MS);
        // Jitter hinzufügen (z.B. +/- 20% der Backoff-Zeit), um gleichzeitige Retries zu vermeiden
        const jitter = backoffTime * 0.2 * (Math.random() * 2 - 1); 
        backoffTime += jitter;
        backoffTime = Math.max(0, Math.round(backoffTime)); // Sicherstellen, dass es nicht negativ ist

        console.warn(
          `API Request zu ${url} fehlgeschlagen mit Status ${response.status}. ` +
          `Warte ${backoffTime}ms vor Wiederholung (Versuch ${attempt}/${MAX_RETRIES})...`
        );
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return fetchWithRetry(url, options, attempt + 1);
      } else {
        console.error(
          `API Request zu ${url} endgültig fehlgeschlagen nach ${MAX_RETRIES} Versuchen mit Status ${response.status}.`
        );
        return response; // Gibt die letzte fehlerhafte Antwort zurück
      }
    }
    // Für erfolgreiche oder nicht-retrybare Fehler die Antwort direkt zurückgeben
    if (!response.ok) {
        console.warn(`API Call to ${url} completed with non-ok status ${response.status} (no retry)`);
    }
    return response;
  } catch (error: any) {
    // Netzwerkfehler oder andere unerwartete Fehler während des fetch
    console.error(`API Request zu ${url} fehlgeschlagen (Versuch ${attempt}) mit Netzwerk/Fetch-Fehler: ${error.message}`, error);
    if (attempt <= MAX_RETRIES) {
        let backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        backoffTime = Math.min(backoffTime, MAX_BACKOFF_MS);
        const jitter = backoffTime * 0.2 * (Math.random() * 2 - 1);
        backoffTime += jitter;
        backoffTime = Math.max(0, Math.round(backoffTime));

        console.warn(
            `Netzwerk/Fetch-Fehler für ${url}. ` +
            `Warte ${backoffTime}ms vor Wiederholung (Versuch ${attempt}/${MAX_RETRIES})...`
          );
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return fetchWithRetry(url, options, attempt + 1);
    }
    console.error(`API Request zu ${url} endgültig fehlgeschlagen nach ${MAX_RETRIES} Versuchen aufgrund von Netzwerk/Fetch-Fehlern.`);
    throw error; // Wirft den letzten Fehler weiter, wenn alle Retries fehlschlagen
  }
} 