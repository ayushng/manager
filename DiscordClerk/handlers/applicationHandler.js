const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const stateManager = require('../utils/stateManager');
const embedBuilder = require('../utils/embedBuilder');

class ApplicationHandler {
    constructor() {
        this.questionsPath = path.join(__dirname, '../config/questions.json');
        this.settingsPath = path.join(__dirname, '../config/settings.json');
        this.applicationsPath = path.join(__dirname, '../data/applications.json');
    }

    async loadQuestions() {
        try {
            const data = await fs.readFile(this.questionsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading questions:', error);
            return {};
        }
    }

    async loadSettings() {
        try {
            const data = await fs.readFile(this.settingsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    async saveApplication(applicationData) {
        try {
            let applications = [];
            try {
                const data = await fs.readFile(this.applicationsPath, 'utf8');
                applications = JSON.parse(data);
            } catch (error) {
                // File doesn't exist yet, start with empty array
            }

            applications.push(applicationData);
            await fs.writeFile(this.applicationsPath, JSON.stringify(applications, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving application:', error);
            return false;
        }
    }

    async startApplication(userId, position) {
        const questions = await this.loadQuestions();
        const positionQuestions = questions[position];

        if (!positionQuestions || positionQuestions.length === 0) {
            return { success: false, error: 'No questions found for this position' };
        }

        // Initialize application state
        const applicationState = {
            userId,
            position,
            questions: positionQuestions,
            currentQuestionIndex: 0,
            answers: {},
            startedAt: new Date().toISOString(),
            status: 'in_progress'
        };

        stateManager.setApplicationState(userId, applicationState);
        return { success: true, state: applicationState };
    }

    async handleDMMessage(message, client) {
        const userId = message.author.id;
        const state = stateManager.getApplicationState(userId);

        if (!state || state.status !== 'in_progress') {
            return; // No active application
        }

        const currentQuestion = state.questions[state.currentQuestionIndex];
        if (!currentQuestion) {
            return;
        }

        // Store the answer
        state.answers[currentQuestion.id] = message.content;

        // Move to next question or complete application
        state.currentQuestionIndex++;

        if (state.currentQuestionIndex >= state.questions.length) {
            // Application completed
            await this.completeApplication(message.author, state, client);
        } else {
            // Send next question
            await this.sendNextQuestion(message.author, state);
        }

        // Update state
        stateManager.setApplicationState(userId, state);
    }

    async sendNextQuestion(user, state) {
        const currentQuestion = state.questions[state.currentQuestionIndex];
        const settings = await this.loadSettings();

        try {
            const embed = embedBuilder.createQuestionEmbed(
                currentQuestion,
                state.currentQuestionIndex + 1,
                state.questions.length,
                state.position,
                settings
            );

            await user.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending question:', error);
        }
    }

    async completeApplication(user, state, client) {
        const settings = await this.loadSettings();
        
        // Mark application as completed
        state.status = 'completed';
        state.completedAt = new Date().toISOString();

        // Save application to file
        const applicationData = {
            id: `app_${Date.now()}_${user.id}`,
            userId: user.id,
            username: user.username,
            discriminator: user.discriminator,
            position: state.position,
            answers: state.answers,
            submittedAt: state.completedAt,
            status: 'pending_review'
        };

        const saved = await this.saveApplication(applicationData);
        
        if (saved) {
            // Send confirmation to applicant
            try {
                const confirmationEmbed = embedBuilder.createConfirmationEmbed(settings);
                await user.send({ embeds: [confirmationEmbed] });
            } catch (error) {
                console.error('Error sending confirmation:', error);
            }

            // Notify HR team
            await this.notifyHRTeam(applicationData, client, settings);
        }

        // Clean up state
        stateManager.removeApplicationState(user.id);
    }

    async notifyHRTeam(applicationData, client, settings) {
        try {
            const hrChannelId = settings.channels.hr_notifications;
            if (!hrChannelId) return;

            const hrChannel = client.channels.cache.get(hrChannelId);
            if (!hrChannel) return;

            const notificationEmbed = embedBuilder.createHRNotificationEmbed(applicationData, settings);
            
            await hrChannel.send({ 
                content: `<@&${settings.roles.hr_team}> New application received!`,
                embeds: [notificationEmbed] 
            });

        } catch (error) {
            console.error('Error notifying HR team:', error);
        }
    }

    async sendInitialQuestion(user, position) {
        const result = await this.startApplication(user.id, position);
        
        if (!result.success) {
            try {
                await user.send('❌ Sorry, there was an error starting your application. Please try again later.');
            } catch (error) {
                console.error('Error sending error message:', error);
            }
            return false;
        }

        await this.sendNextQuestion(user, result.state);
        return true;
    }
}

const applicationHandler = new ApplicationHandler();

module.exports = { applicationHandler };
