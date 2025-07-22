import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import {
  Search,
  Settings,
  Bell,
  Filter,
  TrendingUp,
  Users,
  Building,
  Globe,
  RefreshCw,
  ChevronDown,
  Lock,
  ArrowUp,
  X,
} from "lucide-react";
import { useJobData } from "../hooks/use-job-data";
import { ChatBot } from "../components/ChatBot";
import type { FamilyDistribution, SalaryPosition } from "../../shared/types";

// Varsayılan family distribution verileri (Supabase bağlantısı yoksa kullanılacak)
const defaultFamilyData = [
  {
    family: "Corporate Banking",
    positions: 3,
    percentage: 25.0,
    fill: "var(--color-corporateBanking)",
  },
  {
    family: "Individual Banking Marketing",
    positions: 2,
    percentage: 20.0,
    fill: "var(--color-individualBanking)",
  },
  {
    family: "Treasury",
    positions: 2,
    percentage: 20.0,
    fill: "var(--color-treasury)",
  },
  {
    family: "Operations",
    positions: 2,
    percentage: 20.0,
    fill: "var(--color-operations)",
  },
  {
    family: "Other",
    positions: 1,
    percentage: 15.0,
    fill: "var(--color-other)",
  },
];

const familyChartConfig = {
  positions: {
    label: "Positions",
  },
  corporateBanking: {
    label: "Corporate Banking",
    color: "#9AC4FD",
  },
  individualBanking: {
    label: "Individual Banking Marketing",
    color: "#223BB1",
  },
  treasury: {
    label: "Treasury",
    color: "#2346DD",
  },
  operations: {
    label: "Operations",
    color: "#2D5CF2",
  },
  other: {
    label: "Other",
    color: "#3E6DEA",
  },
} satisfies ChartConfig;

