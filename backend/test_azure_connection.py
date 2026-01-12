import logging
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
AZURE_SQL_SERVER = "ai-db-dbs.database.windows.net"
AZURE_SQL_DATABASE = "db_bench"

def test_azure_bench_schema():
    # Connection string with MARS and Entra ID
    connection_uri = (
        f"mssql+pyodbc://@{AZURE_SQL_SERVER}/{AZURE_SQL_DATABASE}"
        "?driver=ODBC+Driver+18+for+SQL+Server"
        "&authentication=ActiveDirectoryInteractive"
        "&MultipleActiveResultSets=True"
        "&Encrypt=yes"
        "&TrustServerCertificate=no"
    )

    print("\n" + "="*70)
    print(f"📡 SCANNING SCHEMA: 'bench' in {AZURE_SQL_DATABASE}")
    print("="*70 + "\n")

    try:
        engine = create_engine(connection_uri)

        with engine.connect() as conn:
            # 1. Verify Connection
            conn.execute(text("SELECT 1")).fetchall()
            logger.info("✅ Connection Verified.")

            # 2. List tables specifically in the 'bench' schema
            table_query = text("""
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = 'bench' 
                ORDER BY TABLE_NAME
            """)
            
            tables = conn.execute(table_query).fetchall()

            if not tables:
                print("⚠️  Still no tables found. Verify the schema name in Azure.")
            else:
                print(f"📊 FOUND {len(tables)} TABLES IN 'bench' SCHEMA:")
                for row in tables:
                    t_name = row[0]
                    # Note: We must use the [schema].[table] format here
                    count = conn.execute(text(f"SELECT COUNT(*) FROM bench.[{t_name}]")).scalar()
                    print(f"   ➤ bench.{t_name:<25} | {count:>5} rows")

            print("\n✅ Test Complete.")

    except Exception as e:
        logger.error(f"❌ Failed: {e}")

if __name__ == "__main__":
    test_azure_bench_schema()