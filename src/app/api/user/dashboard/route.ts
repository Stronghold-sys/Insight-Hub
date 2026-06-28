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
      'SELECT nickname, full_name, mode FROM user_profiles WHERE user_id = ?::text',
      [user.id]
    );

    // 2. Get completed assessments count
    const completedCountRes = await dbQuery(
      'SELECT COUNT(DISTINCT assessment_id) as count FROM analysis_results WHERE user_id = ?::text',
      [user.id]
    );
    const completedAssessments = completedCountRes[0]?.count || 0;

    // 3. Get total journal entries
    const journalCountRes = await dbQuery(
      `SELECT COUNT(*) as count 
       FROM journals 
       WHERE user_id = ?::uuid AND deleted_at IS NULL`,
      [user.id]
    );
    const totalJournalEntries = journalCountRes[0]?.count || 0;

    // 4. Calculate active streak (number of distinct days with activities)
    const streakRes = await dbQuery(
      `SELECT COUNT(DISTINCT CAST(created_at AS date)) as streak 
       FROM user_activities 
       WHERE user_id = ?::text AND created_at >= (NOW() - INTERVAL '30 days')`,
      [user.id]
    );
    const streak = streakRes[0]?.streak || 0; // Default to 0 if user just onboarded

    // 5. Get today's mood
    const todayMoodRes = await dbQuery(
      `SELECT mood, energy, stress 
       FROM mood_entries 
       WHERE user_id = ?::text AND date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') 
       LIMIT 1`,
      [user.id]
    );
    const todayMood = todayMoodRes[0] || null;

    // 6. Get mood history (last 7 entries)
    const moodHistory = await dbQuery(
      `SELECT mood, energy, stress, date 
       FROM mood_entries 
       WHERE user_id = ?::text 
       ORDER BY date DESC 
       LIMIT 7`,
      [user.id]
    );
    // Reverse mood history to display in chronological order
    const moodHistoryChronological = [...moodHistory].reverse();

    // 7. Get recent journal entries (last 3)
    const recentJournals = await dbQuery(
      `SELECT id, title, mood, content, category_id as tag, TO_CHAR(created_at, 'YYYY-MM-DD') as date 
       FROM journals 
       WHERE user_id = ?::uuid AND deleted_at IS NULL 
       ORDER BY created_at DESC 
       LIMIT 3`,
      [user.id]
    );

    // 8. Get recent insights from assessment results
    const recentInsights = await dbQuery(
      `SELECT ar.dominant_category, TO_CHAR(ar.completed_at, 'YYYY-MM-DD') as date, a.title 
       FROM analysis_results ar 
       JOIN assessments a ON ar.assessment_id = a.id::text 
       WHERE ar.user_id = ?::text 
       ORDER BY ar.completed_at DESC 
       LIMIT 3`,
      [user.id]
    );

    // 9. Get completed assessment IDs
    const completedAssessmentsList = await dbQuery(
      'SELECT assessment_id FROM analysis_results WHERE user_id = ?::text',
      [user.id]
    );
    const completedIds = completedAssessmentsList.map(a => a.assessment_id);

    // 10. Get chat analyzer stats
    const chatCountRes = await dbQuery(
      'SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?::text',
      [user.id]
    );
    const totalChats = chatCountRes[0]?.count || 0;

    const lastChatRes = await dbQuery(
      `SELECT a.tone, a.urgency_conflict as urgency, TO_CHAR(s.created_at, 'YYYY-MM-DD') as date
       FROM chat_sessions s
       JOIN chat_analysis a ON s.id = a.session_id
       WHERE s.user_id = ?::text
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [user.id]
    );
    const lastChat = lastChatRes[0] || null;

    // 11. Get recent notifications (latest 4 notifications)
    const rawNotifications = await dbQuery<any>(
      `SELECT id, title, message, priority, is_read as isRead, TO_CHAR(created_at, 'YYYY-MM-DD') as date
       FROM notifications
       WHERE user_id = ?::uuid
       ORDER BY created_at DESC
       LIMIT 4`,
      [user.id]
    );

    // Sanitize notifications
    const recentNotifications = [];
    for (const notif of rawNotifications) {
      let message = notif.message || '';
      let title = notif.title || '';

      // Fix undefined invoice number
      if (message.includes('No. Invoice: undefined') || message.includes('No. Invoice: null')) {
        const inv = await dbQuery<any>(
          `SELECT i.invoice_number 
           FROM invoices i
           JOIN payments p ON i.payment_id = p.id
           JOIN orders o ON p.order_id = o.id
           WHERE o.user_id = ?::text AND p.status = 'SUCCESS'
           ORDER BY i.created_at DESC
           LIMIT 1`,
          [user.id]
        );
        if (inv.length > 0 && inv[0].invoice_number) {
          message = message.replace('No. Invoice: undefined', `No. Invoice: ${inv[0].invoice_number}`)
                           .replace('No. Invoice: null', `No. Invoice: ${inv[0].invoice_number}`);
        }
      }

      // Remove technical words
      const cleanText = (text: string) => {
        if (!text) return text;
        return text
          .replace(/duitku/gi, 'sistem pembayaran')
          .replace(/payment gateway/gi, 'layanan pembayaran')
          .replace(/database/gi, 'sistem')
          .replace(/\bai\b/gi, 'sistem cerdas');
      }

      message = cleanText(message);
      title = cleanText(title);

      recentNotifications.push({
        ...notif,
        title,
        message
      });
    }

    // 12. Get recent activities (last session history)
    const recentActivities = await dbQuery(
      `SELECT activity_type, description, TO_CHAR(created_at, 'YYYY-MM-DD') as date
       FROM user_activities
       WHERE user_id = ?::text
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
