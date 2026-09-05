'use client';

import { useStore } from '@/lib/store';

export function useMomentum() {
  const { momentumStats, activityLogs } = useStore();

  return {
    currentStreak: momentumStats.currentStreak,
    bestStreak: momentumStats.bestStreak,
    completedToday: momentumStats.completedToday,
    qualifyingDaysCount: momentumStats.qualifyingDaysCount,
    isMilestone: momentumStats.isMilestone,
    milestoneDays: momentumStats.milestoneDays,
    completedDates: momentumStats.completedDates,
    activityLogs,
  };
}

export function useDailyPlan() {
  const {
    dailyPlans,
    dailyRecommendation,
    acceptDailyPlan,
    isMorningPlanOpen,
    setMorningPlanOpen,
    isTodayDifferentModalOpen,
    setTodayDifferentModalOpen,
  } = useStore();

  return {
    dailyPlans,
    recommendation: dailyRecommendation,
    acceptDailyPlan,
    isMorningPlanOpen,
    setMorningPlanOpen,
    isTodayDifferentModalOpen,
    setTodayDifferentModalOpen,
  };
}

export function useCapacity() {
  const {
    todayCapacityMinutes,
    capacitySource,
    isCapacityOverloaded,
    isTaskCountOverloaded,
    todayPlannedMinutes,
    addExtraTime,
    reduceAvailableTime,
    setLowEnergyMode,
    setDailyCapacity,
  } = useStore();

  return {
    capacityMinutes: todayCapacityMinutes,
    source: capacitySource,
    isOverloaded: isCapacityOverloaded,
    isTaskCountOverloaded,
    plannedMinutes: todayPlannedMinutes,
    addExtraTime,
    reduceAvailableTime,
    setLowEnergyMode,
    setDailyCapacity,
  };
}
