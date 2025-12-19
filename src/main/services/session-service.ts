import { session, Session } from 'electron';
import { getSessionPartitionName, PARTITION_IDS } from '../../shared/constants';
import type { PartitionId } from '../../shared/types';

// Session service class
class SessionService {
    private sessions: Map<PartitionId, Session> = new Map();

    // Get or create session for partition
    getSession(partition: PartitionId): Session {
        let partitionSession = this.sessions.get(partition);

        if (!partitionSession) {
            const partitionName = getSessionPartitionName(partition);
            partitionSession = session.fromPartition(partitionName);
            this.sessions.set(partition, partitionSession);
        }

        return partitionSession;
    }

    // Get all active sessions
    getAllSessions(): Map<PartitionId, Session> {
        return this.sessions;
    }

    // Check if partition is valid
    isValidPartition(partition: string): partition is PartitionId {
        return PARTITION_IDS.includes(partition as PartitionId);
    }

    // Clear session data for a partition
    async clearSessionData(partition: PartitionId): Promise<void> {
        const partitionSession = this.sessions.get(partition);
        if (partitionSession) {
            await partitionSession.clearStorageData();
        }
    }

    // Clear all sessions data
    async clearAllSessionsData(): Promise<void> {
        for (const [, partitionSession] of this.sessions) {
            await partitionSession.clearStorageData();
        }
    }

    // Get session partition name from partition ID
    getPartitionName(partition: PartitionId): string {
        return getSessionPartitionName(partition);
    }
}

// Singleton instance
export const sessionService = new SessionService();
