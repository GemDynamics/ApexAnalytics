import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { ArrowRight, FileText, MessageSquare, BarChart2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface DashboardStats {
  vertragCount: number;
  simulationCount: number;
  feedbackCount: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    vertragCount: 0,
    simulationCount: 0,
    feedbackCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // In einer realen Anwendung würde hier die API aufgerufen werden
        // Für Demo-Zwecke setzen wir Mock-Daten nach einem kurzen Delay
        setTimeout(() => {
          setStats({
            vertragCount: 5,
            simulationCount: 12,
            feedbackCount: 8
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Head>
        <title>BauVertragsanalyse - Dashboard</title>
        <meta name="description" content="Trainieren Sie Ihre Verhandlungsfähigkeiten mit der BauVertragsanalyse" />
      </Head>

      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <p>Daten werden geladen...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="text-center">
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-blue-100 rounded-full mb-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{stats.vertragCount}</h2>
                  <p className="text-gray-600">Verträge</p>
                </div>
              </Card>

              <Card className="text-center">
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-green-100 rounded-full mb-3">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{stats.simulationCount}</h2>
                  <p className="text-gray-600">Simulationen</p>
                </div>
              </Card>

              <Card className="text-center">
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-indigo-100 rounded-full mb-3">
                    <BarChart2 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{stats.feedbackCount}</h2>
                  <p className="text-gray-600">Feedback-Berichte</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                title="Verhandlungen simulieren"
                className="hover:shadow-lg transition-shadow"
              >
                <p className="text-gray-600 mb-4">
                  Trainieren Sie Ihre Verhandlungskompetenzen durch realistische Simulationen 
                  mit einem KI-Bauherrn und erhalten Sie detailliertes Feedback zu Ihrer Leistung.
                </p>
                <div className="flex justify-end">
                  <Link href="/vertraege">
                    <Button variant="primary">
                      <span className="mr-1">Verträge anzeigen</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card
                title="Analyse & Feedback"
                className="hover:shadow-lg transition-shadow"
              >
                <p className="text-gray-600 mb-4">
                  Erhalten Sie detailliertes Feedback zu Ihren Verhandlungsstrategien, 
                  identifizieren Sie Stärken und verbessern Sie Ihre Verhandlungstaktiken.
                </p>
                <div className="flex justify-end">
                  <Link href="/feedback">
                    <Button variant="primary">
                      <span className="mr-1">Zum Feedback</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
} 