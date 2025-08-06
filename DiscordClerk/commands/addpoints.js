const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pointsManager = require('../utils/pointsManager');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpoints')
        .setDescription('Add infraction points to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to add points to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of points to add')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for adding points')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction, client) {
        try {
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if user has permission (you can also check specific roles here)
            const member = interaction.member;
            if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to add points.',
                    ephemeral: true
                });
            }

            // Add points
            const result = await pointsManager.addPoints(targetUser.id, amount, reason, interaction.user.id);
            
            if (!result.success) {
                return await interaction.reply({
                    content: `❌ Error: ${result.error}`,
                    ephemeral: true
                });
            }

            // Create response embed
            const embed = embedBuilder.createPointsActionEmbed(
                'added',
                targetUser,
                amount,
                reason,
                result.newTotal,
                interaction.user
            );

            await interaction.reply({ embeds: [embed] });

            // Check if user should be auto-banned
            if (result.newTotal >= 16) {
                try {
                    const targetMember = interaction.guild.members.cache.get(targetUser.id);
                    if (targetMember) {
                        await targetMember.ban({ reason: `Auto-ban: Reached ${result.newTotal} infraction points` });
                        
                        const banEmbed = embedBuilder.createAutoBanEmbed(targetUser, result.newTotal);
                        await interaction.followUp({ embeds: [banEmbed] });
                    }
                } catch (error) {
                    console.error('Error auto-banning user:', error);
                    await interaction.followUp({
                        content: `⚠️ User reached ${result.newTotal} points but could not be auto-banned. Please ban manually.`,
                        ephemeral: true
                    });
                }
            }

        } catch (error) {
            console.error('Error executing addpoints command:', error);
            await interaction.reply({
                content: 'There was an error adding points. Please try again later.',
                ephemeral: true
            });
        }
    }
};