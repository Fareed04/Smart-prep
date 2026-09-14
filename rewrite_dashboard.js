const fs = require('fs');

const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const parts = content.split('{/* Recommended For You */}');

const before = parts[0];
const after = '{/* Recommended For You */}' + parts[1];

// Now extract the individual chunks we want to reorder from `after`.
// Using regex or string matching.

const extract = (startStr, endStr) => {
  const start = after.indexOf(startStr);
  if (start === -1) return null;
  const end = after.indexOf(endStr, start);
  if (end === -1) return null;
  return after.slice(start, end);
}

// 1. Recommended For You
const recommended = extract('{/* Recommended For You */}', '{onUpgradePool');
// 2. Format Upgrade
const formatUpgrade = extract('{onUpgradePool', '{/* Gamified Progress row */}');
// 3. XP Progress
const xpProgress = extract('{/* XP Progress */}', '{/* Mastery Progress */}');
// 4. Mastery Progress
const masteryProgress = extract('{/* Mastery Progress */}', '{/* Daily Goal and Recent Activity row */}');
// 5. Daily Goal
const dailyGoal = extract('{/* Daily Goal */}', '{/* Recent Activity */}');
// 6. Recent Activity
const recentActivity = extract('{/* Recent Activity */}', '<StudyRoadmap');
// 7. Study Roadmap
const studyRoadmap = extract('<StudyRoadmap', '{/* Achievements and Calendar */}');
// 8. Achievements
const achievements = extract('{/* Achievements / Badges */}', '{/* Streak Calendar */}');
// 9. Streak Calendar
const streakCalendar = extract('{/* Streak Calendar */}', '{/* Stats Overview */}');
// 10. Stats Overview
const statsOverview = extract('{/* Stats Overview */}', '{/* Performance Chart */}');
// 11. Performance Chart
const performanceChart = extract('{/* Performance Chart */}', '</div>\n  );\n}');

const newAfter = `
      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="xl:col-span-8 space-y-6 lg:space-y-8 flex flex-col">
          ${formatUpgrade}
          ${recommended}
          ${studyRoadmap}
          ${statsOverview}
          ${performanceChart}
          ${achievements}
        </div>

        {/* RIGHT COLUMN: Side Panel */}
        <div className="xl:col-span-4 space-y-6 lg:space-y-8 flex flex-col">
          ${xpProgress}
          ${masteryProgress}
          ${dailyGoal}
          ${streakCalendar}
          ${recentActivity}
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/Dashboard.tsx', before + newAfter);

console.log("Rewrote Dashboard layout!");
