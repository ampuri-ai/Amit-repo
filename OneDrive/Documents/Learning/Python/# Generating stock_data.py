import pandas as pd
from pathlib import Path

Py_path = Path(r"c:\Users\amitp\OneDrive\Documents\learning\python")
filename = "stock_data.csv"
fullpath = Py_path / filename

# Read the CSV file
read = pd.read_csv(fullpath)
print(read)

# Filter days where price > 200
filtered = read[read['Date'] > "15/3/2026"]

# Extract date and price columns
result = filtered[['Date', 'Price']]

# Count the days
count = len(result)

print(f"Days with price > 200: {count}")
print(result)