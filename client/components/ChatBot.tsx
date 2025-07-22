import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, BarChart3, Table, List, FileText, MessageCircle } from "lucide-react";
import { useJobData } from "../hooks/use-job-data";

// Netlify function endpoint
const CHAT_API_ENDPOINT = import.meta.env.DEV 
  ? 'http://localhost:8888/.netlify/functions/chat'  // Development
  : '/.netlify/functions/chat';                      // Production

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  formattedContent?: {
    type: 'table' | 'list' | 'chart' | 'text';
    data?: any;
    title?: string;
  };
}

// Quick questions for the chatbot
const quickQuestions = [
  "What are the highest paying jobs?",
  "Show me average salaries by level",
  "Compare salaries across job families",
  "What's the salary range for managers?"
];

// AI cevabını formatlamak için yardımcı fonksiyon
const formatResponseContent = (text: string) => {
  // Markdown işaretlerini temizle
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold (**text**) işaretlerini kaldır
      .replace(/\*(.*?)\*/g, '$1')     // Italic (*text*) işaretlerini kaldır
      .replace(/^#{1,6}\s+/gm, '')     // Başlık (#, ##, ###) işaretlerini kaldır
      .replace(/^[-*]\s+/gm, '• ')     // Tire ve yıldız liste işaretlerini bullet pointe çevir
      .replace(/^(\d+)\.\s+/gm, '$1. '); // Numaralı liste formatını koru
  };

  // Başlıkları tespit et ve temizle
  const extractHeadings = (text: string) => {
    const headings: string[] = [];
    const cleanedText = text.replace(/^#{1,6}\s+(.*?)$/gm, (match, heading) => {
      headings.push(heading);
      return `<heading>${heading}</heading>`;
    });
    
    return { headings, cleanedText };
  };

  const { headings, cleanedText } = extractHeadings(text);
  const mainTitle = headings.length > 0 ? headings[0] : '';

  // Tablo verisi tespit etme
  if (cleanedText.includes('|') && cleanedText.split('\n').filter(line => line.includes('|')).length >= 3) {
    const lines = cleanedText.split('\n');
    const tableLines = lines.filter(line => line.includes('|'));
    const tableStartIndex = lines.findIndex(line => line.includes('|'));
    
    // Tablonun son satırını bul
    let tableEndIndex = tableStartIndex;
    for (let i = tableStartIndex + 1; i < lines.length; i++) {
      if (lines[i].includes('|')) {
        tableEndIndex = i;
      } else if (tableEndIndex !== tableStartIndex && !lines[i].trim()) {
        // Boş satır ve tablo satırı değilse tablo bitmiş demektir
        break;
      }
    }
    
    // Tablo öncesi ve sonrası metinleri ayır
    const introText = cleanMarkdown(lines.slice(0, tableStartIndex).join('\n').trim());
    const outroText = cleanMarkdown(lines.slice(tableEndIndex + 1).join('\n').trim());
    
    // Tablo verilerini işle
    const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
    const rows = tableLines.slice(2).map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell)
    );
    
    return {
      type: 'table' as const,
      data: { 
        headers, 
        rows,
        introText,
        outroText
      },
      title: mainTitle || 'Veri Tablosu'
    };
  }

  // Liste verisi tespit etme
  if (cleanedText.includes('•') || cleanedText.match(/^\d+\./m) || cleanedText.includes('-')) {
    // Liste başlangıç ve bitiş indekslerini bul
    const lines = cleanedText.split('\n');
    const listItemIndices = lines.map((line, index) => 
      line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim()) ? index : -1
    ).filter(index => index !== -1);
    
    if (listItemIndices.length >= 2) {
      const listStartIndex = listItemIndices[0];
      const listEndIndex = listItemIndices[listItemIndices.length - 1];
      
      // Liste öncesi ve sonrası metinleri ayır
      const introText = cleanMarkdown(lines.slice(0, listStartIndex).join('\n').trim());
      const outroText = cleanMarkdown(lines.slice(listEndIndex + 1).join('\n').trim());
      
      // Liste öğelerini işle ve markdown işaretlerini temizle
      const listItems = listItemIndices.map(index => {
        const item = lines[index].replace(/^[•\-]\s*/, '').trim();
        return cleanMarkdown(item);
      });
      
      return {
        type: 'list' as const,
        data: {
          items: listItems,
          introText,
          outroText
        },
        title: mainTitle || 'Summary List'
      };
    }
  }

  // Sayısal veri tespit etme (chart önerisi)
  if (cleanedText.match(/\$[\d,]+/g) || cleanedText.match(/\d+%/g) || cleanedText.match(/\d+\s*(pozisyon|iş|maaş)/gi)) {
    // Markdown işaretlerini temizle
    const cleanedData = cleanMarkdown(cleanedText);
    
    return {
      type: 'chart' as const,
      data: cleanedData,
      title: mainTitle || 'Veri Analizi'
    };
  }

  // Varsayılan metin formatı
  return {
    type: 'text' as const,
    data: cleanMarkdown(cleanedText),
    title: mainTitle || 'Analiz Sonucu'
  };
};

