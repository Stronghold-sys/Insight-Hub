import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Query full profile data (bio, age, relationship, etc.)
    const profileRows = await dbQuery<any>(
      `SELECT bio, age, relationship_status AS "relationshipStatus", relationship_goal AS "relationshipGoal",
              communication_preference AS "communicationPreference", timezone, privacy_level AS "privacyLevel",
              data_sharing_consent AS "dataSharingConsent", language_tone AS "languageTone", avatar_url AS "avatarUrl"
       FROM user_profiles WHERE user_id = ?`,
      [user.id]
    );
    const profile = profileRows.length > 0 ? profileRows[0] : {};

    // Query active subscription plan
    const activeSub = await dbQuery<any>(
      `SELECT plan_id FROM subscriptions 
       WHERE user_id::text = ? AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
       ORDER BY starts_at DESC LIMIT 1`,
      [user.id]
    );
    const plan = activeSub.length > 0 ? activeSub[0].plan_id : 'free';

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        // Merge full profile - profile.avatarUrl overrides the one from getSessionUser
        // so we always get the latest stored avatar
        ...profile,
        avatarUrl: profile.avatarUrl || user.avatarUrl || null,
        plan
      }
    });
  } catch (error) {
    console.error('Error during me GET API:', error);
    return NextResponse.json({ authenticated: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      nickname,
      avatarUrl,
      bio,
      age,
      relationshipStatus,
      relationshipGoal,
      communicationPreference,
      timezone,
      privacyLevel,
      dataSharingConsent,
      languageTone,
      mode,
      onboardingCompleted
    } = body;

    // Use INSERT ... ON CONFLICT (user_id) DO UPDATE SET to upsert user profile
    // CRITICAL: avatar_url uses COALESCE so an empty/null value never overwrites an existing photo
    const sql = `
      INSERT INTO user_profiles (
        user_id, full_name, nickname, avatar_url, bio, age, 
        relationship_status, relationship_goal, communication_preference, 
        timezone, privacy_level, data_sharing_consent, language_tone, mode,
        onboarding_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        nickname = EXCLUDED.nickname,
        avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), user_profiles.avatar_url),
        bio = EXCLUDED.bio,
        age = EXCLUDED.age,
        relationship_status = EXCLUDED.relationship_status,
        relationship_goal = EXCLUDED.relationship_goal,
        communication_preference = EXCLUDED.communication_preference,
        timezone = EXCLUDED.timezone,
        privacy_level = EXCLUDED.privacy_level,
        data_sharing_consent = EXCLUDED.data_sharing_consent,
        language_tone = EXCLUDED.language_tone,
        mode = EXCLUDED.mode,
        onboarding_completed = COALESCE(EXCLUDED.onboarding_completed, user_profiles.onboarding_completed)
    `;

    const parsedAge = age !== undefined && age !== null && String(age).trim() !== '' ? parseInt(String(age), 10) : null;
    const safeAge = parsedAge !== null && !isNaN(parsedAge) ? parsedAge : null;

    // Only pass avatarUrl if it is actually a non-empty value; otherwise send empty string
    // so COALESCE in SQL will preserve the existing value
    const safeAvatarUrl = avatarUrl && String(avatarUrl).trim() !== '' ? String(avatarUrl).trim() : '';

    await dbQuery(sql, [
      user.id,
      fullName || user.fullName || 'User Baru',
      nickname || user.nickname || 'Kamu',
      safeAvatarUrl,
      bio || '',
      safeAge,
      relationshipStatus || null,
      relationshipGoal || null,
      communicationPreference || null,
      timezone || 'Asia/Jakarta',
      privacyLevel || 'standard',
      dataSharingConsent !== undefined ? (dataSharingConsent ? 1 : 0) : 1,
      languageTone || 'genz',
      mode || 'solo',
      onboardingCompleted !== undefined && onboardingCompleted !== null ? (onboardingCompleted ? 1 : 0) : null
    ]);

    // Insert user activity log
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, 'profile_update', 'User memperbarui data profil/onboarding']
    );

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error during me POST API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
