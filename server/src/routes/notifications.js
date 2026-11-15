import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requirePatientAccess } from '../middleware/auth.js';
import { isSmtpConfigured } from '../services/emailService.js';

const router = express.Router();

/**
 * Get in-app notifications for patient/user
 */
router.get('/:patientId', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE patient_id = ? AND (user_id IS NULL OR user_id = ?)
      ORDER BY created_at DESC
      LIMIT 100
    `).all(req.params.patientId, req.user.id);

    const unreadCount = notifications.filter(n => n.is_read === 0).length;

    return res.json({
      notifications,
      unreadCount,
      smtpConfigured: isSmtpConfigured(),
    });
  } catch (err) {
    console.error('[Get Notifications Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * Mark a single notification as read
 */
router.patch('/:patientId/:notificationId/read', requireAuth, requirePatientAccess, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND patient_id = ?').run(
      req.params.notificationId, req.params.patientId
    );
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('[Mark Read Error]:', err);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

/**
 * Mark all notifications as read for current patient and user
 */
router.post('/:patientId/read-all', requireAuth, requirePatientAccess, (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE patient_id = ? AND (user_id IS NULL OR user_id = ?)
    `).run(req.params.patientId, req.user.id);

    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[Mark All Read Error]:', err);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
