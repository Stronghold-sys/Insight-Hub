import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get profile/onboarding status
    const [profile] = await dbQuery(
      'SELECT nickname, full_name, mode FROM user_profiles WHERE user_id = ?',
      [user.id]
    );

    // 2. Get completed assessments count
    const completedCountRes = await dbQuery(
      'SELECT COUNT(DISTINCT assessment_id) as count FROM analysis_results WHERE user_id = ?',
      [user.id]
    );
    const completedAssessments = completedCountRes[0]?.count || 0;

    // 3. Get total journal entries
    const journalCountRes = await dbQuery(
      `SELECT COUNT(*) as count 
       FROM journal_entries je 
       JOIN journals j ON je.journal_id = j.id 
       WHERE j.user_id = ?`,
      [user.id]
    );
    const totalJournalEntries = journalCountRes[0]?.count || 0;

    // 4. Calculate active streak (number of distinct days with activities)
    const streakRes = await dbQuery(
      `SELECT COUNT(DISTINCT DATE(created_at)) as streak 
       FROM user_activities 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [user.id]
    );
    const streak = streakRes[0]?.streak || 1; // Default to 1 if user just onboarded

    // 5. Get today's mood
    const todayMoodRes = await dbQuery(
      `SELECT mood, energy, stress 
       FROM mood_entries 
       WHERE user_id = ? AND date = CURDATE() 
       LIMIT 1`,
      [user.id]
    );
    const todayMood = todayMoodRes[0] || null;

    // 6. Get mood history (last 7 entries)
    const moodHistory = await dbQuery(
      `SELECT mood, energy, stress, DATE_FORMAT(date, '%Y-%m-%d') as date 
       FROM mood_entries 
       WHERE user_id = ? 
       ORDER BY date DESC 
       LIMIT 7`,
      [user.id]
    );
    // Reverse mood history to display in chronological order
    const moodHistoryChronological = [...moodHistory].reverse();

    // 7. Get recent journal entries (last 3)
    const recentJournals = await dbQuery(
      `SELECT je.title, je.mood, je.content, je.tag, DATE_FORMAT(je.created_at, '%Y-%m-%d') as date 
       FROM journal_entries je 
       JOIN journals j ON je.journal_id = j.id 
       WHERE j.user_id = ? 
       ORDER BY je.created_at DESC 
       LIMIT 3`,
      [user.id]
    );

    // 8. Get recent insights from assessment results
    const recentInsights = await dbQuery(
      `SELECT ar.dominant_category, DATE_FORMAT(ar.completed_at, '%Y-%m-%d') as date, a.title 
       FROM analysis_results ar 
       JOIN assessments a ON ar.assessment_id = a.id 
       WHERE ar.user_id = ? 
       ORDER BY ar.completed_at DESC 
       LIMIT 3`,
      [user.id]
    );

    // 9. Get completed assessment IDs
    const completedAssessmentsList = await dbQuery(
      'SELECT assessment_id FROM analysis_results WHERE user_id = ?',
      [user.id]
    );
    const completedIds = completedAssessmentsList.map(a => a.assessment_id);

    // 10. Get chat analyzer stats
    const chatCountRes = await dbQuery(
      'SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?',
      [user.id]
    );
    const totalChats = chatCountRes[0]?.count || 0;

    const lastChatRes = await dbQuery(
      `SELECT a.tone, a.urgency_conflict as urgency, DATE_FORMAT(s.created_at, '%Y-%m-%d') as date
       FROM chat_sessions s
       JOIN chat_analysis a ON s.id = a.session_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [user.id]
    );
    const lastChat = lastChatRes[0] || null;

    // 11. Get recent unread notifications
    const recentNotifications = await dbQuery(
      `SELECT id, title, message, priority, DATE_FORMAT(created_at, '%Y-%m-%d') as date
       FROM notifications
       WHERE user_id = ? AND is_read = 0
       ORDER BY created_at DESC
       LIMIT 2`,
      [user.id]
    );

    // 12. Get recent activities (last session history)
    const recentActivities = await dbQuery(
      `SELECT activity_type, description, DATE_FORMAT(created_at, '%Y-%m-%d') as date
       FROM user_activities
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 3`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      stats: {
        nickname: profile?.nickname || user.nickname || 'Kamu',
        fullName: profile?.full_name || user.fullName || 'User Baru',
        mode: profile?.mode || 'solo',
        completedAssessments,
        totalJournalEntries,
        streak,
        todayMood,
      },
      moodHistory: moodHistoryChronological,
      recentJournals,
      recentInsights,
      completedIds,
      chatStats: {
        totalChats,
        lastChat,
      },
      recentNotifications,
      recentActivities,
    });

  } catch (error) {
    console.error('Error in GET user dashboard API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
