import sys
import re

def check_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments (simple)
    content = re.sub(r'//.*', '', content)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Matches <Tag, </Tag>, <Tag />
    # We want to find opens that aren't closed.
    tag_pattern = re.compile(r'<(/?)([a-zA-Z0-9\.]+)(\s+[^>]*)?(/?|)>')
    
    stack = []
    self_closing_html = ['input', 'img', 'br', 'hr', 'link', 'meta']
    
    for match in tag_pattern.finditer(content):
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        is_self_closing = match.group(4) == '/'
        
        if tag_name in self_closing_html or is_self_closing:
            continue
            
        if is_closing:
            if not stack:
                # print(f"Extra closing tag </{tag_name}> at index {match.start()}")
                continue
            top_tag, top_start = stack.pop()
            # If mismatch, we just keep popping until we find it or empty
            if top_tag != tag_name:
                # print(f"Mismatch at {match.start()}: expected </{top_tag}>, got </{tag_name}>")
                # Try to recover by looking for the tag in stack
                found = False
                temp_stack = list(stack)
                while temp_stack:
                    t, s = temp_stack.pop()
                    if t == tag_name:
                        stack = temp_stack
                        found = True
                        break
                if not found:
                    stack.append((top_tag, top_start)) # put it back
        else:
            stack.append((tag_name, match.start()))

    print("Unclosed tags (top 10):")
    for t, s in stack:
        # Find line number
        line_no = content.count('\n', 0, s) + 1
        print(f"<{t}> at line {line_no}")

if __name__ == "__main__":
    check_tags(sys.argv[1])
