import { dbQuery } from './db';
import crypto from 'crypto';

export interface UserPlanDetails {
  planId: string;
  status: string;
  endsAt: string | null;
}

/**
 * Fetch the active subscription plan details of a user
 */
export async function getUserActivePlan(userId: string): Promise<string> {
  // Check if user is admin first
  const userRoles = await dbQuery<any>(
    'SELECT role_id FROM user_roles WHERE user_id = ? AND role_id = "admin"',
    [userId]
  );
  if (userRoles.length > 0) {
    return 'admin';
  }

  // Get active subscription
  const activeSub = await dbQuery<any>(
    `SELECT plan_id FROM subscriptions 
     WHERE user_id = ? AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
     ORDER BY starts_at DESC LIMIT 1`,
    [userId]
  );
  
  if (activeSub.length > 0) {
    return activeSub[0].plan_id; // 'basic', 'premium', 'couple'
  }
  
  // Auto-seed free subscription row in database if no subscription exists at all
  try {
    const allSubs = await dbQuery<any>('SELECT id FROM subscriptions WHERE user_id = ?', [userId]);
    if (allSubs.length === 0) {
      await dbQuery(
        'INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, "free", "active", NOW(), NULL)',
        [crypto.randomUUID(), userId]
      );
    }
  } catch (e) {
    console.error('Error auto-seeding free subscription:', e);
  }
  
  return 'free';
}

/**
 * Check if the active plan has access to a specific feature or category
 */
export function checkFeatureAccess(plan: string, feature: string, categoryId?: string): boolean {
  if (plan === 'admin') return true;

  if (feature === 'mood-tracker') {
    return true; // Mood tracker is always free for everyone
  }

  if (feature === 'chat-analyzer') {
    // Basic, Premium, and Couple have access
    return plan === 'basic' || plan === 'premium' || plan === 'couple';
  }

  if (feature === 'voice-talk' || feature === 'roleplay') {
    // Only Premium and Couple have access
    return plan === 'premium' || plan === 'couple';
  }

  if (feature === 'assessment') {
    if (!categoryId) return true;

    // Define categories allowed per plan
    const freeCategories = ['love-language', 'communication-style', 'attachment-style'];
    
    const basicCategories = [
      ...freeCategories,
      'boundaries',
      'emotion-regulation',
      'stress-reaction',
      'self-awareness',
      'trust',
      'trust-style',
      'validation-needs'
    ];
    
    const premiumCategories = [
      ...basicCategories,
      'relationship-patterns',
      'relationship-readiness',
      'emotional-needs',
      'intimacy'
    ];
    
    const coupleCategories = [
      ...premiumCategories,
      'conflict-response' // Kuis Pasangan (Couple Plan only)
    ];

    if (plan === 'free') {
      return freeCategories.includes(categoryId);
    }
    if (plan === 'basic') {
      return basicCategories.includes(categoryId);
    }
    if (plan === 'premium') {
      return premiumCategories.includes(categoryId);
    }
    if (plan === 'couple') {
      return coupleCategories.includes(categoryId);
    }
  }

  return false;
}

/**
 * Get human-readable description or plan warning for feature locks (in Gen Z tone)
 */
export function getFeatureLockMessage(feature: string, categoryId?: string): { title: string; message: string } {
  if (feature === 'chat-analyzer') {
    return {
      title: 'Kunci Terbuka di Paket Basic!',
      message: 'Waduh, fitur Chat Analyzer butuh minimal paket Basic nih. Upgrade dulu biar bisa bongkar emosi obrolan doi!'
    };
  }
  
  if (feature === 'voice-talk' || feature === 'roleplay') {
    return {
      title: 'Khusus Member Premium',
      message: 'Fitur Teman Curhat & Simulasi percakapan interaktif ini cuma ada di paket Premium ke atas. Upgrade yuk biar bisa curhat sepuasnya tanpa batas!'
    };
  }
  
  if (feature === 'assessment') {
    const coupleOnly = categoryId === 'conflict-response';
    if (coupleOnly) {
      return {
        title: 'Khusus Couple Plan',
        message: 'Kuis Pasangan (Conflict Response) ini dirancang khusus untuk Couple Plan. Selesaikan bareng pasanganmu biar makin klop!'
      };
    }
    
    return {
      title: 'Akses Kuis Terkunci',
      message: 'Kuis seru ini berada di luar jangkauan paket aktifmu saat ini. Gas upgrade paket kamu biar bisa ngerjain kuis ini!'
    };
  }

  return {
    title: 'Akses Terbatas',
    message: 'Fitur ini memerlukan peningkatan paket langganan aktif. Silakan pilih paket baru di halaman Billing!'
  };
}
