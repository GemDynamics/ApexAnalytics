declare module 'pdf-text-extract' {
  /**
   * Extrahiert Text aus einer PDF-Datei.
   * @param filePath Pfad zur PDF-Datei
   * @param options Optionen für die Extraktion
   * @param callback Callback-Funktion, die aufgerufen wird, wenn die Extraktion abgeschlossen ist
   */
  function extract(
    filePath: string,
    options?: any,
    callback?: (err: Error | null, pages?: string[]) => void
  ): void;
  
  /**
   * Extrahiert Text aus einer PDF-Datei.
   * @param filePath Pfad zur PDF-Datei
   * @param callback Callback-Funktion, die aufgerufen wird, wenn die Extraktion abgeschlossen ist
   */
  function extract(
    filePath: string,
    callback: (err: Error | null, pages?: string[]) => void
  ): void;

  export = extract;
} 