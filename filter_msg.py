import sys
msg = sys.stdin.read()
# Remove Co-Authored-By lines
lines = [l for l in msg.split('\n') if 'Co-Authored-By' not in l]
# Remove trailing empty lines
while lines and lines[-1].strip() == '':
    lines.pop()
print('\n'.join(lines))
