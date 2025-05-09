import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface Vertrag {
  id: string;
  titel: string;
  beschreibung: string;
  projektTyp: string;
  erstelltAm: string;
  klauseln: any[];
}

const VertragListe: React.FC = () => {
  const [vertraege, setVertraege] = useState<Vertrag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVertraege = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/vertraege');
        
        if (!response.ok) {
          throw new Error('Verträge konnten nicht geladen werden');
        }
        
        const data = await response.json();
        setVertraege(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVertraege();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Vertrag löschen möchten?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/vertraege/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Vertrag konnte nicht gelöscht werden');
      }
      
      // Aktualisiere die Liste nach dem Löschen
      setVertraege(vertraege.filter(vertrag => vertrag.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p>Verträge werden geladen...</p>
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Verträge</h2>
        <Link href="/vertraege/neu">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Vertrag
          </Button>
        </Link>
      </div>

      {vertraege.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">Keine Verträge vorhanden</p>
            <Link href="/vertraege/neu">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Ersten Vertrag erstellen
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {vertraege.map((vertrag) => (
            <Card key={vertrag.id} hoverable className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-800">{vertrag.titel}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(vertrag.erstelltAm).toLocaleDateString('de-DE')} | {vertrag.projektTyp}
                </p>
                <p className="text-sm text-gray-700 mt-1">{vertrag.beschreibung}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {vertrag.klauseln.length} Klauseln
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(vertrag.id)}
                  aria-label="Vertrag löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Link href={`/vertraege/${vertrag.id}`}>
                  <Button variant="primary" size="sm" aria-label="Vertrag anzeigen">
                    <span className="mr-1">Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VertragListe; 