import React, { useState } from 'react';

// Typen
interface KnowledgeChunk {
  id: string;
  textContent: string;
  metadata: {
    source: string;
    type: string;
    keywords: string[];
    last_updated: string;
  };
}

interface ElementAnalysis {
  status: 'green' | 'yellow' | 'red';
  explanation: string;
  relevantChunks: string[];
  alternativeSuggestions?: string[];
}

interface ClauseAnalysisViewProps {
  clause: {
    id: string;
    content: string;
  };
  analysis?: ElementAnalysis;
  knowledgeChunks?: KnowledgeChunk[];
  isLoading?: boolean;
  onReanalyze?: () => void;
  onAcceptSuggestion?: (suggestion: string) => void;
  onOptimizeWithAI?: () => void;
}

// Farbzuordnungen für den Status
const statusConfig = {
  red: {
    color: 'bg-red-100 border-red-500 text-red-800',
    title: 'Kritisch',
    description: 'Diese Klausel sollte abgelehnt oder grundlegend überarbeitet werden.'
  },
  yellow: {
    color: 'bg-amber-100 border-amber-500 text-amber-800',
    title: 'Verhandelbar',
    description: 'Diese Klausel sollte verhandelt und angepasst werden.'
  },
  green: {
    color: 'bg-green-100 border-green-500 text-green-800',
    title: 'Akzeptabel',
    description: 'Diese Klausel ist unbedenklich und kann akzeptiert werden.'
  }
};

export const ClauseAnalysisView: React.FC<ClauseAnalysisViewProps> = ({
  clause,
  analysis,
  knowledgeChunks = [],
  isLoading = false,
  onReanalyze,
  onAcceptSuggestion,
  onOptimizeWithAI
}) => {
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Wenn keine Analyse vorhanden ist oder noch lädt
  if (!analysis && !isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Klauselanalyse</h2>
        <p className="text-gray-600 mb-4">Keine Analyse verfügbar für diese Klausel.</p>
        
        {onReanalyze && (
          <button 
            onClick={onReanalyze}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Analysieren
          </button>
        )}
      </div>
    );
  }

  // Lade-Indikator
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Klauselanalyse wird durchgeführt...</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[analysis?.status || 'green'];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className={`p-4 rounded-lg ${statusInfo.color} mb-6`}>
        <h2 className="text-xl font-bold">{statusInfo.title}</h2>
        <p>{statusInfo.description}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Originale Klausel</h3>
        <div className="border p-4 rounded-md bg-gray-50">
          <p>{clause.content}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Analyse</h3>
        <p className="text-gray-700">{analysis?.explanation}</p>
      </div>

      {analysis?.alternativeSuggestions && analysis.alternativeSuggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Alternativvorschläge</h3>
          <div className="space-y-4">
            {analysis.alternativeSuggestions.map((suggestion, idx) => (
              <div key={idx} className="border p-4 rounded-md bg-blue-50 hover:bg-blue-100 transition">
                <p>{suggestion}</p>
                {onAcceptSuggestion && (
                  <button 
                    onClick={() => onAcceptSuggestion(suggestion)}
                    className="mt-2 bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                  >
                    Vorschlag übernehmen
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Eigene Überarbeitung</h3>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Geben Sie hier Ihre eigene Überarbeitung der Klausel ein..."
          className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
        
        {onOptimizeWithAI && (
          <button 
            onClick={onOptimizeWithAI}
            className="mt-2 bg-purple-500 hover:bg-purple-700 text-white py-2 px-4 rounded"
            disabled={!editedText.trim()}
          >
            Mit KI optimieren
          </button>
        )}
      </div>

      <div className="mb-4">
        <button 
          onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          <span>{showKnowledgeBase ? 'Wissensgrundlage ausblenden' : 'Rechtliche Wissensgrundlage anzeigen'}</span>
          <svg 
            className={`ml-1 w-4 h-4 transform ${showKnowledgeBase ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showKnowledgeBase && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Juristische Wissensgrundlage</h3>
          {knowledgeChunks.length > 0 ? (
            <div className="space-y-4">
              {knowledgeChunks.map((chunk) => (
                <div key={chunk.id} className="border p-4 rounded-md bg-gray-50">
                  <p className="font-medium text-sm text-gray-500 mb-1">
                    Quelle: {chunk.metadata.source} | Typ: {chunk.metadata.type}
                  </p>
                  <p className="text-gray-800">{chunk.textContent}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {chunk.metadata.keywords.map((keyword, idx) => (
                      <span 
                        key={idx} 
                        className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Keine Wissensgrundlage für diese Klausel verfügbar.</p>
          )}
        </div>
      )}

      {onReanalyze && (
        <div className="mt-6">
          <button 
            onClick={onReanalyze}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Neu analysieren
          </button>
        </div>
      )}
    </div>
  );
};

export default ClauseAnalysisView; 