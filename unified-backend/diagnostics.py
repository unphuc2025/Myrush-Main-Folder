import os
import sys

def check_file(filename, search_str):
    if not os.path.exists(filename):
        print(f"File {filename} NOT FOUND")
        return
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        if search_str in content:
            print(f"FOUND '{search_str}' in {filename}")
        else:
            print(f"NOT FOUND '{search_str}' in {filename}")

print("--- DIAGNOSTICS ---")
print(f"CWD: {os.getcwd()}")
check_file("main.py", "/debug/inspect/crud")
check_file("crud.py", "Creating booking with data")
check_file("crud.py", "DEBUG FIX APPLIED")
print("--- END ---")
