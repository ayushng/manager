class StateManager {
    constructor() {
        // In-memory storage for application states
        // In production, consider using Redis or a database
        this.applicationStates = new Map();
        this.timeouts = new Map();
    }

    setApplicationState(userId, state) {
        this.applicationStates.set(userId, state);
        
        // Set timeout for application (30 minutes by default)
        this.clearTimeout(userId);
        const timeout = setTimeout(() => {
            this.removeApplicationState(userId);
        }, 30 * 60 * 1000); // 30 minutes
        
        this.timeouts.set(userId, timeout);
    }

    getApplicationState(userId) {
        return this.applicationStates.get(userId) || null;
    }

    removeApplicationState(userId) {
        this.applicationStates.delete(userId);
        this.clearTimeout(userId);
    }

    clearTimeout(userId) {
        const timeout = this.timeouts.get(userId);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(userId);
        }
    }

    hasActiveApplication(userId) {
        return this.applicationStates.has(userId);
    }

    getAllActiveApplications() {
        return Array.from(this.applicationStates.entries());
    }

    getApplicationCount() {
        return this.applicationStates.size;
    }

    // Clean up expired applications (called periodically)
    cleanupExpiredApplications() {
        const now = new Date();
        const expiredUsers = [];

        for (const [userId, state] of this.applicationStates.entries()) {
            const startTime = new Date(state.startedAt);
            const timeDiff = now - startTime;
            
            // Remove applications older than 1 hour
            if (timeDiff > 60 * 60 * 1000) {
                expiredUsers.push(userId);
            }
        }

        expiredUsers.forEach(userId => {
            this.removeApplicationState(userId);
        });

        if (expiredUsers.length > 0) {
            console.log(`🧹 Cleaned up ${expiredUsers.length} expired applications`);
        }
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Set up periodic cleanup (every 15 minutes)
setInterval(() => {
    stateManager.cleanupExpiredApplications();
}, 15 * 60 * 1000);

module.exports = stateManager;
