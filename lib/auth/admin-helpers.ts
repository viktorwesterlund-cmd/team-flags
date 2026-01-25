import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getDatabase } from '@/lib/mongodb';

export interface AdminAuthResult {
  success: boolean;
  email?: string;
  error?: string;
}

/**
 * Verify if the current user is an admin
 * Returns the user's email if they are an admin, null otherwise
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  try {
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return { success: false, error: 'Unauthorized - No session cookie' };
    }

    // Verify session with Firebase
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const email = decodedClaims.email;

    if (!email) {
      return { success: false, error: 'Unauthorized - No email in token' };
    }

    // Check if user is admin in database
    const db = await getDatabase();
    const userProfile = await db.collection('users').findOne({ email });

    if (userProfile?.role !== 'admin') {
      return { success: false, error: 'Forbidden - Admin access required' };
    }

    return { success: true, email };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Check if a user has admin role in the database
 * @param email - The email address to check
 */
export async function isAdmin(email: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const userProfile = await db.collection('users').findOne({ email });
    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
