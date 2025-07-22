import { useState, useEffect } from 'react';
import { fetchJobEData } from '../../lib/supabase';
import React from 'react';

interface JobData {
  [key: string]: any;
}

export function useJobData() {
  console.log('useJobData hook başlatıldı');
  
  const [data, setData] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  console.log('useJobData state tanımlandı:', { dataLength: data.length, loading, error: !!error });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchJobEData();
        setData(result || []);
        
        // Sütun isimlerini belirle
        if (result && result.length > 0) {
          setColumns(Object.keys(result[0]));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Bilinmeyen bir hata oluştu'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Olası sütun adları (büyük-küçük harf duyarsız)
  const getColumnValue = (item: JobData, possibleNames: string[]) => {
    if (!item) return null;
    
    // Önce tam eşleşme ara
    for (const name of possibleNames) {
      if (item[name] !== undefined) return item[name];
    }
    
    // Büyük-küçük harf duyarsız ara
    const lowerCaseNames = possibleNames.map(n => n.toLowerCase());
    for (const key of Object.keys(item)) {
      if (lowerCaseNames.includes(key.toLowerCase())) {
        return item[key];
      }
    }
    
    return null;
  };

  // Aile dağılımı verilerini hesapla
  const familyDistributionData = () => {
    if (!data || data.length === 0) return [];

    // Aile bazında gruplandırma yap
    const familyGroups: Record<string, number> = {};
    
    data.forEach(job => {
      // FAMILY, Family, family, JOB_FAMILY, DEPARTMENT gibi sütunları ara
      const family = getColumnValue(job, ['FAMILY', 'Family', 'family', 'JOB_FAMILY', 'DEPARTMENT', 'Department', 'department']) || 'Diğer';
      familyGroups[family] = (familyGroups[family] || 0) + 1;
    });

    // Toplam kayıt sayısını hesapla
    const totalCount = Object.values(familyGroups).reduce((sum, count) => sum + count, 0);

    // Yüzdeleri hesaplayıp formatlı veri oluştur
    const colors = ['#9AC4FD', '#223BB1', '#2346DD', '#2D5CF2', '#3E6DEA', '#5E8DF7', '#7EADF8', '#9ECDF9'];
    
    const sortedFamilies = Object.entries(familyGroups)
      .map(([family, count]) => ({
        family,
        positions: count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // İlk 5 aileyi al ve diğerlerini "Other" olarak grupla
    const top5Families = sortedFamilies.slice(0, 5);
    const otherFamilies = sortedFamilies.slice(5);
    
    const result = [...top5Families];
    
    if (otherFamilies.length > 0) {
      const otherPositions = otherFamilies.reduce((sum, family) => sum + family.positions, 0);
      const otherPercentage = otherFamilies.reduce((sum, family) => sum + family.percentage, 0);
      
      result.push({
        family: 'Other',
        positions: otherPositions,
        percentage: otherPercentage
      });
    }

    // Renkleri ekle
    return result.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  };

  // Maaş pozisyonları verilerini hesapla
  const salaryPositionsData = () => {
    if (!data || data.length === 0) return [];

    // Pozisyonları maaşa göre sırala
    return data
      .filter(job => {
        const salary = getColumnValue(job, ['Base Salary-Average', 'Base Salary-Median']);
        return salary !== undefined && salary !== null && !isNaN(Number(salary));
      })
      .sort((a, b) => {
        const salaryA = Number(getColumnValue(a, ['Base Salary-Average', 'Base Salary-Median'])) || 0;
        const salaryB = Number(getColumnValue(b, ['Base Salary-Average', 'Base Salary-Median'])) || 0;
        return salaryB - salaryA;
      })
      .slice(0, 10)
      .map(job => {
        const position = getColumnValue(job, ['Job', 'Job Code']) || 'Bilinmeyen Pozisyon';
        const salary = Number(getColumnValue(job, ['Base Salary-Average', 'Base Salary-Median'])) || 0;
        const level = getColumnValue(job, ['Level', 'PC']) || 'Belirtilmemiş';
        
        return {
          position,
          shortName: position.length > 10 ? position.substring(0, 10) + '...' : position,
          salary,
          level,
        };
      });
  };

  // Country distribution hesaplama
  const countryDistributionData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const countryGroups: Record<string, number> = {};
    data.forEach(job => {
      const country = job['country'] || 'Unknown';
      countryGroups[country] = (countryGroups[country] || 0) + 1;
    });

    const totalCount = Object.values(countryGroups).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(countryGroups)
      .map(([country, count]) => ({
        country,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  return {
    familyDistributionData: familyDistributionData(),
    salaryPositionsData: salaryPositionsData(),
    countryDistributionData,
    loading,
    error,
    data,
    columns,
  };
} 