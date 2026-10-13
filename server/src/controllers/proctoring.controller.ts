import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../types';
import { ProctoringService } from '../services/proctoring.service';
import { AssessmentSession } from '../models/AssessmentSession';
import { AuditService } from '../services/audit.service';

export class ProctoringController {
  /**
   * Record a proctoring event from client integrity detectors
   */
  public static async logEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const { sessionId, eventType, metadata, durationSeconds } = req.body;

      if (!candidateId || !sessionId || !eventType) {
        res.status(400).json({ success: false, message: 'sessionId and eventType are required.' });
        return;
      }

      const event = await ProctoringService.recordEvent({
        sessionId,
        candidateId,
        eventType,
        metadata,
        durationSeconds: Number(durationSeconds) || 0,
      });

      // Update session proctoring counters in real-time
      const session = await AssessmentSession.findById(sessionId);
      if (session && session.proctoringSummary) {
        session.proctoringSummary.totalEvents += 1;
        if (eventType === 'TAB_SWITCH' || eventType === 'WINDOW_BLUR') session.proctoringSummary.tabSwitches += 1;
        if (eventType === 'FULLSCREEN_EXIT') session.proctoringSummary.fullscreenExits += 1;
        if (eventType === 'CAMERA_INTERRUPTED') session.proctoringSummary.cameraInterruptions += 1;
        if (['COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT'].includes(eventType)) session.proctoringSummary.copyPasteAttempts += 1;
        if (eventType === 'RIGHT_CLICK') session.proctoringSummary.rightClicks += 1;

        if (session.proctoringSummary.tabSwitches >= 4 || session.proctoringSummary.fullscreenExits >= 2) {
          session.proctoringSummary.integrityIndicator = 'Review Recommended';
        } else if (session.proctoringSummary.tabSwitches >= 2) {
          session.proctoringSummary.integrityIndicator = 'Moderate';
        }
        await session.save();
      }

      res.status(201).json({
        success: true,
        event: {
          id: event._id,
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          timestamp: event.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload periodic webcam snapshot
   */
  public static async uploadSnapshot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const candidateId = req.user?.id;
      const file = req.file;
      const { sessionId, eventContext } = req.body;

      if (!file || !sessionId) {
        res.status(400).json({ success: false, message: 'Snapshot file and sessionId are required.' });
        return;
      }

      const snapshot = await ProctoringService.recordSnapshot({
        sessionId,
        candidateId: candidateId || '',
        imageFileName: file.filename,
        eventContext,
      });

      res.status(201).json({
        success: true,
        message: 'Webcam snapshot recorded successfully.',
        snapshotId: snapshot._id,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve violation timeline and snapshots for a session
   */
  public static async getSessionTimeline(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const data = await ProctoringService.getProctoringTimeline(sessionId);

      res.status(200).json({
        success: true,
        proctoring: data,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Proctoring data not found.' });
    }
  }

  /**
   * Securely serve webcam snapshot images to authorized users
   */
  public static async getSnapshotImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileName } = req.params;
      const filePath = path.join(__dirname, '../../uploads/snapshots', fileName);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'Snapshot image not found.' });
        return;
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}
