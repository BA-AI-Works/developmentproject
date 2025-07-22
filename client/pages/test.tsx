import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testChatAPI = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: {
            totalJobs: 650,
            availableColumns: ['Job', 'Family', 'Level', 'Base Salary-Average'],
            familyDistribution: [],
            topSalaryPositions: [],
            sampleData: []
          },
        }),
      });

      const data = await res.json();
      setResponse(data.response || 'Yanıt alınamadı');
    } catch (error) {
      setResponse('Hata: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Sayfası</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ChatBot API Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Test mesajı girin..."
                className="flex-1"
              />
              <Button 
                onClick={testChatAPI}
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </div>
            
            {response && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">AI Yanıtı:</h4>
                <p className="whitespace-pre-wrap">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formatlanmış Cevap Örnekleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => setMessage("En yüksek maaşlı 5 pozisyonu listele")}>
                Liste Formatı Testi
              </Button>
              <Button onClick={() => setMessage("Maaş verilerini tablo halinde göster")}>
                Tablo Formatı Testi
              </Button>
              <Button onClick={() => setMessage("Aile dağılımı istatistiklerini ver")}>
                Chart Formatı Testi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 