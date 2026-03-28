import sys

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    for i, char in enumerate(content):
        if char in '({[':
            stack.append((char, i))
        elif char in ')}]':
            if not stack:
                print(f"Extra closing {char} at index {i}")
                # Print some context
                start = max(0, i - 40)
                end = min(len(content), i + 40)
                print(f"Context: ...{content[start:end]}...")
                return
            top_char, top_index = stack.pop()
            if top_char != pairs[char]:
                print(f"Mismatch: {char} at index {i} matches {top_char} at index {top_index}")
                return

    if stack:
        print(f"Unclosed items remain: {stack}")
    else:
        print("Balanced!")

if __name__ == "__main__":
    check_balance(sys.argv[1])
