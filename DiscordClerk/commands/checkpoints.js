const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pointsManager = require('../utils/pointsManager');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkpoints')
        .setDescription('Check infraction points for any user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check points for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        try {
            const targetUser = interaction.options.getUser('user');

            // Check if user has permission
            const member = interaction.member;
            if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to check user points.',
                    ephemeral: true
                });
            }

            // Get user points
            const userPoints = await pointsManager.getUserPoints(targetUser.id);
            const pointsHistory = await pointsManager.getPointsHistory(targetUser.id);

            // Create response embed
            const embed = embedBuilder.createPointsCheckEmbed(targetUser, userPoints, pointsHistory);

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error executing checkpoints command:', error);
            await interaction.reply({
                content: 'There was an error checking points. Please try again later.',
                ephemeral: true
            });
        }
    }
};