import { AuditLog } from '../models/AuditLog';
import { AuditAction, UserRole } from '../types';

export class AuditService {
  public static async log(params: {
    userId?: string;
    userEmail?: string;
    role?: UserRole;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await AuditLog.create({
        ...params,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('[AuditService Error] Failed to write audit log:', err);
    }
  }
}
