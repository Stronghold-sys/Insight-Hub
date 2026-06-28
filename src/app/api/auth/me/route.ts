import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

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
        avatar_url = EXCLUDED.avatar_url,
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

    await dbQuery(sql, [
      user.id,
      fullName || user.fullName || 'User Baru',
      nickname || user.nickname || 'Kamu',
      avatarUrl || user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
      bio || '',
      age !== undefined && age !== null && age !== '' ? parseInt(age) : null,
      relationshipStatus || null,
      relationshipGoal || null,
      communicationPreference || null,
      timezone || 'Asia/Jakarta',
      privacyLevel || 'standard',
      dataSharingConsent !== undefined ? (dataSharingConsent ? 1 : 0) : 1,
      languageTone || 'genz',
      mode || 'solo',
      onboardingCompleted !== undefined ? (onboardingCompleted ? 1 : 0) : null
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
