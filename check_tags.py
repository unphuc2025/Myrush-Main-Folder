import sys
import re

def check_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex for tags (ignores comments and strings poorly, but a start)
    # This matches <Tag, <Tag/>, </Tag>
    tag_pattern = re.compile(r'<(/?)([a-zA-Z0-9\.]+)(\s+[^>]*)?(/?|)>')
    
    stack = []
    
    # We only care about JSX-looking content in the return block
    # This is a very rough approach
    
    for match in tag_pattern.finditer(content):
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        is_self_closing = match.group(4) == '/'
        
        # Filter out common non-JSX < signs if possible
        # e.g. < number, or GenericType<T>
        # (Very hard to do perfectly with regex)
        if tag_name in ['input', 'img', 'br', 'hr']: # common self-closing html tags
            continue
            
        if is_self_closing:
            continue
            
        if is_closing:
            if not stack:
                print(f"Extra closing tag </b> at index {match.start()}")
                print(f"Context: {content[match.start()-40:match.start()+40]}")
                return
            top_tag, top_start = stack.pop()
            if top_tag != tag_name:
                print(f"Mismatch: </{tag_name}> at index {match.start()} matches <{top_tag}> at index {top_start}")
                # return
        else:
            stack.append((tag_name, match.start()))

    if stack:
        print(f"Unclosed tags remain: {stack[-5:]}")
    else:
        print("Everything looks balanced!")

if __name__ == "__main__":
    check_tags(sys.argv[1])
