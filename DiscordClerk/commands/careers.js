const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embedBuilder = require('../utils/embedBuilder');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('careers')
        .setDescription('Display ER:LC career opportunities and application portal'),

    async execute(interaction, client) {
        try {
            // Load settings
            const settingsPath = path.join(__dirname, '../config/settings.json');
            const settingsData = await fs.readFile(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);

            // Create careers embed
            const careersEmbed = embedBuilder.createCareersEmbed(settings);
            
            // Create apply button
            const applyButton = new ButtonBuilder()
                .setCustomId('apply_now')
                .setLabel('Apply Now')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📝');

            const actionRow = new ActionRowBuilder()
                .addComponents(applyButton);

            await interaction.reply({
                embeds: [careersEmbed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('Error executing careers command:', error);
            await interaction.reply({
                content: 'There was an error displaying the careers information. Please try again later.',
                ephemeral: true
            });
        }
    }
};
