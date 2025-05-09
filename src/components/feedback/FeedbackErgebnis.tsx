import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface Bewertungspunkt {
  id: string;
  text: string;
  gewichtung: number;
  kategorie: string;
}

interface VerhandlungsFeedback {
  id: string;
  simulationId: string;
  erstelltAm: string;
  gesamtBewertung: number;
  stärken: Bewertungspunkt[];
  verbesserungsPotenzial: Bewertungspunkt[];
  emotionaleIntelligenz: Bewertungspunkt[];
  tippsNächsteVerhandlung: string;
  nächsteÜbungEmpfohlenIn: number;
}

interface FeedbackErgebnisProps {
  feedback: VerhandlungsFeedback;
}

const FeedbackErgebnis: React.FC<FeedbackErgebnisProps> = ({ feedback }) => {
  // Funktion zur Formatierung einer Punktzahl als Prozent
  const formatScore = (score: number): string => {
    return `${Math.round(score)}%`;
  };

  // Benotungsskala basierend auf der Gesamtbewertung
  const getGrade = (score: number): string => {
    if (score >= 90) return 'Ausgezeichnet';
    if (score >= 80) return 'Sehr gut';
    if (score >= 70) return 'Gut';
    if (score >= 60) return 'Befriedigend';
    if (score >= 50) return 'Ausreichend';
    return 'Verbesserungswürdig';
  };

  // Farbe basierend auf der Punktzahl
  const getColorClass = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <h2 className="text-2xl font-bold mb-6">Ihr Verhandlungsergebnis</h2>
        
        <div className="flex justify-center mb-6">
          <div className="relative inline-flex">
            <div 
              className={`text-5xl font-bold ${getColorClass(feedback.gesamtBewertung)}`}
            >
              {formatScore(feedback.gesamtBewertung)}
            </div>
            <div className="absolute -bottom-6 w-full text-center">
              <span className="text-sm font-medium text-gray-600">
                {getGrade(feedback.gesamtBewertung)}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 mt-8">
          Basierend auf Ihrer Verhandlungsführung empfehlen wir Ihnen, in 
          <span className="font-medium text-gray-800"> {feedback.nächsteÜbungEmpfohlenIn} Tagen </span>
          eine weitere Übung durchzuführen.
        </p>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Ihre Stärken">
          <ul className="space-y-3">
            {feedback.stärken.map(stärke => (
              <li key={stärke.id} className="flex items-start">
                <Badge variant="success" className="mt-0.5 mr-2 flex-shrink-0">+</Badge>
                <span>{stärke.text}</span>
              </li>
            ))}
          </ul>
        </Card>
        
        <Card title="Verbesserungspotenzial">
          <ul className="space-y-3">
            {feedback.verbesserungsPotenzial.map(verbesserung => (
              <li key={verbesserung.id} className="flex items-start">
                <Badge variant="warning" className="mt-0.5 mr-2 flex-shrink-0">!</Badge>
                <span>{verbesserung.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      
      <Card title="Emotionale Intelligenz">
        <ul className="space-y-3">
          {feedback.emotionaleIntelligenz.map(punkt => (
            <li key={punkt.id} className="flex items-start">
              <Badge variant="info" className="mt-0.5 mr-2 flex-shrink-0">i</Badge>
              <span>{punkt.text}</span>
            </li>
          ))}
        </ul>
      </Card>
      
      <Card title="Tipps für Ihre nächste Verhandlung">
        <p className="whitespace-pre-line text-gray-700">
          {feedback.tippsNächsteVerhandlung}
        </p>
      </Card>
    </div>
  );
};

export default FeedbackErgebnis; 