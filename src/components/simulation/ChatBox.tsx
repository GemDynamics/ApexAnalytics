import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import Button from '../ui/Button';

interface ChatNachricht {
  id: string;
  absender: 'bauunternehmer' | 'bauherr';
  inhalt: string;
  zeitstempel: string;
  bezugKlauselId?: string;
}

interface ChatBoxProps {
  nachrichten: ChatNachricht[];
  onSendMessage: (nachricht: string) => Promise<void>;
  isLoading?: boolean;
  aktuelleKlausel?: {
    id: string;
    titel: string;
    inhalt: string;
  };
}

const ChatBox: React.FC<ChatBoxProps> = ({
  nachrichten,
  onSendMessage,
  isLoading = false,
  aktuelleKlausel
}) => {
  const [nachricht, setNachricht] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nachricht.trim() === '' || isLoading) return;

    setNachricht('');
    await onSendMessage(nachricht);
  };

  // Auto-scroll auf neue Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [nachrichten]);

  return (
    <div className="flex flex-col h-full">
      {aktuelleKlausel && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <h3 className="font-medium text-blue-800">{aktuelleKlausel.titel}</h3>
          <p className="text-sm text-blue-700 mt-1">{aktuelleKlausel.inhalt}</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {nachrichten.map((msg) => {
          const isBauherr = msg.absender === 'bauherr';
          return (
            <div 
              key={msg.id} 
              className={`flex ${isBauherr ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`max-w-3/4 p-3 rounded-lg ${
                  isBauherr 
                    ? 'bg-white border border-gray-200 text-gray-800' 
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-line">{msg.inhalt}</p>
                <p className={`text-xs mt-1 ${isBauherr ? 'text-gray-500' : 'text-blue-200'}`}>
                  {new Date(msg.zeitstempel).toLocaleTimeString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200 flex">
        <textarea
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Ihre Nachricht..."
          value={nachricht}
          onChange={(e) => setNachricht(e.target.value)}
          rows={2}
          disabled={isLoading}
        />
        <Button
          variant="primary"
          type="submit"
          className="rounded-l-none"
          isLoading={isLoading}
          disabled={nachricht.trim() === '' || isLoading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatBox; 