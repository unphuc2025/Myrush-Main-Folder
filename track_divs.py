import re

def track_divs(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    balance = 0
    for i, line in enumerate(lines):
        line_no = i + 1
        # Ignore comments
        clean_line = re.sub(r'//.*', '', line)
        clean_line = re.sub(r'/\*.*?\*/', '', clean_line)
        
        opens = len(re.findall(r'<div', clean_line))
        closes = len(re.findall(r'</div', clean_line))
        
        # Self-closing divs are rare but possible in JSX? No, usually <div />
        self_closes = len(re.findall(r'<div[^>]*/>', clean_line))
        
        actual_opens = opens - self_closes
        
        if actual_opens > 0 or closes > 0:
            balance += actual_opens
            balance -= closes
            print(f"Line {line_no:4}: +{actual_opens} -{closes} -> Balance: {balance}")

if __name__ == "__main__":
    import sys
    track_divs(sys.argv[1])
