import { ProctoringEvent, IProctoringEventDocument } from '../models/ProctoringEvent';
import { AssessmentSnapshot, IAssessmentSnapshotDocument } from '../models/AssessmentSnapshot';
import { AssessmentSession } from '../models/AssessmentSession';
import { ProctoringEventType, EventSeverity } from '../types';

export class ProctoringService {
  /**
   * Record a proctoring event with objective neutral description and severity
   */
  public static async recordEvent(params: {
    sessionId: string;
    candidateId: string;
    eventType: ProctoringEventType;
    metadata?: Record<string, any>;
    durationSeconds?: number;
  }): Promise<IProctoringEventDocument> {
    const { sessionId, candidateId, eventType, metadata, durationSeconds } = params;

    let severity: EventSeverity = 'WARNING';
    let description = '';

    switch (eventType) {
      case 'TAB_SWITCH':
        severity = 'WARNING';
        description = durationSeconds
          ? `Tab switch event recorded: candidate left the assessment window for ${durationSeconds.toFixed(1)} seconds.`
          : 'Tab switch event recorded: window focus changed.';
        break;
      case 'WINDOW_BLUR':
        severity = 'INFO';
        description = 'Window blur event recorded.';
        break;
      case 'FULLSCREEN_EXIT':
        severity = 'WARNING';
        description = 'Candidate exited required fullscreen assessment mode.';
        break;
      case 'COPY_ATTEMPT':
        severity = 'HIGH';
        description = 'Clipboard copy action was initiated during the assessment.';
        break;
      case 'PASTE_ATTEMPT':
        severity = 'HIGH';
        description = 'Clipboard paste action was initiated in the assessment interface.';
        break;
      case 'CUT_ATTEMPT':
        severity = 'HIGH';
        description = 'Clipboard cut action was initiated.';
        break;
      case 'RIGHT_CLICK':
        severity = 'INFO';
        description = 'Context menu / right-click interaction recorded.';
        break;
      case 'CAMERA_INTERRUPTED':
        severity = 'HIGH';
        description = 'Webcam video stream connection was lost or interrupted.';
        break;
      case 'FACE_NOT_DETECTED':
        severity = 'WARNING';
        description = 'Candidate face was temporarily not detected in the camera frame.';
        break;
      case 'MICROPHONE_INTERRUPTED':
        severity = 'WARNING';
        description = 'Audio input device connection was temporarily interrupted.';
        break;
      case 'NETWORK_DISCONNECT':
        severity = 'WARNING';
        description = 'Network latency or temporary socket disconnection recorded.';
        break;
      case 'TIME_WARNING':
        severity = 'INFO';
        description = 'Time reminder prompt acknowledged by candidate.';
        break;
      case 'ASSESSMENT_TIMEOUT':
        severity = 'INFO';
        description = 'Assessment session reached scheduled duration deadline.';
        break;
      default:
        severity = 'INFO';
        description = `Proctoring event logged: ${eventType}`;
    }

    const event = await ProctoringEvent.create({
      sessionId,
      candidateId,
      eventType,
      metadata: metadata || {},
      durationSeconds: durationSeconds || 0,
      severity,
      description,
      timestamp: new Date(),
    });

    return event;
  }

  /**
   * Save a periodic webcam snapshot
   */
  public static async recordSnapshot(params: {
    sessionId: string;
    candidateId: string;
    imageFileName: string;
    eventContext?: string;
  }): Promise<IAssessmentSnapshotDocument> {
    return AssessmentSnapshot.create({
      sessionId: params.sessionId,
      candidateId: params.candidateId,
      imageFileName: params.imageFileName,
      eventContext: params.eventContext || 'Periodic webcam verification snapshot',
      timestamp: new Date(),
    });
  }

  /**
   * Retrieve chronological violation timeline and snapshot grid
   */
  public static async getProctoringTimeline(sessionId: string): Promise<{
    session: any;
    summary: any;
    timeline: any[];
    snapshots: any[];
  }> {
    const session = await AssessmentSession.findById(sessionId)
      .populate('candidateId', 'name email')
      .populate('assessmentId', 'title')
      .lean();

    if (!session) throw new Error('Assessment session not found.');

    const events = await ProctoringEvent.find({ sessionId }).sort({ timestamp: 1 }).lean();
    const snapshots = await AssessmentSnapshot.find({ sessionId }).sort({ timestamp: 1 }).lean();

    const counts = {
      total: events.length,
      tabSwitches: events.filter((e) => e.eventType === 'TAB_SWITCH' || e.eventType === 'WINDOW_BLUR').length,
      fullscreenExits: events.filter((e) => e.eventType === 'FULLSCREEN_EXIT').length,
      cameraInterruptions: events.filter((e) => e.eventType === 'CAMERA_INTERRUPTED').length,
      copyPasteAttempts: events.filter((e) => ['COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT'].includes(e.eventType)).length,
      rightClicks: events.filter((e) => e.eventType === 'RIGHT_CLICK').length,
    };

    return {
      session,
      summary: counts,
      timeline: events.map((e) => ({
        id: e._id,
        eventType: e.eventType,
        severity: e.severity,
        description: e.description,
        timestamp: e.timestamp,
        durationSeconds: e.durationSeconds,
      })),
      snapshots: snapshots.map((s) => ({
        id: s._id,
        timestamp: s.timestamp,
        url: `/api/proctoring/snapshots/${s.imageFileName}`,
        eventContext: s.eventContext,
      })),
    };
  }
}
