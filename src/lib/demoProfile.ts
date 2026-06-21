import type { UserProfile } from '../types';

export function applyDemoHydraProfile(demoUserId: string, displayName?: string): UserProfile {
  localStorage.setItem('still_user_id', demoUserId);
  const profile: UserProfile = {
    userId: demoUserId,
    displayName: displayName ?? 'Ema',
    spiritualTone: 'spiritual',
    onboardingComplete: true,
  };
  localStorage.setItem('still_profile', JSON.stringify(profile));
  return profile;
}

/** Browser console — bind this tab to an existing HydraDB user */
export function linkBrowserToHydraUser(userId: string, displayName?: string): UserProfile {
  return applyDemoHydraProfile(userId, displayName);
}
