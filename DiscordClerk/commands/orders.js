const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embedBuilder = require('../utils/embedBuilder');
const orderManager = require('../utils/orderManager');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('orders')
        .setDescription('Display the ordering system embed'),

    async execute(interaction, client) {
        try {
            // Load settings
            const settingsPath = path.join(__dirname, '../config/settings.json');
            const settingsData = await fs.readFile(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);

            // Get current order status
            const orderStatus = await orderManager.getOrderStatus();

            // Create orders embed
            const ordersEmbed = embedBuilder.createOrdersEmbed(settings, orderStatus);
            
            // Create place order button
            const placeOrderButton = new ButtonBuilder()
                .setCustomId('place_order')
                .setLabel('Place Order')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📦');

            // Disable button if orders are closed
            if (orderStatus.status === 'closed') {
                placeOrderButton.setDisabled(true);
            }

            const actionRow = new ActionRowBuilder()
                .addComponents(placeOrderButton);

            // Check if we can send to the channel
            if (!interaction.channel) {
                return await interaction.reply({
                    content: '❌ Could not access channel. Please try again.',
                    ephemeral: true
                });
            }

            // Reply first to acknowledge the command
            await interaction.reply({
                content: '✅ Order panel has been posted!',
                ephemeral: true
            });

            // Then send the embed as a permanent panel
            await interaction.channel.send({
                embeds: [ordersEmbed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('Error executing orders command:', error);
            
            // Only reply if we haven't already replied
            if (!interaction.replied) {
                try {
                    await interaction.reply({
                        content: 'There was an error displaying the ordering system. Please try again later.',
                        ephemeral: true
                    });
                } catch (replyError) {
                    console.error('Could not send error reply:', replyError);
                }
            }
        }
    }
};