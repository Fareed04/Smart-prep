import sys

with open('src/components/Dashboard.tsx', 'r') as f:
    text = f.read()

def check_balance(text):
    stack = []
    lines = text.split('\n')
    for i, line in enumerate(lines):
        for col, char in enumerate(line):
            if char in '({[':
                stack.append((char, i+1, col+1))
            elif char in ')}]':
                if not stack:
                    print(f"Unmatched closing '{char}' at line {i+1}:{col+1}")
                    return False
                top, r_i, r_c = stack.pop()
                expected = {'(': ')', '{': '}', '[': ']'}[top]
                if char != expected:
                    print(f"Mismatched closing '{char}' at line {i+1}:{col+1}. Expected '{expected}' to match '{top}' from {r_i}:{r_c}")
                    return False
    if stack:
        print("Unclosed brackets:")
        for char, r_i, r_c in stack:
            print(f"  '{char}' opened at line {r_i}:{r_c}")
        return False
    return True

if check_balance(text):
    print("Perfectly balanced.")
