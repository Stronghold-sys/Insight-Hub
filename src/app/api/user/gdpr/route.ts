import { NextResponse } from 'next/server';
import { getSessionUser, destroySession } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Query all tables associated with this user
    const [profile] = await dbQuery('SELECT * FROM user_profiles WHERE user_id = ?', [user.id]);
    const moods = await dbQuery('SELECT * FROM mood_entries WHERE user_id = ?', [user.id]);
    const journals = await dbQuery('SELECT * FROM journals WHERE user_id = ?', [user.id]);
    const chatSessions = await dbQuery('SELECT * FROM chat_sessions WHERE user_id = ?', [user.id]);
    const assessmentResults = await dbQuery('SELECT * FROM analysis_results WHERE user_id = ?', [user.id]);

    const gdprPayload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile: profile || null,
      moodLogs: moods,
      journals: journals,
      chatSessions,
      assessmentResults
    };

    // Return as downloadable JSON file attachment
    return new NextResponse(JSON.stringify(gdprPayload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=insighthub_data_export_${user.id}.json`
      }
    });

  } catch (error) {
    console.error('Error during GDPR export API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user from database (FOREIGN KEY cascade deletes everything else automatically)
    await dbQuery('DELETE FROM users WHERE id = ?', [user.id]);

    // Clear session cookies
    await destroySession();

    return NextResponse.json({ success: true, message: 'Account and associated data deleted successfully' });
  } catch (error) {
    console.error('Error during account deletion API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
