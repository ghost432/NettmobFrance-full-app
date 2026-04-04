import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

const TestConnection = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      console.log('🔍 Test de connexion...');
      const response = await api.get('/test-connection');
      console.log('✅ Réponse reçue:', response.data);
      setResult(response.data);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err.response?.data || { error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔍 Test de Connexion</CardTitle>
            <CardDescription>
              Vérifier que le frontend communique avec le backend et la base de données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testConnection} 
              disabled={testing}
              className="w-full"
            >
              {testing ? '⏳ Test en cours...' : '🚀 Lancer le test'}
            </Button>

            {error && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">❌ Erreur</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {result && (
              <div className="space-y-4">
                <Card className="border-green-500">
                  <CardHeader>
                    <CardTitle className="text-green-600">✅ Connexion réussie !</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{result.message}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📊 Base de données</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Connectée:</span>
                      <span className="text-green-600">
                        {result.database.connected ? '✅ Oui' : '❌ Non'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nom de la BD:</span>
                      <span className="font-mono text-sm">{result.database.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Heure serveur:</span>
                      <span className="text-sm">{new Date(result.database.serverTime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Test requête:</span>
                      <span className={result.database.testQuery === 'OK' ? 'text-green-600' : 'text-red-600'}>
                        {result.database.testQuery}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📋 Tables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Utilisateurs:</span>
                      <span className="font-bold">{result.tables.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Secteurs:</span>
                      <span className="font-bold">{result.tables.secteurs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Compétences:</span>
                      <span className="font-bold">{result.tables.competences}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⚙️ Environnement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Mode:</span>
                      <span className="font-mono text-sm">{result.environment.nodeEnv}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Port:</span>
                      <span className="font-mono text-sm">{result.environment.port}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📄 Réponse complète</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestConnection;
