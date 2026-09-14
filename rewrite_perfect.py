with open('src/components/Dashboard.tsx', 'r') as f:
    lines = f.read().splitlines()

# Extract exactly the blocks by line ranges (0-indexed)
def get_lines(start, end):
    return '\n'.join(lines[start-1:end])

top = get_lines(1, 349)

roadmap = get_lines(350, 357)
stats = get_lines(358, 387)
perf = get_lines(388, 410)
badges = get_lines(412, 435)

xp = get_lines(440, 470)
mastery = get_lines(472, 506)
daily = get_lines(508, 621)
recent = get_lines(623, 682)
calendar = get_lines(817, 857)

bento = f"""
      {{/* BENTO GRID LAYOUT */}}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {{/* LEFT COLUMN: Main Content */}}
        <div className="xl:col-span-8 space-y-6 lg:space-y-8 flex flex-col">
{roadmap}
{stats}
{perf}
{badges}
        </div>

        {{/* RIGHT COLUMN: Side Panel */}}
        <div className="xl:col-span-4 space-y-6 lg:space-y-8 flex flex-col">
{xp}
{mastery}
{daily}
{calendar}
{recent}
        </div>
      </div>
    </div>
  );
}}
"""

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(top + '\n' + bento)
