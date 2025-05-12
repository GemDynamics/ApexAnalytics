import React from 'react';
import Link from 'next/link';
import ContractStructureView from '../components/ContractStructureView';

// Typen für die Anwendung
interface ContractElement {
  id: string;
  type: string;
  content: string;
  level?: number;
  parentId?: string;
}

interface ElementAnalysis {
  status: 'green' | 'yellow' | 'red';
  explanation: string;
  relevantChunks: string[];
  alternativeSuggestions?: string[];
}

const demoContract = {
  id: 'demo-contract',
  title: 'Bauvertrag Demo GmbH',
  structuredElements: [
    {
      id: 'title_1',
      type: 'title',
      content: 'Bauvertrag Demo GmbH'
    },
    {
      id: 'heading_1',
      type: 'heading',
      content: '1. Vertragsparteien',
      level: 1
    },
    {
      id: 'text_1',
      type: 'text',
      content: 'Zwischen der Demo GmbH, Musterstraße 123, 12345 Musterstadt (nachfolgend "Auftraggeber" genannt) und der Bau AG, Baustraße 456, 54321 Baustadt (nachfolgend "Auftragnehmer" genannt) wird folgender Bauvertrag geschlossen:',
      parentId: 'heading_1'
    },
    {
      id: 'heading_2',
      type: 'heading',
      content: '2. Leistungsumfang',
      level: 1
    },
    {
      id: 'clause_1',
      type: 'clause',
      content: 'Der Auftragnehmer verpflichtet sich zur Errichtung eines Bürogebäudes gemäß den beiliegenden Plänen und Leistungsverzeichnissen. Die Bauleistungen umfassen sämtliche erforderlichen Arbeiten zur schlüsselfertigen Erstellung des Gebäudes.',
      parentId: 'heading_2'
    },
    {
      id: 'heading_3',
      type: 'heading',
      content: '3. Vergütung',
      level: 1
    },
    {
      id: 'clause_2',
      type: 'clause',
      content: 'Die Vergütung für die vereinbarten Leistungen beträgt insgesamt EUR 5.000.000,00 netto (in Worten: fünf Millionen Euro). Zahlungen erfolgen nach Baufortschritt gemäß beiliegendem Zahlungsplan.',
      parentId: 'heading_3'
    },
    {
      id: 'heading_4',
      type: 'heading',
      content: '4. Sicherheiten',
      level: 1
    },
    {
      id: 'clause_3',
      type: 'clause',
      content: 'Der Auftragnehmer stellt dem Auftraggeber eine Vertragserfüllungsbürgschaft in Höhe von 20% der Auftragssumme. Die Bürgschaft ist auf erstes Anfordern zahlbar und unbefristet gültig. Sie wird erst nach vollständiger Fertigstellung und Abnahme zurückgegeben.',
      parentId: 'heading_4'
    },
    {
      id: 'heading_5',
      type: 'heading',
      content: '5. Termine',
      level: 1
    },
    {
      id: 'clause_4',
      type: 'clause',
      content: 'Die Bauzeit beginnt am 01.08.2024. Der Auftragnehmer hat die Leistungen innerhalb der vereinbarten Frist zu erbringen. Der Auftraggeber behält sich vor, den Fertigstellungstermin nach seinen Bedürfnissen anzupassen.',
      parentId: 'heading_5'
    },
    {
      id: 'heading_6',
      type: 'heading',
      content: '6. Zahlungsbedingungen',
      level: 1
    },
    {
      id: 'clause_5',
      type: 'clause',
      content: 'Die Zahlungen an den Auftragnehmer erfolgen nur, wenn und soweit der Auftraggeber seinerseits die entsprechenden Zahlungen vom Bauherrn erhalten hat (Pay-when-paid).',
      parentId: 'heading_6'
    }
  ]
};

