const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embedBuilder = require('../utils/embedBuilder');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Display server rules with interactive buttons'),

    async execute(interaction, client) {
        try {
            // Load settings
            const settingsPath = path.join(__dirname, '../config/settings.json');
            const settingsData = await fs.readFile(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);

            // Create rules embed
            const rulesEmbed = embedBuilder.createRulesEmbed(settings);
            
            // Create interactive buttons
            const viewPointsButton = new ButtonBuilder()
                .setCustomId('view_points')
                .setLabel('View Points')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👁️');

            const orderRulesButton = new ButtonBuilder()
                .setCustomId('order_rules')
                .setLabel('Order Rules')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎨');

            const chainOfCommandButton = new ButtonBuilder()
                .setCustomId('chain_of_command')
                .setLabel('Chain of Command')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔗');

            const updateRulesButton = new ButtonBuilder()
                .setCustomId('update_rules')
                .setLabel('Update Rules')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚙️');

            const actionRow = new ActionRowBuilder()
                .addComponents(viewPointsButton, orderRulesButton, chainOfCommandButton, updateRulesButton);

            await interaction.reply({
                embeds: [rulesEmbed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('Error executing rules command:', error);
            await interaction.reply({
                content: 'There was an error displaying the rules. Please try again later.',
                ephemeral: true
            });
        }
    }
};