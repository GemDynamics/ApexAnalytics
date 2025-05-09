import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface Klausel {
  id: string;
  titel: string;
  inhalt: string;
  risikoFarbe: 'rot' | 'gelb' | 'grün';
  kommentar?: string;
}

interface Vertrag {
  id: string;
  titel: string;
  beschreibung: string;
  projektTyp: string;
  erstelltAm: string;
  klauseln: Klausel[];
}

interface VertragDetailsProps {
  vertragId: string;
}

const VertragDetails: React.FC<VertragDetailsProps> = ({ vertragId }) => {
  const [vertrag, setVertrag] = useState<Vertrag | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVertrag = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/vertraege/${vertragId}`);
        
        if (!response.ok) {
          throw new Error('Vertrag konnte nicht geladen werden');
        }
        
        const data = await response.json();
        setVertrag(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      } finally {
        setIsLoading(false);
      }
    };

    if (vertragId) {
      fetchVertrag();
    }
  }, [vertragId]);

  const handleDeleteKlausel = async (klauselId: string) => {
    if (!vertrag) return;
    
    if (!confirm('Sind Sie sicher, dass Sie diese Klausel löschen möchten?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/vertraege/${vertrag.id}/klauseln/${klauselId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Klausel konnte nicht gelöscht werden');
      }
      
      // Aktualisiere die Klauseln nach dem Löschen
      setVertrag({
        ...vertrag,
        klauseln: vertrag.klauseln.filter(klausel => klausel.id !== klauselId)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p>Vertrag wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()} className="mt-4">
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!vertrag) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Vertrag nicht gefunden</p>
        <Link href="/vertraege">
          <Button variant="secondary" className="mt-4">
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/vertraege">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{vertrag.titel}</h1>
          <p className="text-gray-500 mt-1">
            {new Date(vertrag.erstelltAm).toLocaleDateString('de-DE')} | {vertrag.projektTyp}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/vertraege/${vertrag.id}/edit`}>
            <Button variant="secondary">
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </Link>
          <Link href={`/vertraege/${vertrag.id}/simulieren`}>
            <Button variant="primary">
              Simulation starten
            </Button>
          </Link>
        </div>
      </div>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Beschreibung</h2>
        <p className="text-gray-700">{vertrag.beschreibung}</p>
      </Card>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Klauseln ({vertrag.klauseln.length})</h2>
        <Link href={`/vertraege/${vertrag.id}/klauseln/neu`}>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Klausel hinzufügen
          </Button>
        </Link>
      </div>
      
      {vertrag.klauseln.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">Keine Klauseln vorhanden</p>
            <Link href={`/vertraege/${vertrag.id}/klauseln/neu`}>
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Erste Klausel hinzufügen
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {vertrag.klauseln.map((klausel) => (
            <Card key={klausel.id}>
              <div className="flex justify-between">
                <div className="flex space-x-2 items-center">
                  <h3 className="text-lg font-medium">{klausel.titel}</h3>
                  <Badge risiko={klausel.risikoFarbe} />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteKlausel(klausel.id)}
                    aria-label="Klausel löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Link href={`/vertraege/${vertrag.id}/klauseln/${klausel.id}/edit`}>
                    <Button variant="secondary" size="sm" aria-label="Klausel bearbeiten">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mt-2 whitespace-pre-line text-gray-700">
                {klausel.inhalt}
              </div>
              {klausel.kommentar && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Kommentar:</span> {klausel.kommentar}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VertragDetails; 