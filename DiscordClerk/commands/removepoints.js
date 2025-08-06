const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pointsManager = require('../utils/pointsManager');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removepoints')
        .setDescription('Remove infraction points from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove points from')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of points to remove')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(20))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing points')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        try {
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if user has permission
            const member = interaction.member;
            if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to remove points.',
                    ephemeral: true
                });
            }

            // Remove points
            const result = await pointsManager.removePoints(targetUser.id, amount, reason, interaction.user.id);
            
            if (!result.success) {
                return await interaction.reply({
                    content: `❌ Error: ${result.error}`,
                    ephemeral: true
                });
            }

            // Create response embed
            const embed = embedBuilder.createPointsActionEmbed(
                'removed',
                targetUser,
                amount,
                reason,
                result.newTotal,
                interaction.user
            );

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error executing removepoints command:', error);
            await interaction.reply({
                content: 'There was an error removing points. Please try again later.',
                ephemeral: true
            });
        }
    }
};