export default function Index() {
  console.log('Index bileşeni render ediliyor...');
  
  // JOB_E tablosundan verileri çekme
  const { 
    familyDistributionData, 
    salaryPositionsData, 
    countryDistributionData,
    loading: jobDataLoading, 
    error: jobDataError,
    data: rawJobData,
    columns
  } = useJobData();
  
  // Arama ve filtreleme state'leri
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFamilies, setSelectedFamilies] = React.useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([]);
  const [filteredData, setFilteredData] = React.useState<any[]>([]);
  
  console.log('JOB_E verileri:', rawJobData?.length, 'kayıt');
  console.log('Tablo sütunları:', columns);
  console.log('Family Distribution:', familyDistributionData?.length, 'kategori');
  console.log('Salary Positions:', salaryPositionsData?.length, 'pozisyon');
  
  // Filtreleme fonksiyonu
  const filterData = React.useCallback(() => {
    if (!rawJobData || rawJobData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = rawJobData;

    // Arama filtresi
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => {
        const jobName = (job['Job'] || job['Job Code'] || '').toLowerCase();
        const family = (job['FAMILY'] || job['Family'] || job['family'] || job['JOB_FAMILY'] || job['DEPARTMENT'] || job['Department'] || job['department'] || '').toLowerCase();
        const level = (job['Level'] || job['PC'] || '').toLowerCase();
        const country = (job['Country'] || job['COUNTRY'] || job['country'] || '').toLowerCase();
        return jobName.includes(searchLower) || 
               family.includes(searchLower) || 
               level.includes(searchLower) ||
               country.includes(searchLower);
      });
    }

    // Aile filtresi
    if (selectedFamilies.length > 0) {
      filtered = filtered.filter(job => {
        const jobFamily = job['FAMILY'] || job['Family'] || job['family'] || job['JOB_FAMILY'] || job['DEPARTMENT'] || job['Department'] || job['department'] || '';
        return selectedFamilies.includes(jobFamily);
      });
    }

    // Seviye filtresi
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(job => {
        const jobLevel = job['Level'] || job['PC'] || '';
        return selectedLevels.includes(jobLevel);
      });
    }

    // Ülke filtresi
    if (selectedCountries.length > 0) {
      filtered = filtered.filter(job => {
        const jobCountry = job['Country'] || job['COUNTRY'] || job['country'] || '';
        return selectedCountries.includes(jobCountry);
      });
    }

    setFilteredData(filtered);
  }, [rawJobData, searchTerm, selectedFamilies, selectedLevels, selectedCountries]);

  // Filtreleme fonksiyonunu çalıştır
  React.useEffect(() => {
    filterData();
  }, [filterData]);

  // Benzersiz değerleri al
  const uniqueFamilies = React.useMemo(() => {
    if (!rawJobData) return [];
    const families = rawJobData.map(job => 
      job['FAMILY'] || job['Family'] || job['family'] || job['JOB_FAMILY'] || job['DEPARTMENT'] || job['Department'] || job['department'] || ''
    ).filter(Boolean);
    return [...new Set(families)].sort();
  }, [rawJobData]);

  const uniqueLevels = React.useMemo(() => {
    if (!rawJobData) return [];
    const levels = rawJobData.map(job => 
      job['Level'] || job['PC'] || ''
    ).filter(Boolean);
    return [...new Set(levels)].sort();
  }, [rawJobData]);

  const uniqueCountries = React.useMemo(() => {
    if (!rawJobData) return [];
    const countries = rawJobData.map(job => 
      job['Country'] || job['COUNTRY'] || job['country'] || ''
    ).filter(Boolean);
    return [...new Set(countries)].sort();
  }, [rawJobData]);

  // Filtreleri temizle
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFamilies([]);
    setSelectedLevels([]);
    setSelectedCountries([]);
  };

  // Filtreleme sonuçlarını hesapla
  const filteredFamilyData = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const familyGroups: Record<string, number> = {};
    filteredData.forEach(job => {
      const family = job['FAMILY'] || job['Family'] || job['family'] || job['JOB_FAMILY'] || job['DEPARTMENT'] || job['Department'] || job['department'] || 'Diğer';
      familyGroups[family] = (familyGroups[family] || 0) + 1;
    });

    const totalCount = Object.values(familyGroups).reduce((sum, count) => sum + count, 0);
    const colors = ['#9AC4FD', '#223BB1', '#2346DD', '#2D5CF2', '#3E6DEA', '#5E8DF7', '#7EADF8', '#9ECDF9', '#B1D4FA'];
    
    return Object.entries(familyGroups)
      .map(([family, count]) => ({
        family,
        positions: count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        fill: colors[Object.keys(familyGroups).indexOf(family) % colors.length]
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [filteredData]);

  // Family Distribution card için özel gösterim (top 5 + Other)
  const familyDistributionDisplay = React.useMemo(() => {
    if (!filteredFamilyData || filteredFamilyData.length === 0) return [];
    
    const top5Families = filteredFamilyData.slice(0, 5);
    const otherFamilies = filteredFamilyData.slice(5);
    
    const result = [...top5Families];
    
    if (otherFamilies.length > 0) {
      const otherPositions = otherFamilies.reduce((sum, family) => sum + family.positions, 0);
      const otherPercentage = otherFamilies.reduce((sum, family) => sum + family.percentage, 0);
      
      result.push({
        family: 'Other',
        positions: otherPositions,
        percentage: otherPercentage,
        fill: '#9ECDF9'
      });
    }
    
    return result;
  }, [filteredFamilyData]);

  const filteredSalaryData = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    return filteredData
      .filter(job => {
        const salary = job['Base Salary-Average'] || job['Base Salary-Median'];
        return salary !== undefined && salary !== null && !isNaN(Number(salary));
      })
      .sort((a, b) => {
        const salaryA = Number(a['Base Salary-Average'] || a['Base Salary-Median']) || 0;
        const salaryB = Number(b['Base Salary-Average'] || b['Base Salary-Median']) || 0;
        return salaryB - salaryA;
      })
      .slice(0, 10)
      .map(job => {
        const position = job['Job'] || job['Job Code'] || 'Bilinmeyen Pozisyon';
        const salary = Number(job['Base Salary-Average'] || job['Base Salary-Median']) || 0;
        const level = job['Level'] || job['PC'] || 'Belirtilmemiş';
        
        return {
          position,
          shortName: position.length > 10 ? position.substring(0, 10) + '...' : position,
          salary,
          level,
        };
      });
  }, [filteredData]);
  
  const [activeFamily, setActiveFamily] = React.useState<string | null>(null);

  // Sayfalama state'leri
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 20;

  // Mevcut sayfadaki verileri hesapla
  const currentTableData = React.useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return filteredData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData]);

  // Toplam sayfa sayısını hesapla
  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData]);

  // Sayfa değiştirme fonksiyonu
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Family Distribution Dialog State
  const [showFamilyDialog, setShowFamilyDialog] = React.useState(false);

  const [hoveredCountry, setHoveredCountry] = React.useState<string | null>(null);

  const countryCounts = React.useMemo(() => {
    if (!rawJobData) return {};
    const counts: Record<string, number> = {};
    rawJobData.forEach(job => {
      const country = (job['Country'] || job['COUNTRY'] || job['country'] || '').toLowerCase();
      if (!country) return;
      if (country.includes('switz')) counts['ch'] = (counts['ch'] || 0) + 1;
      else if (country.includes('germ')) counts['de'] = (counts['de'] || 0) + 1;
      else if (country.includes('pol')) counts['pl'] = (counts['pl'] || 0) + 1;
      // Diğer ülkeler eklenebilir
    });
    return counts;
  }, [rawJobData]);

  // Benzersiz job sayısını hesapla (filtreli veya tüm veri)
  const uniqueJobCount = React.useMemo(() => {
    const dataSource = filteredData && filteredData.length > 0 ? filteredData : rawJobData;
    if (!dataSource) return 0;
    const jobs = dataSource.map(job => job['Job'] || job['Job Code'] || '').filter(Boolean);
    return new Set(jobs).size;
  }, [filteredData, rawJobData]);

  // Barlar için veri oluşturulurken 2 adet dummy sütun ekle
  interface CountryBarDatum {
    code: string;
    label: string;
    flag: string;
    value: number;
    isDummy?: boolean;
  }
  const countryBarData: CountryBarDatum[] = React.useMemo(() => {
    const counts: Record<string, { label: string; flag: string; value: number }> = {};
    filteredData.forEach(job => {
      const country = (job['Country'] || job['COUNTRY'] || job['country'] || '').toLowerCase();
      if (!country) return;
      if (country.includes('switz')) counts['ch'] = { label: 'Switzerland', flag: '/images/flags/ch.png', value: (counts['ch']?.value || 0) + 1 };
      else if (country.includes('germ')) counts['de'] = { label: 'Germany', flag: '/images/flags/de.png', value: (counts['de']?.value || 0) + 1 };
      else if (country.includes('pol')) counts['pl'] = { label: 'Poland', flag: '/images/flags/pl.png', value: (counts['pl']?.value || 0) + 1 };
    });
    const arr: CountryBarDatum[] = Object.entries(counts).map(([code, { label, flag, value }]) => ({ code, label, flag, value }));
    // 2 adet boş dummy sütun ekle
    arr.push(
      { code: 'dummy1', label: '', flag: '', value: 0, isDummy: true },
      { code: 'dummy2', label: '', flag: '', value: 0, isDummy: true }
    );
    return arr;
  }, [filteredData]);

  // Barlar için tooltip state'i
  const [hoveredBarData, setHoveredBarData] = React.useState<{ code: string; value: number } | null>(null);

  return (
    <div className="min-h-screen bg-ipe-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/4c9f2534c00084b8a083f342a18b3c4518b8fab0?width=332"
              alt="Mercer Logo"
              className="h-10 w-auto"
            />
            <div className="h-20 w-px bg-gray-200"></div>
            <div>
              <h1 className="text-2xl font-bold text-ipe-dark">
                IPE Analytics
              </h1>
              <p className="text-gray-400 text-sm">
                Explore salary data across 653 positions and organizations
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-ipe-light"
            >
              <Settings className="w-5 h-5 text-ipe-gray" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-ipe-light relative"
            >
              <Bell className="w-5 h-5 text-ipe-red" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-ipe-red rounded-full"></div>
            </Button>
            <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/3c95a60facdb3757ae0e7c284b8ebaaba6c7788f?width=206"
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Redesigned Search Bar */}
      <div className="h-12" /> {/* Alt bar için boşluk bırak */}
      {/* Gölge efekti: tam sayfa genişliğinde ve search bar yüksekliğinde */}
      <img
        src="/images/Frame-3.png"
        alt="Searchbar Shadow"
        className="fixed left-0 right-0 bottom-0 w-full h-40 object-cover z-40 pointer-events-none"
        style={{ width: '100vw', minWidth: '100vw', maxWidth: '100vw', left: 0, right: 0 }}
      />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex justify-center pointer-events-none w-full px-4 sm:px-6 md:px-8" style={{maxWidth: 1750, bottom: '20px', position: 'fixed'}}>
        <div data-layer="Bg" className="Bg pointer-events-auto flex-col w-full" style={{background: 'white', boxShadow: '6px 6px 54px rgba(0, 0, 0, 0.05)', borderRadius: 14}}>
          {/* Search bar ve filtreler burada */}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full px-6 py-4 gap-3 lg:gap-0">
            {/* Search Input - Responsive Width */}
            <div className="relative w-full lg:flex-1 lg:mr-3 order-1 lg:order-none">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search jobs, families or functions"
                className="pl-12 pr-10 py-2 border border-gray-200 bg-white rounded-full text-sm h-11 w-full focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Filter Buttons - Responsive Layout */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3 w-full lg:w-auto lg:flex-shrink-0 order-2 lg:order-none">
              {/* Family Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="flex items-center space-x-1 lg:space-x-2 bg-white border border-gray-200 rounded-full px-2 lg:px-4 h-11 hover:bg-gray-50 text-xs lg:text-sm flex-1 lg:flex-none min-w-0"
                  >
                    <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-700 truncate">
                      {selectedFamilies.length > 0 
                        ? `${selectedFamilies.length} Family` 
                        : "Families"
                      }
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Select Families</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[200px]">
                    {uniqueFamilies.map((family) => (
                      <DropdownMenuCheckboxItem
                        key={family}
                        checked={selectedFamilies.includes(family)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFamilies([...selectedFamilies, family]);
                          } else {
                            setSelectedFamilies(selectedFamilies.filter(f => f !== family));
                          }
                        }}
                      >
                        {family}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Level Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="flex items-center space-x-1 lg:space-x-2 bg-white border border-gray-200 rounded-full px-2 lg:px-4 h-11 hover:bg-gray-50 text-xs lg:text-sm flex-1 lg:flex-none min-w-0"
                  >
                    <span className="text-gray-700 truncate">
                      {selectedLevels.length > 0 
                        ? `${selectedLevels.length} Level` 
                        : "Levels"
                      }
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Select Levels</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[200px]">
                    {uniqueLevels.map((level) => (
                      <DropdownMenuCheckboxItem
                        key={level}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLevels([...selectedLevels, level]);
                          } else {
                            setSelectedLevels(selectedLevels.filter(l => l !== level));
                          }
                        }}
                      >
                        {level}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Country Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="flex items-center space-x-1 lg:space-x-2 bg-white border border-gray-200 rounded-full px-2 lg:px-4 h-11 hover:bg-gray-50 text-xs lg:text-sm flex-1 lg:flex-none min-w-0"
                  >
                    <span className="text-gray-700 truncate">
                      {selectedCountries.length > 0 
                        ? `${selectedCountries.length} Country` 
                        : "Countries"
                      }
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Select Countries</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[200px]">
                    {uniqueCountries.map((country) => (
                      <DropdownMenuCheckboxItem
                        key={country}
                        checked={selectedCountries.includes(country)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCountries([...selectedCountries, country]);
                          } else {
                            setSelectedCountries(selectedCountries.filter(c => c !== country));
                          }
                        }}
                      >
                        {country}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reset Filter Button */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 lg:space-x-2 text-red-500 hover:text-red-600 hover:bg-red-50 px-2 lg:px-3 h-11 text-xs lg:text-sm flex-shrink-0"
                onClick={clearFilters}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>

          {/* Etiketler barın tabanında */}  
          {(searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0) && (
            <div className="flex flex-wrap gap-2 px-6 py-3 border-t border-gray-100">
              {searchTerm && (
                <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                  <span>Search: "{searchTerm}"</span>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {selectedFamilies.map((family) => (
                <div key={family} className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm">
                  <span>Family: {family}</span>
                  <button 
                    onClick={() => setSelectedFamilies(selectedFamilies.filter(f => f !== family))}
                    className="ml-1 hover:bg-green-100 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {selectedLevels.map((level) => (
                <div key={level} className="flex items-center space-x-1 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm">
                  <span>Level: {level}</span>
                  <button 
                    onClick={() => setSelectedLevels(selectedLevels.filter(l => l !== level))}
                    className="ml-1 hover:bg-purple-100 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {selectedCountries.map((country) => (
                <div key={country} className="flex items-center space-x-1 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-sm">
                  <span>Country: {country}</span>
                  <button 
                    onClick={() => setSelectedCountries(selectedCountries.filter(c => c !== country))}
                    className="ml-1 hover:bg-yellow-100 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Grid with Visual Graphics */}
      <div className="px-8 pb-6" style={{maxWidth: 1750, margin: '0 auto'}}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Unique Jobs */}
          <Card className="shadow-md border-0 overflow-hidden relative h-[250px]">
            <div className="absolute inset-0 opacity-75">
              <img
                src="/images/bg-1_optimized.png"
                alt="Organizations involved illustration"
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Unique Jobs</p>
                  <p className="text-3xl font-bold text-ipe-dark">
                    {uniqueJobCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100/50 backdrop-blur-sm flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Global Presence */}
          <Card className="shadow-md border-0 overflow-hidden relative bg-white h-[250px]">
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Global Presence</p>
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    3 <span className="ml-1">countries</span>
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              
              {/* Country Charts */}
              <div className="flex items-start justify-between space-x-2 mt-4">
                {countryBarData.map((bar, idx) => (
                  <div 
                    key={bar.code} 
                    className="flex flex-col items-center relative"
                    onMouseEnter={() => !bar.isDummy && setHoveredBarData({ code: bar.code, value: bar.value })}
                    onMouseLeave={() => setHoveredBarData(null)}
                  >
                    <div className={`relative h-16 w-12 flex items-end justify-center mb-2`}>
                      {/* Tooltip */}
                      {hoveredBarData && hoveredBarData.code === bar.code && !bar.isDummy && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white shadow-md rounded-md px-3 py-2 text-xs z-10 whitespace-nowrap">
                          <div className="font-semibold">{bar.label}</div>
                          <div className="text-center">Positions: {bar.value}</div>
                        </div>
                      )}
                      <div
                        className={`w-full ${bar.isDummy ? 'bg-gray-200' : 'bg-gradient-to-b from-blue-400 to-blue-600'} rounded-2xl`}
                        style={{ height: bar.isDummy ? '50%' : `${Math.max(60, Math.min(100, (bar.value / Math.max(...countryBarData.filter(b => !b.isDummy).map(b => b.value), 1)) * 100))}%` }}
                      ></div>
                    </div>
                    {/* Bayrak veya boş alan */}
                    <div className="flex items-center justify-center w-6 h-4">
                      {!bar.isDummy && bar.flag && (
                        <img src={bar.flag} alt={bar.label} className="w-6 h-4 object-contain rounded" />
                      )}
                      {bar.isDummy && (
                        <span className="text-gray-400">--</span>
                      )}
                    </div>
                    {/* Alt metin */}
                    <div className="text-sm text-center" style={{ color: bar.isDummy ? '#9ca3af' : '#374151' }}>
                      {bar.isDummy ? '' : bar.label && ''}
                    </div>
                    <div className="text-sm font-semibold text-center" style={{ color: bar.isDummy ? '#9ca3af' : '#374151' }}>
                      {bar.isDummy ? '0%' : `${Math.round((bar.value / (filteredData.length || 1)) * 100)}%`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total Positions */}
          <Card className="shadow-md border-0 overflow-hidden relative h-[250px]">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Filtered Positions</p>
                  <p className="text-3xl font-bold text-ipe-dark">
                    {filteredData.length > 0 ? filteredData.length : rawJobData?.length || 0}
                  </p>
                  {filteredData.length > 0 && rawJobData && (
                    <p className="text-xs text-gray-500">
                      of {rawJobData.length} total positions
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-ipe-orange" />
                </div>
              </div>
              {/* Wavy Chart */}
              <div className="relative h-16 mt-4">
                <svg
                  className="w-full h-full absolute bottom-0"
                  viewBox="0 0 200 60"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="orangeGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
                      <stop
                        offset="100%"
                        stopColor="#F97316"
                        stopOpacity="0.05"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,35 Q50,15 100,25 T200,20 L200,60 L0,60 Z"
                    fill="url(#orangeGradient)"
                  />
                  <path
                    d="M0,35 Q50,15 100,25 T200,20"
                    stroke="#F97316"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Organizations */}
          <Card className="shadow-md border-0 overflow-hidden relative h-[250px]">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Unique Families</p>
                  <p className="text-3xl font-bold text-ipe-dark">
                    {filteredFamilyData.length > 0 ? filteredFamilyData.length : familyDistributionData?.length || 0}
                  </p>
                  {filteredData.length > 0 && (
                    <p className="text-xs text-gray-500">
                      in filtered results
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-ipe-yellow" />
                </div>
              </div>
              {/* Bar Chart */}
              <div className="flex items-end justify-between h-16 mt-4 space-x-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-ipe-yellow rounded-sm flex-1"
                    style={{
                      height: `${[60, 80, 45, 70, 90, 35, 55][i]}%`,
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Number of Positions Family */}
      <div className="px-8 pb-8" style={{maxWidth: 1750, margin: '0 auto'}}>
        <h2 className="text-3xl font-bold text-ipe-dark mb-8">
          Number of Positions Family
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {(filteredFamilyData.length > 0 ? filteredFamilyData : familyDistributionData).slice(0, 12).map((family, index) => (
            <Card
              key={index}
              className="shadow-md hover:shadow-lg transition-shadow relative cursor-pointer"
              onClick={() => {
                setActiveFamily(family.family);
                setShowFamilyDialog(true);
              }}
            >
              <CardContent className="p-4 text-center">
                {/* Percentage Badge */}
                <div className="absolute top-2 right-2 text-ipe-blue font-bold text-sm">
                  %{family.percentage}
                </div>

                {/* Circular Progress Chart */}
                <div className="relative mb-3 flex justify-center">
                  <div className="relative w-16 h-16">
                    {/* Background Circle */}
                    <svg
                      className="w-16 h-16 transform -rotate-90"
                      viewBox="0 0 64 64"
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                      />
                      {/* Progress Circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#3E6DEA"
                        strokeWidth="4"
                        strokeDasharray={`${(family.percentage / 100) * 175.93} 175.93`}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Icon in Center */}
                    <div className="absolute inset-0 flex items-center justify-center text-xl">
                      {(() => {
                        const lowerName = family.family.toLowerCase();
                        if (lowerName.includes('corporate') || lowerName.includes('banking')) return '🏛️';
                        if (lowerName.includes('treasury')) return '💰';
                        if (lowerName.includes('credit')) return '💳';
                        if (lowerName.includes('operation')) return '⚙️';
                        if (lowerName.includes('marketing')) return '📊';
                        if (lowerName.includes('individual')) return '👤';
                        if (lowerName.includes('risk')) return '⚠️';
                        if (lowerName.includes('finance')) return '📈';
                        if (lowerName.includes('human') || lowerName.includes('hr')) return '👥';
                        if (lowerName.includes('tech') || lowerName.includes('it')) return '💻';
                        return '⭐';
                      })()}
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-ipe-dark text-sm mb-1">
                  {family.family}
                </h4>
                <p className="text-xs text-gray-500">{family.positions} positions ({family.percentage}%)</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Family Details Dialog */}
        <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Family Distribution Details</DialogTitle>
              <DialogDescription>
                Comprehensive overview of all job families and their key metrics
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-12 gap-6 mt-4">
              {/* Left Side - Family List */}
              <div className="col-span-5 bg-gray-50 rounded-lg p-4">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2 pr-4">
                    {/* Tüm family'leri göster, sadece filtrelenmiş olanları değil */}
                    {(filteredFamilyData.length > 0 ? filteredFamilyData : familyDistributionData || defaultFamilyData).map((family, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          activeFamily === family.family
                            ? "bg-white shadow-md"
                            : "hover:bg-white hover:shadow-sm"
                        }`}
                        onClick={() => setActiveFamily(family.family)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: family.fill }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {family.family}
                            </h4>
                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-gray-500">
                                {family.positions} positions
                              </span>
                              <span className="font-medium text-blue-600">
                                {family.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${family.percentage}%`,
                              backgroundColor: family.fill,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar />
                </ScrollArea>
              </div>

              {/* Right Side - Selected Family Details */}
              <div className="col-span-7">
                {activeFamily ? (
                  <ScrollArea className="h-[60vh]">
                    <div className="p-6 bg-white rounded-lg">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {activeFamily}
                        </h3>
                        <p className="text-gray-500">
                          Detailed metrics and insights for the selected job family
                        </p>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {[
                          {
                            label: "Total Positions",
                            value: (filteredFamilyData.length > 0 ? filteredFamilyData : familyDistributionData || defaultFamilyData).find(
                              (f) => f.family === activeFamily
                            )?.positions,
                            icon: "👥",
                          },
                          {
                            label: "Market Share",
                            value: (filteredFamilyData.length > 0 ? filteredFamilyData : familyDistributionData || defaultFamilyData).find(
                              (f) => f.family === activeFamily
                            )?.percentage + "%",
                            icon: "📊",
                          },
                          {
                            label: "Avg. Salary",
                            value: "$85,000",
                            icon: "💰",
                          },
                          {
                            label: "Growth Rate",
                            value: "+12%",
                            icon: "📈",
                          },
                        ].map((metric, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{metric.icon}</span>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {metric.label}
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  {metric.value}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Top Positions */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Top Positions
                        </h4>
                        <div className="space-y-2">
                          {filteredData
                            .filter(
                              (job) =>
                                (job["FAMILY"] ||
                                  job["Family"] ||
                                  job["family"] ||
                                  job["JOB_FAMILY"] ||
                                  job["DEPARTMENT"] ||
                                  job["Department"] ||
                                  job["department"]) === activeFamily
                            )
                            .slice(0, 5)
                            .map((job, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-white p-3 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {job["Job"] || job["Job Code"]}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Level: {job["Level"] || job["PC"]}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-blue-600">
                                    ${Number(
                                      job["Base Salary-Average"] ||
                                        job["Base Salary-Median"]
                                    ).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {job["Cases"] || 1} cases
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Additional Position Details */}
                      <div className="bg-gray-50 rounded-lg p-4 mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Branch / Regional Operations
                        </h4>
                        <div className="space-y-4">
                          {/* Team Leader */}
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">Branch / Regional Operations</p>
                                <p className="text-sm text-gray-500">Level: Team Leader</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-blue-600">$177,273</p>
                                <p className="text-xs text-gray-500">1 cases</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Manager */}
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">Banking Operations</p>
                                <p className="text-sm text-gray-500">Level: Manager</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-blue-600">$466,883</p>
                                <p className="text-xs text-gray-500">1 cases</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Team Member */}
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">Branch / Regional Operations</p>
                                <p className="text-sm text-gray-500">Level: Team Member</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-blue-600">$43,134</p>
                                <p className="text-xs text-gray-500">1 cases</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <ScrollBar />
                  </ScrollArea>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a family to view detailed information
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

            {/* Overview Section */}
      <div className="px-8 pb-8" style={{maxWidth: 1750, margin: '0 auto'}}>
        <h2 className="text-3xl font-bold text-ipe-dark mb-8">Overview</h2>

        {/* Layout Grid for Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column - Top 10 Highest Paying Positions */}
          <div className="lg:col-span-7">
            {/* Top 10 Highest Paying Positions */}
            <Card className="border bg-white text-gray-900 relative overflow-hidden shadow-lg rounded-2xl h-full">
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Top 10 Highest Paying Positions
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Based on actual total compensation
                    </p>
                  </div>
                  {searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 ? null : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pb-6">
                {jobDataLoading ? (
                  <div className="flex justify-center items-center h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                ) : jobDataError ? (
                  <div className="text-gray-600 text-center py-4">
                    Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
                  </div>
                ) : searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0 ? (
                  <ChartContainer
                    config={{
                      salary: {
                        label: "Total Compensation",
                        color: "#3B82F6",
                      },
                    }}
                    className="h-[400px] w-full"
                  >
                    <BarChart
                      data={filteredSalaryData}
                      margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis
                        dataKey="position"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fill: '#374151', fontSize: 14, fontWeight: 600 }}
                        tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                        axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                        tick={{ fill: '#374151', fontSize: 12 }}
                        tickLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                        axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                      />
                      <ChartTooltip
                        cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border">
                                <p className="text-gray-900 font-medium mb-1">{payload[0].payload.position}</p>
                                <p className="text-gray-600">Level: {payload[0].payload.level}</p>
                                <p className="text-blue-600 font-bold">${Number(payload[0].value).toLocaleString()}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="salary"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      >
                        {filteredSalaryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? "#3B82F6" : "#E5E7EB"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                    <Lock className="w-16 h-16 mb-4" />
                    <p className="text-center">Search or apply filters to view salary information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Salary Stats */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-1 gap-4 h-full">
              {/* Average Salary */}
              <Card className="shadow-md border-0 overflow-hidden relative">
                <CardContent className="p-4 relative h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Average Salary</p>
                      {(searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0) && filteredData.length > 0 ? (
                        <p className="text-3xl font-bold text-ipe-dark">
                          {(() => {
                            const salaries = filteredData
                              .map(job => Number(job['Base Salary-Average'] || job['Base Salary-Median']))
                              .filter(salary => !isNaN(salary));
                            const average = salaries.length > 0
                              ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
                              : 0;
                            return `$${average.toLocaleString()}`;
                          })()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Search to view average salary.
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      {(searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0) && filteredData.length > 0 ? (
                        <TrendingUp className="w-5 h-5 text-ipe-purple" />
                      ) : (
                        <Lock className="w-5 h-5 text-ipe-purple" />
                      )}
                    </div>
                  </div>
                  {/* Wavy Chart */}
                  <div className="absolute bottom-0 left-0 right-0 h-25">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 200 60"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="purpleGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                          <stop
                            offset="100%"
                            stopColor="#8B5CF6"
                            stopOpacity="0.05"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,45 Q50,25 100,35 T200,30 L200,60 L0,60 Z"
                        fill="url(#purpleGradient)"
                      />
                      <path
                        d="M0,45 Q50,25 100,35 T200,30"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              {/* Highest Salary */}
              <Card className="shadow-md border-0 overflow-hidden relative">
                <CardContent className="p-4 relative h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Highest Salary</p>
                      {(searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0) && filteredData.length > 0 ? (
                        <p className="text-3xl font-bold text-ipe-dark">
                          {(() => {
                            const salaries = filteredData
                              .map(job => Number(job['Base Salary-Average'] || job['Base Salary-Median']))
                              .filter(salary => !isNaN(salary));
                            const highest = salaries.length > 0
                              ? Math.max(...salaries)
                              : 0;
                            return `$${highest.toLocaleString()}`;
                          })()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Search to view highest salary.
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      {(searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0) && filteredData.length > 0 ? (
                        <ArrowUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                  {/* Wavy Chart */}
                  <div className="absolute bottom-0 left-0 right-0 h-40">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 200 60"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="greenGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                          <stop
                            offset="100%"
                            stopColor="#10B981"
                            stopOpacity="0.05"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,35 C30,25 50,40 80,30 S120,15 160,30 S190,45 200,30 L200,60 L0,60 Z"
                        fill="url(#greenGradient)"
                      />
                      <path
                        d="M0,35 C30,25 50,40 80,30 S120,15 160,30 S190,45 200,30"
                        stroke="#10B981"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="px-8 pb-48" style={{maxWidth: 1750, margin: '0 auto'}}>
        <h2 className="text-3xl font-bold text-ipe-dark mb-8">Data Table</h2>
        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <div className="grid gap-4 text-sm font-bold text-gray-700 uppercase tracking-wide" style={{gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 0.5fr'}}>
              <div>JOB</div>
              <div>FAMILY</div>
              <div>LEVEL</div>
              <div>COUNTRY</div>
              <div className="text-center">BASE SALARY</div>
              <div className="text-center">TOTAL COMP</div>
              <div className="text-right">CASES</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {rawJobData && rawJobData.length > 0 
                  ? "No results found for the current filters. Try adjusting your search criteria."
                  : "No data available."
                }
              </div>
            ) : (
              currentTableData.map((job, i) => (
                <div
                  key={i}
                  className={`grid gap-4 p-4 text-sm border-b hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-25" : ""}`}
                  style={{gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 0.5fr'}}
                >
                  <div className="text-gray-900 font-medium">
                    {job['Job'] || job['Job Code'] || 'N/A'}
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-md text-xs font-medium">
                      {job['FAMILY'] || job['Family'] || job['family'] || job['JOB_FAMILY'] || job['DEPARTMENT'] || job['Department'] || job['department'] || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-md text-xs font-medium">
                      {job['Level'] || job['PC'] || 'N/A'}
                    </span>
                  </div>
                  {/* Country Sütunu */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const country = job['Country'] || job['COUNTRY'] || job['country'] || '';
                      let flagCode = '';
                      if (country.toLowerCase().includes('switz')) flagCode = 'ch';
                      else if (country.toLowerCase().includes('germ')) flagCode = 'de';
                      else if (country.toLowerCase().includes('pol')) flagCode = 'pl';
                      // Gerekirse diğer ülkeler eklenebilir
                      if (flagCode) {
                        return <img src={`/images/flags/${flagCode}.png`} alt={country} className="w-6 h-4 object-contain mr-1" />;
                      }
                      return null;
                    })()}
                    <span className="text-xs text-gray-700">{job['Country'] || job['COUNTRY'] || job['country'] || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    {searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0 ? (
                      job['Base Salary-Average'] || job['Base Salary-Median'] ? (
                        <span className="text-gray-900 font-medium">
                          ${Number(job['Base Salary-Average'] || job['Base Salary-Median']).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {searchTerm || selectedFamilies.length > 0 || selectedLevels.length > 0 || selectedCountries.length > 0 ? (
                      <span className="text-gray-900 font-medium">
                        ${Number(job['Base Salary-Average'] || job['Base Salary-Median'] || 0).toLocaleString()}
                      </span>
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="text-right text-gray-900 font-semibold">
                    {job['Cases'] || '1'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
          {filteredData.length > 0 && (
            <div className="p-4 flex items-center justify-between border-t bg-gray-25">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pageNum => {
                    // İlk ve son sayfaları her zaman göster
                    if (pageNum === 1 || pageNum === totalPages) return true;
                    // Mevcut sayfanın etrafındaki 2 sayfayı göster
                    return Math.abs(pageNum - currentPage) <= 2;
                  })
                  .map((pageNum, i, arr) => {
                    // Eğer sayfa numaraları arasında boşluk varsa ... ekle
                    if (i > 0 && pageNum - arr[i - 1] > 1) {
                      return (
                        <React.Fragment key={`ellipsis-${pageNum}`}>
                          <span className="text-gray-400">...</span>
                          <Button
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="px-3"
                          >
                            {pageNum}
                          </Button>
                        </React.Fragment>
                      );
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="px-3"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* ChatBot Component */}
      <ChatBot />
    </div>
  );
}

interface StatCardProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon: React.ReactNode;
  iconBg: string;
  chartColor: string;
  showChart?: boolean;
}

function StatCard({
  title,
  subtitle,
  value,
  icon,
  iconBg,
  chartColor,
  showChart,
}: StatCardProps) {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-600 text-sm mb-1">{title}</p>
            {value && (
              <p className="text-3xl font-bold text-ipe-dark">{value}</p>
            )}
          </div>
          <div
            className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
        {subtitle && <p className="text-xs text-gray-500 mb-4">{subtitle}</p>}
        {showChart && (
          <div className="space-y-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-2 h-16 bg-gray-200 rounded-full mr-1">
                  <div
                    className="bg-ipe-yellow rounded-full"
                    style={{
                      height: `${Math.random() * 80 + 20}%`,
                      width: "100%",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <svg className="w-full h-16" viewBox="0 0 200 50">
            <path
              d="M0,40 Q50,10 100,25 T200,15"
              stroke={chartColor.replace("border-", "")}
              strokeWidth="2"
              fill="none"
            />
            <defs>
              <linearGradient
                id={`gradient-${title}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={chartColor.replace("border-", "")}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={chartColor.replace("border-", "")}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path
              d="M0,40 Q50,10 100,25 T200,15 L200,50 L0,50 Z"
              fill={`url(#gradient-${title})`}
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