// Formatlanmış içeriği render etmek için bileşen
const FormattedContent = ({ content, originalText }: { content: any, originalText: string }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  // Başlık etiketlerini işle
  const processHeadings = (text: string) => {
    return text.replace(/<heading>(.*?)<\/heading>/g, (_, heading) => {
      return `<h3 class="font-semibold text-blue-700 mt-3 mb-2">${heading}</h3>`;
    });
  };

  // HTML içeriğini güvenli şekilde render et
  const renderHTML = (htmlContent: string) => {
    return { __html: processHeadings(htmlContent) };
  };

  if (showOriginal) {
    return (
      <div>
        <div className="mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowOriginal(false)}
            className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
          >
            <FileText className="w-3 h-3 mr-1" />
            See formatted view
          </Button>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{originalText}</div>
      </div>
    );
  }

  switch (content.type) {
    case 'table':
      return (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Table className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">{content.title}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowOriginal(true)}
              className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto"
            >
            </Button>
          </div>
          
          {/* Tablo öncesi açıklama metni */}
          {content.data.introText && content.data.introText !== content.title && (
            <div 
              className="text-sm leading-relaxed mb-3"
              dangerouslySetInnerHTML={renderHTML(content.data.introText.replace(/\n/g, '<br />'))}
            />
          )}
          
          {/* Tablo */}
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  {content.data.headers.map((header: string, i: number) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.data.rows.map((row: string[], i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                    {row.map((cell: string, j: number) => (
                      <td key={j} className="px-3 py-2 border-b text-gray-800">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Tablo sonrası açıklama metni */}
          {content.data.outroText && (
            <div 
              className="text-sm leading-relaxed mt-3 bg-blue-50 p-3 rounded-md border border-blue-100"
              dangerouslySetInnerHTML={renderHTML(content.data.outroText.replace(/\n/g, '<br />'))}
            />
          )}
        </div>
      );

    case 'list':
      return (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <List className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">{content.title}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowOriginal(true)}
              className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto"
            >
              Summary List
            </Button>
          </div>
          
          {/* Liste öncesi açıklama metni */}
          {content.data.introText && content.data.introText !== content.title && (
            <div 
              className="text-sm leading-relaxed mb-3"
              dangerouslySetInnerHTML={renderHTML(content.data.introText.replace(/\n/g, '<br />'))}
            />
          )}
          
          {/* Liste */}
          <ul className="space-y-2 mb-3">
            {content.data.items.map((item: string, i: number) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          
          {/* Liste sonrası açıklama metni */}
          {content.data.outroText && (
            <div 
              className="text-sm leading-relaxed mt-3 bg-blue-50 p-3 rounded-md border border-blue-100"
              dangerouslySetInnerHTML={renderHTML(content.data.outroText.replace(/\n/g, '<br />'))}
            />
          )}
        </div>
      );

    case 'chart':
      return (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">{content.title}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowOriginal(true)}
              className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto"
            >
              Summary List
            </Button>
          </div>
          <div 
            className="text-sm leading-relaxed bg-blue-50 p-3 rounded-md border border-blue-100"
            dangerouslySetInnerHTML={renderHTML(content.data.replace(/\n/g, '<br />'))}
          />
        </div>
      );

    default:
      return (
        <div>
          <div className="mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowOriginal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
            >
              <FileText className="w-3 h-3 mr-1" />
              Summary List
            </Button>
          </div>
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={renderHTML(content.data)}
          />
        </div>
      );
  }
};

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant for job compensation analysis. I can help you explore salary data, compare positions, and answer questions about compensation trends. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  const { data: jobData, familyDistributionData, salaryPositionsData } = useJobData();

  // Scroll position tracking removed - chatbot will stay fixed

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Environment variables kontrolü
      console.log('Client Environment check:', {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        supabaseUrlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
        supabaseKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
        mode: import.meta.env.MODE,
        isDev: import.meta.env.DEV
      });

      // Prepare context data for AI - TÜM VERİYİ GÖNDER
      const contextData = {
        totalJobs: jobData?.length || 0,
        familyDistribution: familyDistributionData || [],
        topSalaryPositions: salaryPositionsData || [],
        fullDataset: jobData || [], // TÜM VERİSETİ GÖNDER
        availableColumns: jobData && jobData.length > 0 ? Object.keys(jobData[0]) : [],
        
        // Seviye bazında analiz
        levelAnalysis: jobData ? {
          manager: jobData.filter(job => {
            const level = job['Level'] || '';
            const pc = job['PC'] || '';
            const levelStr = typeof level === 'string' ? level : String(level);
            const pcStr = typeof pc === 'string' ? pc : String(pc);
            return levelStr.toLowerCase().includes('manager') ||
                   pcStr.toLowerCase().includes('manager');
          }),
          director: jobData.filter(job => {
            const level = job['Level'] || '';
            const pc = job['PC'] || '';
            const levelStr = typeof level === 'string' ? level : String(level);
            const pcStr = typeof pc === 'string' ? pc : String(pc);
            return levelStr.toLowerCase().includes('director') ||
                   pcStr.toLowerCase().includes('director');
          }),
          teamLeader: jobData.filter(job => {
            const level = job['Level'] || '';
            const pc = job['PC'] || '';
            const levelStr = typeof level === 'string' ? level : String(level);
            const pcStr = typeof pc === 'string' ? pc : String(pc);
            return levelStr.toLowerCase().includes('leader') ||
                   pcStr.toLowerCase().includes('leader');
          }),
          teamMember: jobData.filter(job => {
            const level = job['Level'] || '';
            const pc = job['PC'] || '';
            const levelStr = typeof level === 'string' ? level : String(level);
            const pcStr = typeof pc === 'string' ? pc : String(pc);
            return levelStr.toLowerCase().includes('member') ||
                   pcStr.toLowerCase().includes('member');
          })
        } : {},
        
        // Aile bazında analiz
        familyAnalysis: jobData ? jobData.reduce((acc: any, job) => {
          const family = job['FAMILY'] || job['Family'] || job['family'] || 'Other';
          const familyStr = typeof family === 'string' ? family : String(family);
          if (!acc[familyStr]) acc[familyStr] = [];
          acc[familyStr].push(job);
          return acc;
        }, {}) : {},
        
        // Ülke bazında analiz
        countryAnalysis: jobData ? jobData.reduce((acc: any, job) => {
          const country = job['country'] || 'Unknown';
          const countryStr = typeof country === 'string' ? country : String(country);
          if (!acc[countryStr]) acc[countryStr] = [];
          acc[countryStr].push(job);
          return acc;
        }, {}) : {},
        
        allLevels: jobData ? [...new Set(jobData.map(job => {
          const level = job['Level'] || job['PC'] || 'Unknown';
          return typeof level === 'string' ? level : String(level);
        }))].filter(Boolean) : [],
        allFamilies: jobData ? [...new Set(jobData.map(job => {
          const family = job['FAMILY'] || job['Family'] || job['family'] || 'Unknown';
          return typeof family === 'string' ? family : String(family);
        }))].filter(Boolean) : [],
        allCountries: jobData ? [...new Set(jobData.map(job => {
          const country = job['country'] || 'Unknown';
          return typeof country === 'string' ? country : String(country);
        }))].filter(Boolean) : [],
        
        clientError: !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Missing Supabase environment variables' : null
      };

      // Log data being sent to API (for debugging)
      console.log('Sending data to API:', {
        messageLength: textToSend.length,
        contextDataSummary: {
          totalJobs: contextData.totalJobs,
          hasFamilyDistribution: contextData.familyDistribution.length > 0,
          hasTopSalaryPositions: contextData.topSalaryPositions.length > 0,
          fullDatasetCount: contextData.fullDataset.length,
          availableColumnsCount: contextData.availableColumns.length,
          managerDataCount: contextData.levelAnalysis?.manager?.length || 0,
          directorDataCount: contextData.levelAnalysis?.director?.length || 0,
          clientError: contextData.clientError
        }
      });

      console.log('Full context data being sent:', contextData);
      console.log('API endpoint:', CHAT_API_ENDPOINT);

      // Call Netlify function instead of direct OpenAI API
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          context: contextData,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.response || 'Sorry, I could not generate a response.';
      
      // Format the AI response
      const formattedContent = formatResponseContent(aiResponse);
      
      const aiMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        formattedContent,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Detaylı hata mesajı oluştur
      let errorMessage = "Sorry, I'm experiencing a technical issue right now.";
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = "Database connection failed. The system is trying to reconnect automatically. Please try your question again in a moment.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error occurred. Our technical team is working on it. Please try again later.";
        } else {
          errorMessage = `Technical issue: ${error.message}. Please try again or contact support.`;
        }
      }
      
      const errorMessageObj: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Chatbot position is now fixed
  const chatbotBottom = 24;

  return (
    <>
      {/* Floating ChatBot Icon */}
      <div
        className="fixed z-50"
        style={{
          right: "calc(max(24px, calc((100vw - 1750px) / 2 + 48px)))",
          bottom: "93px",
        }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 p-0 border-4 border-white overflow-hidden"
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </Button>
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div 
          ref={popupRef}
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md h-[600px] flex flex-col overflow-hidden"
          style={{
            right: "clamp(24px, calc((100vw - 1750px) / 2 + 128px), calc(100vw - 24px - 384px))", // Ekran sınırları içinde kalır
            bottom: "113px", // Search bar'ın 20px üverinde (93px + 20px)
            width: "384px"
          }}
        >
            {/* Header */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    AI Job Analyst
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ask me anything about job compensation data
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="ml-auto text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.isUser
                          ? "bg-blue-500 text-white"
                          : "bg-blue-100 text-gray-900"
                      }`}
                    >
                      {message.isUser ? (
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      ) : (
                        <div>
                          {message.formattedContent ? (
                            <FormattedContent 
                              content={message.formattedContent} 
                              originalText={message.text}
                            />
                          ) : (
                            <p className="text-sm leading-relaxed">{message.text}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Quick Questions - Only show if no conversation has started */}
                {messages.length === 1 && (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-gray-500">Quick questions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => sendMessage(question)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs p-3 rounded-lg text-left transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-blue-100 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about salaries, job levels..."
                  className="flex-1 border-gray-200 focus:border-blue-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-full"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
      )}
    </>
  );
} 