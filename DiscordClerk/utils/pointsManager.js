const fs = require('fs').promises;
const path = require('path');

class PointsManager {
    constructor() {
        this.pointsDataPath = path.join(__dirname, '../data/points.json');
        this.pointsHistoryPath = path.join(__dirname, '../data/pointsHistory.json');
    }

    async loadPointsData() {
        try {
            const data = await fs.readFile(this.pointsDataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return empty object
            return {};
        }
    }

    async savePointsData(data) {
        try {
            await fs.writeFile(this.pointsDataPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving points data:', error);
            return false;
        }
    }

    async loadPointsHistory() {
        try {
            const data = await fs.readFile(this.pointsHistoryPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return empty array
            return [];
        }
    }

    async savePointsHistory(history) {
        try {
            await fs.writeFile(this.pointsHistoryPath, JSON.stringify(history, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving points history:', error);
            return false;
        }
    }

    async addPoints(userId, amount, reason, moderatorId) {
        try {
            const pointsData = await this.loadPointsData();
            const history = await this.loadPointsHistory();

            // Get current points or 0 if user doesn't exist
            const currentPoints = pointsData[userId] || 0;
            const newTotal = currentPoints + amount;

            // Update points data
            pointsData[userId] = newTotal;

            // Add to history
            const historyEntry = {
                id: `points_${Date.now()}_${userId}`,
                userId,
                action: 'add',
                amount,
                reason,
                moderatorId,
                timestamp: new Date().toISOString(),
                previousTotal: currentPoints,
                newTotal
            };

            history.push(historyEntry);

            // Save both files
            await this.savePointsData(pointsData);
            await this.savePointsHistory(history);

            return {
                success: true,
                newTotal,
                previousTotal: currentPoints
            };

        } catch (error) {
            console.error('Error adding points:', error);
            return {
                success: false,
                error: 'Failed to add points'
            };
        }
    }

    async removePoints(userId, amount, reason, moderatorId) {
        try {
            const pointsData = await this.loadPointsData();
            const history = await this.loadPointsHistory();

            // Get current points or 0 if user doesn't exist
            const currentPoints = pointsData[userId] || 0;
            const newTotal = Math.max(0, currentPoints - amount);

            // Update points data
            pointsData[userId] = newTotal;

            // Add to history
            const historyEntry = {
                id: `points_${Date.now()}_${userId}`,
                userId,
                action: 'remove',
                amount,
                reason,
                moderatorId,
                timestamp: new Date().toISOString(),
                previousTotal: currentPoints,
                newTotal
            };

            history.push(historyEntry);

            // Save both files
            await this.savePointsData(pointsData);
            await this.savePointsHistory(history);

            return {
                success: true,
                newTotal,
                previousTotal: currentPoints
            };

        } catch (error) {
            console.error('Error removing points:', error);
            return {
                success: false,
                error: 'Failed to remove points'
            };
        }
    }

    async getUserPoints(userId) {
        try {
            const pointsData = await this.loadPointsData();
            return pointsData[userId] || 0;
        } catch (error) {
            console.error('Error getting user points:', error);
            return 0;
        }
    }

    async getPointsHistory(userId) {
        try {
            const history = await this.loadPointsHistory();
            return history.filter(entry => entry.userId === userId).slice(-10); // Last 10 entries
        } catch (error) {
            console.error('Error getting points history:', error);
            return [];
        }
    }

    async getAllUsersWithPoints() {
        try {
            const pointsData = await this.loadPointsData();
            return Object.entries(pointsData)
                .filter(([userId, points]) => points > 0)
                .sort(([, a], [, b]) => b - a); // Sort by points descending
        } catch (error) {
            console.error('Error getting all users with points:', error);
            return [];
        }
    }

    async resetUserPoints(userId, reason, moderatorId) {
        try {
            const pointsData = await this.loadPointsData();
            const history = await this.loadPointsHistory();

            const currentPoints = pointsData[userId] || 0;
            pointsData[userId] = 0;

            // Add to history
            const historyEntry = {
                id: `points_${Date.now()}_${userId}`,
                userId,
                action: 'reset',
                amount: currentPoints,
                reason,
                moderatorId,
                timestamp: new Date().toISOString(),
                previousTotal: currentPoints,
                newTotal: 0
            };

            history.push(historyEntry);

            // Save both files
            await this.savePointsData(pointsData);
            await this.savePointsHistory(history);

            return {
                success: true,
                newTotal: 0,
                previousTotal: currentPoints
            };

        } catch (error) {
            console.error('Error resetting points:', error);
            return {
                success: false,
                error: 'Failed to reset points'
            };
        }
    }
}

module.exports = new PointsManager();