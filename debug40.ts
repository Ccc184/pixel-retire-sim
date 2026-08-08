import { getAvailableEvents, selectNarrativeEvent } from './src/data/narrative-events.js';
import './src/data/narrative-data-silver.js';
import type { GameState } from './src/types/global.d.js';

function count(path: string, branch: string, label: string) {
  const s: any = {
    currentAge: 40, retirementPath: path, narrativeBranch: branch,
    branchMemory: { choseCaregiver: true, choseTech: true }, branchHistory: [branch],
    pathSkills: { aiSkill: 55, promptMastery: 55, careSkill: 55, managementSkill: 55, policySkill: 55 },
    pathFaith: 80, isAllInPath: true, currentSavings: 500000, stress: 35, happiness: 60, health: 80,
    narrativeEventFired: {}, aiSkillLevel: 40, silverBusiness: { clients: 200, reputation: 60, monthlyRevenue: 20000 },
  };
  const counts: Record<string, number> = {};
  for (let i = 0; i < 500; i++) {
    const p = selectNarrativeEvent(s as GameState, {});
    if (p) counts[p.id] = (counts[p.id] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(`\n=== ${label} (branch=${branch}) 500次分布 ===`);
  for (const [id, c] of top) console.log(`  ${id}  ${(c / total * 100).toFixed(1)}%`);
}

count('ai_symbiote', 'tech_expert', 'AI tech_expert @40');
count('silver_economy', 'silver_caregiver', '银发 caregiver @40');
count('silver_economy', 'silver_tech', '银发 tech @40');