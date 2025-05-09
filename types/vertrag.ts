export interface Klausel {
  id: string;
  titel: string;
  inhalt: string;
  risikoFarbe: 'rot' | 'gelb' | 'grün';
  kommentar?: string;
}

export interface Vertrag {
  id: string;
  titel: string;
  beschreibung: string;
  projektTyp: string;
  erstelltAm: string;
  klauseln: Klausel[];
} 