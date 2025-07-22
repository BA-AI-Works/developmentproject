# Job_E Database Project

This project contains a normalized SQLite database created from the JobE.xlsx file, containing job position and compensation data.

## Database Structure

### Tables

#### 1. `jobs` (Main job information)
- `id`: Primary key (auto-increment)
- `function_type`: Job function category
- `family`: Job family/department
- `job_code`: Unique job code
- `job_title`: Job title/position name
- `pc`: Position code
- `level`: Experience level (Director, Manager, Team Leader, Team Member, Unskilled Worker)
- `created_at`: Timestamp of record creation

#### 2. `base_salary_stats` (Baz maaş istatistikleri)
**Base Salary: Baz maaş ile ilgili istatistikleri içeriyor**
- `id`: Primary key
- `job_id`: Foreign key to jobs table
- `average_salary`: Average base salary
- `num_orgs`: Number of organizations
- `num_cases`: Number of cases/data points
- `percentile_10th`: 10th percentile
- `percentile_25th`: 25th percentile
- `median`: Median (50th percentile)
- `percentile_75th`: 75th percentile
- `percentile_90th`: 90th percentile

#### 3. `total_guaranteed_compensation_stats` (Baz maaş ve yan haklar toplamı istatistikleri)
**Total Guaranteed Compensation: Baz Maaş + Yan Haklar ile ilgili istatistikleri içeriyor**
- Same structure as base_salary_stats but for guaranteed compensation
- `average_compensation`: Average guaranteed compensation
- Other fields same as base_salary_stats

#### 4. `actual_total_compensation_stats` (Baz Maaş , Yan Haklar ve Bonus dahil Gerçekleşen toplam gelir istatistikleri)
**Actual Total Compensation: Baz Maaş + Yan Haklar + Bonus ile ilgili istatistikleri içeriyor**
- Same structure as base_salary_stats but for actual total compensation
- `average_compensation`: Average actual total compensation
- Other fields same as base_salary_stats

### Views

#### 1. `job_summary`
Combines all job and compensation data in a single view for easy querying.

#### 2. `compensation_comparison`
Groups data by family and level for comparative analysis.

## Database Statistics

- **Total unique jobs**: 110
- **Total compensation records**: 653 per table (base salary, guaranteed, actual)
- **Data covers**: 34 different job families
- **Experience levels**: 5 levels (Director to Unskilled Worker)

## Usage Examples

### Python Usage
```python
import sqlite3
import pandas as pd

# Connect to database
conn = sqlite3.connect('job_e.db')

# Query high-paying jobs
query = """
SELECT j.job_title, j.family, atc.average_compensation 
FROM jobs j
JOIN actual_total_compensation_stats atc ON j.id = atc.job_id
WHERE atc.average_compensation > 200000
ORDER BY atc.average_compensation DESC
"""
df = pd.read_sql_query(query, conn)
print(df)

conn.close()
```

### Direct SQL Queries
```sql
-- Top 10 highest paying positions
SELECT j.job_title, j.family, atc.average_compensation
FROM jobs j
JOIN actual_total_compensation_stats atc ON j.id = atc.job_id
ORDER BY atc.average_compensation DESC
LIMIT 10;

-- Average compensation by job family
SELECT j.family, AVG(atc.average_compensation) as avg_comp
FROM jobs j
JOIN actual_total_compensation_stats atc ON j.id = atc.job_id
GROUP BY j.family
ORDER BY avg_comp DESC;

-- Jobs with most data points (highest reliability)
SELECT j.job_title, bs.num_cases
FROM jobs j
JOIN base_salary_stats bs ON j.id = bs.job_id
WHERE bs.num_cases > 100
ORDER BY bs.num_cases DESC;
```

## Files


- `create_database.py`: Database creation and data import script
- `query_database.py`: Example queries and database exploration
- `analyze_excel.py`: Excel file analysis script
- `JobE.xlsx`: Original Excel data file
- `venv/`: Python virtual environment (for dependencies)

## Dependencies

- pandas
- openpyxl
- sqlite3 (built-in with Python)

## Setup Instructions

1. Ensure Python 3 is installed
2. Create virtual environment: `python3 -m venv venv`
3. Activate virtual environment: `source venv/bin/activate`
4. Install dependencies: `pip install pandas openpyxl`
5. Run database creation: `python create_database.py`
6. Explore data: `python query_database.py`

## Data Quality Notes

- Some jobs have more data points than others
- Percentile data is only available for certain positions
- Jobs with >50 cases provide more reliable statistics
- Compensation data includes three types:
  - **Base Salary**: Baz maaş ile ilgili istatistikler
  - **Total Guaranteed Compensation**: Baz Maaş + Yan Haklar ile ilgili istatistikler
  - **Actual Total Compensation**: Baz Maaş + Yan Haklar + Bonus = Actual Total Compensation - Total Guaranteed Compensation  

+ Yan Haklar = Total Guaranteed Compensation - Base Salary

+ Yan Haklar + Bonus = Actual Total Compensation - Base Salary


## Top Job Families by Average Compensation

1. Şube ve Bölge Yönetimi (Branch & Regional Management)
2. Hazine (Treasury)
3. Kurumsal Bankacılık (Corporate Banking)
4. Ekonomik Araştırmalar (Economic Research)
5. İş Güvenliği / Sağlık (Occupational Safety/Health) 