import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendMail } from './mailService.js';

export async function notify(user, message, type = 'system', complaint) {
  if (!user) return Promise.resolve();
  const notification = await Notification.create({ user, message, type, complaint }).catch(() => null);
  const account = await User.findById(user).select('email').lean().catch(() => null);
  if (account?.email) await sendMail({ to: account.email, subject: 'CivicFix complaint update', text: message }).catch(() => false);
  return notification;
}
