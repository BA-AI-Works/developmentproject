// Job data tipi
export interface JobData {
  [key: string]: any;
}

// Family Distribution veri tipi
export interface FamilyDistribution {
  id: number;
  family: string;
  positions: number;
  percentage: number;
  fill?: string;
}

// Salary Position veri tipi
export interface SalaryPosition {
  id: number;
  position: string;
  shortName: string;
  salary: number;
  level: string;
}

// Supabase veritabanı tabloları için tip tanımlamaları
export interface Database {
  public: {
    Tables: {
      family_distribution: {
        Row: FamilyDistribution;
        Insert: Omit<FamilyDistribution, 'id'>;
        Update: Partial<FamilyDistribution>;
      };
      salary_positions: {
        Row: SalaryPosition;
        Insert: Omit<SalaryPosition, 'id'>;
        Update: Partial<SalaryPosition>;
      };
    };
  };
} 