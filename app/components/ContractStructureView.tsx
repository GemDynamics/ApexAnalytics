"use client";
import React from 'react';

// Typen für die Vertragselemente
interface ContractElement {
  id: string;
  type: string; // "title", "heading", "clause", "text", etc.
  content: string;
  level?: number;
  parentId?: string;
  analysis?: ElementAnalysis;
}

interface ElementAnalysis {
  status: 'green' | 'yellow' | 'red';
  explanation: string;
  relevantChunks: string[];
  alternativeSuggestions?: string[];
}

interface ContractStructureViewProps {
  contract: {
    id: string;
    title: string;
    structuredElements: ContractElement[];
  };
  analyses?: Record<string, ElementAnalysis>;
  onAnalyzeClause?: (clauseId: string, clauseText: string) => void;
  onSelectClause?: (clause: ContractElement) => void;
}

// NEU: Interface für den Typ der Disclosure-Komponente inklusive statischer Sub-Komponenten
interface DisclosureComponentType extends React.FC<{
  children: (props: { open: boolean; setOpen: (open: boolean) => void }) => React.ReactNode;
  as?: React.ElementType;
  className?: string;
}> {
  Button: React.FC<{
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    children: React.ReactNode;
  }>;
  Panel: React.FC<{
    className?: string;
    children: React.ReactNode;
  }>;
}

// Vereinfachte Version der Disclosure-Komponente ohne Abhängigkeit von headlessui
const Disclosure: DisclosureComponentType = (({ children, as: Component = 'div', className }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Component className={className}>
      {children({ open, setOpen })}
    </Component>
  );
}) as DisclosureComponentType;

// Vereinfachte Disclosure.Button-Komponente
const DisclosureButton: React.FC<{
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}> = ({ className, onClick, children }) => {
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
};

// Vereinfachte Disclosure.Panel-Komponente
const DisclosurePanel: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Zuweisen der Unterkomponenten zu Disclosure
Disclosure.Button = DisclosureButton;
Disclosure.Panel = DisclosurePanel;

// Vereinfachte Version des ChevronUpIcon ohne Abhängigkeit von heroicons
const ChevronUpIcon: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  );
};

// Mapping für das Ampel-Farbsystem - MIT DARK MODE ANPASSUNGEN
const statusColors: Record<string, string> = {
  red: 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/70 dark:border-red-700 dark:text-red-300',
  yellow: 'bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/70 dark:border-amber-700 dark:text-amber-300',
  green: 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/70 dark:border-green-700 dark:text-green-300',
  none: 'bg-muted border-border text-muted-foreground'
};

export const ContractStructureView: React.FC<ContractStructureViewProps> = ({
  contract,
  analyses = {},
  onAnalyzeClause,
  onSelectClause
}) => {
  // Die Elemente nach Hierarchie sortieren und verschachteln
  const organizeElements = (elements: ContractElement[]) => {
    // Zuerst nach Typ und dann nach Position im Array sortieren
    const sortedElements = [...elements].sort((a, b) => {
      // Titel zuerst
      if (a.type === 'title' && b.type !== 'title') return -1;
      if (a.type !== 'title' && b.type === 'title') return 1;
      
      // Dann Überschriften nach Level
      if (a.type === 'heading' && b.type === 'heading') {
        return (a.level || 0) - (b.level || 0);
      }
      
      // Beibehalten der ursprünglichen Reihenfolge für andere Elemente
      return 0;
    });

    return sortedElements;
  };

  // Hilfsfunktion zum Rendern eines Elements basierend auf seinem Typ
  const renderElement = (element: ContractElement) => {
    const analysis = analyses[element.id];
    const currentStatusColors = statusColors[analysis?.status || 'none'];

    switch (element.type) {
      case 'title':
        return (
          <h1 className="text-3xl font-bold mb-6 text-card-foreground">
            {element.content}
          </h1>
        );
      
      case 'heading':
        const headingSize = element.level === 1 ? 'text-2xl' : 
                           element.level === 2 ? 'text-xl' : 'text-lg';
        
        return (
          <h2 className={`${headingSize} font-semibold mb-3 mt-6 text-card-foreground`}>
            {element.content}
          </h2>
        );
      
      case 'clause':
        return (
          <Disclosure as="div" className="mt-2 mb-4">
            {({ open, setOpen }) => (
              <>
                <Disclosure.Button 
                  className={`flex justify-between w-full px-4 py-3 text-left text-md font-medium rounded-lg ${currentStatusColors} border focus:outline-none focus-visible:ring focus-visible:ring-opacity-75`}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(!open);
                    if (onSelectClause) onSelectClause(element);
                  }}
                >
                  <span>{element.content.length > 100 ? `${element.content.substring(0, 100)}...` : element.content}</span>
                  <ChevronUpIcon
                    className={`${
                      open ? 'transform rotate-180' : ''
                    } w-5 h-5 text-muted-foreground`}
                  />
                </Disclosure.Button>
                {open && (
                  <Disclosure.Panel className="px-4 pt-4 pb-2 text-muted-foreground">
                    <div className="mb-4">
                      <p>{element.content}</p>
                    </div>
                    
                    {analysis && (
                      <div className={`p-3 rounded-md mt-2 ${currentStatusColors.replace(/text-[^\s]+/, 'text-opacity-90')} `}>
                        <p className="font-semibold text-card-foreground">Analyse:</p>
                        <p>{analysis.explanation}</p>
                        
                        {analysis.alternativeSuggestions && analysis.alternativeSuggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="font-semibold text-card-foreground">Alternativvorschläge:</p>
                            <ul className="list-disc pl-5">
                              {analysis.alternativeSuggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {onAnalyzeClause && (
                      <button
                        onClick={() => onAnalyzeClause(element.id, element.content)}
                        className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-1 px-4 rounded text-sm"
                      >
                        {analysis ? 'Analyse aktualisieren' : 'Analysieren'}
                      </button>
                    )}
                  </Disclosure.Panel>
                )}
              </>
            )}
          </Disclosure>
        );
      
      case 'text':
        return (
          <p className="text-muted-foreground mb-4">
            {element.content}
          </p>
        );
      
      default:
        return (
          <div className="text-muted-foreground">
            {element.content}
          </div>
        );
    }
  };

  // Organisierte Elemente
  const organizedElements = organizeElements(contract.structuredElements);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-card text-card-foreground rounded-xl shadow-md p-6 overflow-hidden">
        {organizedElements.map((element) => (
          <div key={element.id} className={`mb-2 ${element.parentId ? 'ml-6' : ''}`}>
            {renderElement(element)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractStructureView; 