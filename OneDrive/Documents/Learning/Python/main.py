import sys
import os
import itertools
from pathlib import Path
import posixpath

Py_path = Path(r"c:\Users\amitp\OneDrive\Documents\learning\python")
filename = "large_file.csv"
fullpath = Py_path / filename
print(fullpath)
with open(fullpath, 'w') as f:
     for i in range(1000000):
         f.write(f" line number {i}\n")
     print("Whole file is written")
lines_list = (line.strip().upper() for line in open(fullpath))
print(f"Generator expression created: {sys.getsizeof(lines_list)} bytes")
print("First 5 lines:")
for line in itertools.islice(lines_list, 5):
    print(line)