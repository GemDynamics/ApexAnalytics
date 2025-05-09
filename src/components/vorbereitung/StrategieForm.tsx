import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Badge from '../ui/Badge';

interface Klausel {
  id: string;
  titel: string;
  inhalt: string;
  risikoFarbe: 'rot' | 'gelb' | 'grün';
}

interface KlauselStrategie {
  klauselId: string;
  argumente: string;
  strategie: string;
}

interface StrategieFormProps {
  vertragId: string;
  klausel: Klausel;
  onSave: (strategie: KlauselStrategie) => Promise<void>;
  isLoading?: boolean;
}

const StrategieForm: React.FC<StrategieFormProps> = ({
  vertragId,
  klausel,
  onSave,
  isLoading = false
}) => {
  const [argumente, setArgumente] = useState('');
  const [strategie, setStrategie] = useState('');
  const [existiertBereits, setExistiertBereits] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrategie = async () => {
      try {
        const response = await fetch(`/api/v1/vorbereitungen/${vertragId}/strategien/${klausel.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setArgumente(data.argumente || '');
          setStrategie(data.strategie || '');
          setExistiertBereits(true);
        } else if (response.status !== 404) {
          throw new Error('Strategie konnte nicht geladen werden');
        }
      } catch (err) {
        setFehler(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      }
    };

    fetchStrategie();
  }, [vertragId, klausel.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setFehler(null);
      await onSave({
        klauselId: klausel.id,
        argumente,
        strategie
      });
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  return (
    <div>
      <Card
        title={
          <div className="flex items-center">
            <span className="mr-2">{klausel.titel}</span>
            <Badge risiko={klausel.risikoFarbe} />
          </div>
        }
      >
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="whitespace-pre-line">{klausel.inhalt}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {fehler && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {fehler}
            </div>
          )}

          <div className="mb-4">
            <Textarea
              label="Erwartete Argumente des Bauherrn"
              placeholder="Welche Argumente und Bedenken könnte der Bauherr vorbringen?"
              value={argumente}
              onChange={(e) => setArgumente(e.target.value)}
              rows={4}
              fullWidth
            />
          </div>

          <div className="mb-6">
            <Textarea
              label="Ihre Verhandlungsstrategie"
              placeholder="Wie möchten Sie auf diese Klausel reagieren? Welche Argumente und Kompromissvorschläge haben Sie?"
              value={strategie}
              onChange={(e) => setStrategie(e.target.value)}
              rows={6}
              fullWidth
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
            >
              {existiertBereits ? 'Strategie aktualisieren' : 'Strategie speichern'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StrategieForm; 