// src/core/storage/xp.js
export const XP = { easy: 10, hard: 25 };
export function awardXP(profile, result) {
  if (!result?.correct) return { gained: 0, total: profile?.xp ?? 0 };
  const gained = result.difficulty === 'hard' ? XP.hard : XP.easy;
  return { gained, total: (profile?.xp ?? 0) + gained };
}
export function recordStreak(profile, today = new Date().toISOString().slice(0, 10)) {
  const last = profile?.lastDay;
  if (last === today) return profile;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = last === yesterday ? (profile?.streak ?? 0) + 1 : 1;
  return { ...profile, streak, lastDay: today };
}
