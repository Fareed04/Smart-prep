import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# I will find all the large blocks and replace them.

recommended_start = content.find('{/* Recommended For You */}')
recommended_end = content.find('{onUpgradePool', recommended_start)
recommended_block = content[recommended_start:recommended_end].strip()

format_start = content.find('{onUpgradePool')
format_end = content.find('{/* Gamified Progress row */}', format_start)
format_block = content[format_start:format_end].strip()

# Now find all the gamified, daily goal, etc. components.
# Let's find exactly the blocks.

xp_start = content.find('{/* XP Progress */}')
xp_end = content.find('{/* Mastery Progress */}')
xp_block = content[xp_start:xp_end].strip()

mastery_start = content.find('{/* Mastery Progress */}')
mastery_end = content.find('{/* Daily Goal */}', mastery_start)
mastery_block = content[mastery_start:mastery_end].strip()

daily_goal_start = content.find('{/* Daily Goal */}')
daily_goal_end = content.find('{/* Study Roadmap Component */}', daily_goal_start)
daily_goal_block = content[daily_goal_start:daily_goal_end].strip()

roadmap_start = content.find('<StudyRoadmap')
roadmap_end = content.find('{/* Achievements and Calendar */}', roadmap_start)
roadmap_block = content[roadmap_start:roadmap_end].strip()

badges_start = content.find('{/* Achievements / Badges */}')
badges_end = content.find('{/* Streak Calendar */}', badges_start)
badges_block = content[badges_start:badges_end].strip()

streak_start = content.find('{/* Streak Calendar */}')
streak_end = content.find('{/* Stats Overview */}', streak_start)
streak_block = content[streak_start:streak_end].strip()

stats_start = content.find('{/* Stats Overview */}')
stats_end = content.find('{/* Performance Chart */}', stats_start)
stats_block = content[stats_start:stats_end].strip()

perf_start = content.find('{/* Performance Chart */}')
perf_end = content.find('{/* Progress Report / History */}', perf_start)
perf_block = content[perf_start:perf_end].strip()

history_start = content.find('{/* Progress Report / History */}')
history_end = content.rfind('</div>\n    </div>\n  );\n}')
history_block = content[history_start:history_end].strip()

new_layout = f"""
      {{/* BENTO GRID LAYOUT */}}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {{/* LEFT COLUMN: Main Content */}}
        <div className="xl:col-span-8 space-y-6 lg:space-y-8 flex flex-col">
          {format_block}
          {recommended_block}
          {roadmap_block}
          {stats_block}
          {perf_block}
          {badges_block}
        </div>

        {{/* RIGHT COLUMN: Side Panel */}}
        <div className="xl:col-span-4 space-y-6 lg:space-y-8 flex flex-col">
          {xp_block}
          {mastery_block}
          {daily_goal_block}
          {streak_block}
          {history_block}
        </div>
      </div>
"""

new_content = content[:recommended_start] + new_layout + '\n    </div>\n  );\n}'

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(new_content)

print("Done")
