import React from 'react';
import Link from 'next/link';

export default function NewAnalysisPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 bg-gray-50">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 mt-12">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Neue Vertragsanalyse
        </h1>
        
        <p className="text-gray-600 mb-8">
          Laden Sie einen Vertrag hoch oder fügen Sie Ihren Vertragstext direkt ein, um eine detaillierte 
          Analyse zu starten. Das System wird den Vertrag strukturieren und jede einzelne Klausel 
          automatisch bewerten.
        </p>
        
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Vertragstitel
          </label>
          <input
            type="text"
            placeholder="z.B. Werkvertrag mit Firma XYZ"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Vertragstext
          </label>
          <textarea
            placeholder="Fügen Sie hier den vollständigen Vertragstext ein..."
            className="w-full h-80 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
        
        <div className="mb-8">
          <p className="text-lg font-medium text-gray-700 mb-2">Oder laden Sie eine Datei hoch</p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            >
              Datei auswählen
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Unterstützte Formate: PDF, DOC, DOCX, TXT
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link 
            href="/"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-center transition-all"
          >
            Zurück
          </Link>
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-center transition-all"
            disabled={false}
          >
            Analyse starten
          </button>
        </div>
      </div>
    </main>
  );
} 