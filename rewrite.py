import sys

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

before, after = content.split('{/* Recommended For You */}', 1)
after = '{/* Recommended For You */}' + after

def extract(start_str, end_str):
    start = after.find(start_str)
    if start == -1: return ""
    end = after.find(end_str, start)
    if end == -1: return ""
    return after[start:end]

recommended = extract('{/* Recommended For You */}', '{onUpgradePool')
format_upgrade = extract('{onUpgradePool', '{/* Gamified Progress row */}')
xp_progress = extract('{/* XP Progress */}', '{/* Mastery Progress */}').strip()
if not xp_progress:
    xp_progress = extract('{/* XP Progress */}', '        {/* Daily Goal and Recent Activity row */}')

# Mastery progress is right after xp_progress, wait actually they are both in Gamified Progress Row.
# Let's extract them by finding the actual lines.
