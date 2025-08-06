const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const orderManager = require('../utils/orderManager');
const embedBuilder = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setorderstatus')
        .setDescription('Set the ordering system status')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The status to set')
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Available - Orders are open', value: 'available' },
                    { name: '🟠 Delayed - Orders accepted but may be slow', value: 'delayed' },
                    { name: '🔴 Closed - No new orders allowed', value: 'closed' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, client) {
        try {
            const newStatus = interaction.options.getString('status');

            // Check if user has permission
            const member = interaction.member;
            if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to change order status.',
                    ephemeral: true
                });
            }

            // Update order status
            const result = await orderManager.setOrderStatus(newStatus, interaction.user.id);
            
            if (!result.success) {
                return await interaction.reply({
                    content: `❌ Error: ${result.error}`,
                    ephemeral: true
                });
            }

            // Create response embed
            const statusEmojis = {
                'available': '🟢',
                'delayed': '🟠',
                'closed': '🔴'
            };

            const statusNames = {
                'available': 'Available - Orders are open',
                'delayed': 'Delayed - Orders accepted but may be slow',
                'closed': 'Closed - No new orders allowed'
            };

            const embed = embedBuilder.createOrderStatusUpdateEmbed(
                newStatus,
                statusEmojis[newStatus],
                statusNames[newStatus],
                interaction.user
            );

            await interaction.reply({ embeds: [embed] });

            // Update any existing order embeds in channels
            await orderManager.updateOrderEmbeds(client);

        } catch (error) {
            console.error('Error executing setorderstatus command:', error);
            await interaction.reply({
                content: 'There was an error updating the order status. Please try again later.',
                ephemeral: true
            });
        }
    }
};