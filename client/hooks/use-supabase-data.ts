import { useState, useEffect } from 'react';
import { fetchFamilyData, fetchSalaryData } from '../../lib/supabase';

// Family Distribution verilerini getiren hook
export function useFamilyDistribution() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchFamilyData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Bilinmeyen bir hata oluştu'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { data, loading, error };
}

// Salary Positions verilerini getiren hook
export function useSalaryPositions() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchSalaryData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Bilinmeyen bir hata oluştu'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { data, loading, error };
} 