// Beispiel-Analyse für Klauseln mit korrekten Typen
const demoAnalyses: Record<string, ElementAnalysis> = {
  'clause_1': {
    status: 'green',
    explanation: 'Diese Klausel beschreibt den Leistungsumfang in einer angemessenen und üblichen Weise. Die Leistungen werden klar auf die schlüsselfertige Erstellung des Gebäudes gemäß Plänen und Leistungsverzeichnissen bezogen.',
    relevantChunks: []
  },
  'clause_2': {
    status: 'green',
    explanation: 'Die Vergütungsklausel legt den Preis fest und verweist auf einen Zahlungsplan. Dies ist rechtlich unbedenklich.',
    relevantChunks: []
  },
  'clause_3': {
    status: 'yellow',
    explanation: 'Die geforderte Vertragserfüllungsbürgschaft von 20% der Auftragssumme ist überhöht. In der Regel sind 10% angemessen. Die Vereinbarung einer Bürgschaft auf erstes Anfordern kann zudem problematisch sein.',
    relevantChunks: ['rule_yellow_flag_003', 'legal_de_005'],
    alternativeSuggestions: [
      'Der Auftragnehmer stellt dem Auftraggeber eine Vertragserfüllungsbürgschaft in Höhe von 10% der Auftragssumme. Die Bürgschaft wird mit Abnahme des Werkes zurückgegeben.',
      'Der Auftragnehmer stellt dem Auftraggeber eine Vertragserfüllungsbürgschaft in Höhe von 10% der Auftragssumme. Die Bürgschaft ist bis zur Abnahme des Werkes befristet und wird danach zurückgegeben.'
    ]
  },
  'clause_4': {
    status: 'red',
    explanation: 'Diese Klausel enthält keinen fixen Fertigstellungstermin, sondern nur einen Beginn der Bauzeit. Der Auftraggeber behält sich vor, den Termin nach seinen Bedürfnissen anzupassen, was eine unangemessene Benachteiligung des Auftragnehmers darstellt.',
    relevantChunks: ['rule_red_flag_006', 'legal_at_005'],
    alternativeSuggestions: [
      'Die Bauzeit beginnt am 01.08.2024. Das Bauvorhaben ist bis zum 01.06.2025 fertigzustellen. Änderungen dieses Termins bedürfen der beiderseitigen Zustimmung in Schriftform.',
      'Die Bauzeit beginnt am 01.08.2024. Der Auftragnehmer hat die Leistungen bis spätestens 01.06.2025 fertigzustellen. Bei Verzögerungen, die der Auftragnehmer nicht zu vertreten hat, verlängert sich die Fertigstellungsfrist entsprechend.'
    ]
  },
  'clause_5': {
    status: 'red',
    explanation: 'Diese Pay-when-paid-Klausel ist nach deutschem und österreichischem Recht unzulässig, da sie das Insolvenzrisiko des Bauherrn vollständig auf den Auftragnehmer überträgt und diesen unangemessen benachteiligt.',
    relevantChunks: ['rule_red_flag_001', 'legal_de_003', 'legal_at_003'],
    alternativeSuggestions: [
      'Die Zahlungen erfolgen gemäß dem vereinbarten Zahlungsplan nach Baufortschritt und Rechnungsstellung innerhalb von 30 Tagen.',
      'Die Zahlungen erfolgen nach Baufortschritt gegen Vorlage von prüffähigen Rechnungen. Die Zahlungsfrist beträgt 30 Tage ab Rechnungseingang.'
    ]
  }
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Demo: Vertragsanalyse</h1>
          <Link 
            href="/"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-4 rounded-lg text-center transition-all"
          >
            Zurück zur Startseite
          </Link>
        </div>
        
        <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
          <p className="text-muted-foreground mb-4">
            Diese Demo zeigt eine fertig analysierte Vertragsanalyse mit typischen problematischen Klauseln.
            Jede Klausel wurde automatisch analysiert und nach dem Ampelprinzip bewertet:
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-muted-foreground">Rot: Kritische Klausel</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
              <span className="text-sm text-muted-foreground">Gelb: Verhandelbare Klausel</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-muted-foreground">Grün: Akzeptable Klausel</span>
            </div>
          </div>
          
          <p className="text-muted-foreground">
            Klicken Sie auf eine Klausel, um die detaillierte Analyse einzusehen.
          </p>
        </div>
        
        <ContractStructureView 
          contract={demoContract}
          analyses={demoAnalyses}
        />
      </div>
    </main>
  );
} 