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
      const {
        sessionId,
        eventType,
        metadata,
        durationSeconds,
        durationMs,
        startedAt,
        endedAt,
        evidenceSnapshot,
      } = req.body;

      if (!candidateId || !sessionId || !eventType) {
        res.status(400).json({ success: false, message: 'sessionId and eventType are required.' });
        return;
      }

      const event = await ProctoringService.recordEvent({
        sessionId,
        candidateId,
        eventType,
        metadata,
        durationSeconds: Number(durationSeconds) || (Number(durationMs) ? Number(durationMs) / 1000 : 0),
        durationMs: Number(durationMs) || (Number(durationSeconds) ? Number(durationSeconds) * 1000 : 0),
        startedAt: startedAt ? new Date(startedAt) : undefined,
        endedAt: endedAt ? new Date(endedAt) : undefined,
        evidenceSnapshot,
      });

      // Update session proctoring counters in real-time
      const session = await AssessmentSession.findById(sessionId);
      if (session && session.proctoringSummary) {
        session.proctoringSummary.totalEvents = (session.proctoringSummary.totalEvents || 0) + 1;
        if (eventType === 'TAB_SWITCH' || eventType === 'WINDOW_BLUR') session.proctoringSummary.tabSwitches = (session.proctoringSummary.tabSwitches || 0) + 1;
        if (eventType === 'FULLSCREEN_EXIT') session.proctoringSummary.fullscreenExits = (session.proctoringSummary.fullscreenExits || 0) + 1;
        if (eventType === 'CAMERA_INTERRUPTED' || eventType === 'CAMERA_INTERRUPTION') session.proctoringSummary.cameraInterruptions = (session.proctoringSummary.cameraInterruptions || 0) + 1;
        if (['COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT'].includes(eventType)) session.proctoringSummary.copyPasteAttempts = (session.proctoringSummary.copyPasteAttempts || 0) + 1;
        if (eventType === 'RIGHT_CLICK') session.proctoringSummary.rightClicks = (session.proctoringSummary.rightClicks || 0) + 1;
        if (eventType === 'MULTIPLE_FACES_DETECTED') session.proctoringSummary.multipleFaces = (session.proctoringSummary.multipleFaces || 0) + 1;
        if (eventType === 'FACE_NOT_DETECTED') session.proctoringSummary.faceNotDetected = (session.proctoringSummary.faceNotDetected || 0) + 1;
        if (eventType === 'HUMAN_SPEECH_DETECTED') session.proctoringSummary.humanSpeech = (session.proctoringSummary.humanSpeech || 0) + 1;
        if (eventType === 'MICROPHONE_INTERRUPTED' || eventType === 'MICROPHONE_INTERRUPTION') session.proctoringSummary.microphoneInterruptions = (session.proctoringSummary.microphoneInterruptions || 0) + 1;

        if (
          (session.proctoringSummary.multipleFaces || 0) >= 1 ||
          (session.proctoringSummary.tabSwitches || 0) >= 4 ||
          (session.proctoringSummary.fullscreenExits || 0) >= 2
        ) {
          session.proctoringSummary.integrityIndicator = 'Review Recommended';
        } else if (
          (session.proctoringSummary.tabSwitches || 0) >= 2 ||
          (session.proctoringSummary.humanSpeech || 0) >= 2 ||
          (session.proctoringSummary.faceNotDetected || 0) >= 3
        ) {
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
          evidenceSnapshot: (event as any).evidenceSnapshot,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload periodic or event-triggered webcam snapshot
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
        fileName: file.filename,
        url: `/api/proctoring/snapshots/${file.filename}`,
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
