// Debug script: trace narrative event availability across years
import { selectNarrativeEvent, getAvailableEvents } from './src/data/narrative-events.js';
import type { GameState } from './src/types/global.d.js';

// Minimal mock state
function makeMockState(pathId: string, age: number, firedMap: Record<string, number>): GameState {
  return {
    retirementPath: pathId,
    currentAge: age,
    narrativeBranch: 'unassigned',
    narrativeEventFired: firedMap,
    isAllInPath: false,
    isUnemployed: false,
    isMarried: false,
    hasChild: false,
    hasProperty: false,
    hasCar: false,
    currentSavings: 50000,
    currentMonthlySalary: 8000,
    initMonthlySalary: 8000,
    currentProfession: '程序员',
    currentCity: '中坚大后方',
    targetAge: 60,
    targetWealth: 5000000,
    stress: 30,
    happiness: 60,
    health: 80,
    economicCycle: 1,
    pathFaith: 50,
    pathSkills: {},
    parents: { isAlive: true, health: 70, age: 55, relationShip: 60 },
    partner: null,
    children: [],
    friends: [],
    usedCardHistory: [],
    crossroadFired: {},
    pendingBlindBoxes: [],
    pendingCardEchoes: [],
    pendingAftermath: null,
    consecutiveMaxStressYears: 0,
    canRetire: false,
    endingTriggered: false,
    gamePhase: 'playing',
    bankDepositPct: 100,
    indexFundPct: 0,
    speculationPct: 0,
    insurancePremium: 0,
    annualBaseCost: 30000,
    passiveIncome: 0,
    currentMortgageCost: 0,
    propertyValue: 0,
    annualCarCost: 0,
    didHealthCheck: false,
    mbtiType: null,
    yearOpeningMonologue: '',
    yearMood: 'default',
    lifetimeChildCost: 0,
  } as unknown as GameState;
}

const paths = ['ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler'];

for (const pathId of paths) {
  console.log(`\n===== Path: ${pathId} =====`);
  const firedMap: Record<string, number> = {};
  let restCount = 0;

  for (let age = 22; age <= 60; age++) {
    const state = makeMockState(pathId, age, { ...firedMap });
    const available = getAvailableEvents(state, firedMap);
    const event = selectNarrativeEvent(state, firedMap);

    if (event) {
      console.log(`  Age ${age}: ${available.length} available -> ${event.id} (oncePerGame: ${event.oncePerGame || false})`);
      firedMap[event.id] = age;
      restCount = 0;
    } else {
      restCount++;
      console.log(`  Age ${age}: ${available.length} available -> NULL (休养生息) [streak: ${restCount}]`);
    }
  }
}
