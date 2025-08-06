const { applicationHandler } = require('./applicationHandler');
const embedBuilder = require('../utils/embedBuilder');
const fs = require('fs').promises;
const path = require('path');

class InteractionHandler {
    constructor() {
        this.settingsPath = path.join(__dirname, '../config/settings.json');
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

    async handleInteraction(interaction, client) {
        try {
            // Immediately acknowledge ALL interactions to prevent timeouts
            if (!interaction.replied && !interaction.deferred) {
                if (interaction.isChatInputCommand()) {
                    // Let commands handle their own replies
                    await this.handleSlashCommand(interaction, client);
                } else {
                    // Acknowledge buttons and selects immediately
                    await interaction.deferReply({ ephemeral: true });
                    
                    if (interaction.isButton()) {
                        await this.handleButton(interaction, client);
                    } else if (interaction.isStringSelectMenu()) {
                        await this.handleSelectMenu(interaction, client);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            // Don't try to respond to expired interactions
        }
    }

    async handleSlashCommand(interaction, client) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            await interaction.reply({ 
                content: 'Command not found!', 
                ephemeral: true 
            });
            return;
        }

        await command.execute(interaction, client);
    }

    async handleButton(interaction, client) {
        const settings = await this.loadSettings();
        const pointsManager = require('../utils/pointsManager');
        const orderManager = require('../utils/orderManager');

        if (interaction.customId === 'apply_now') {
            // Send position selection dropdown
            const embed = embedBuilder.createPositionSelectionEmbed(settings);
            const selectMenu = embedBuilder.createPositionSelectMenu(settings);

            await interaction.editReply({
                embeds: [embed],
                components: [selectMenu]
            });
        } else if (interaction.customId === 'view_points') {
            // Show user their current points
            const userPoints = await pointsManager.getUserPoints(interaction.user.id);
            const pointsHistory = await pointsManager.getPointsHistory(interaction.user.id);
            
            const embed = embedBuilder.createPointsCheckEmbed(interaction.user, userPoints, pointsHistory);
            await interaction.editReply({ embeds: [embed] });

        } else if (interaction.customId === 'order_rules') {
            // Show design pricing and ordering guidelines
            const embed = embedBuilder.createOrderTypeSelectEmbed();
            await interaction.editReply({ embeds: [embed] });

        } else if (interaction.customId === 'chain_of_command') {
            // Show organizational hierarchy
            const embed = new (require('discord.js')).EmbedBuilder()
                .setTitle('🔗 Chain of Command')
                .setDescription('CLA Designs organizational structure and hierarchy')
                .setColor(settings.bot.color)
                .addFields([
                    {
                        name: '👑 Owner',
                        value: 'Server Owner - Final authority on all decisions',
                        inline: false
                    },
                    {
                        name: '🛠️ Management',
                        value: 'Server Management - Day-to-day operations and major decisions',
                        inline: false
                    },
                    {
                        name: '🛡️ Head Staff',
                        value: 'Senior Staff - Lead moderation and staff management',
                        inline: false
                    },
                    {
                        name: '⚔️ Staff/Moderators',
                        value: 'Moderation team - Rule enforcement and community support',
                        inline: false
                    },
                    {
                        name: '🎨 Lead Designer',
                        value: 'Design team lead - Quality control and project oversight',
                        inline: false
                    },
                    {
                        name: '✏️ Designers',
                        value: 'Design team - Create liveries, avatars, and graphics',
                        inline: false
                    }
                ])
                .setFooter({ text: 'Contact higher-ups for escalated issues' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } else if (interaction.customId === 'update_rules') {
            // Admin functionality for rule updates
            const member = interaction.member;
            if (!member.permissions.has(require('discord.js').PermissionFlagsBits.ManageChannels)) {
                return await interaction.editReply({
                    content: '❌ You do not have permission to update rules.'
                });
            }

            const embed = new (require('discord.js')).EmbedBuilder()
                .setTitle('⚙️ Rule Update System')
                .setDescription('Admin panel for rule management')
                .setColor('#ff6b6b')
                .addFields([
                    {
                        name: '📝 Available Actions',
                        value: '• Use `/addpoints` to add infraction points\n• Use `/removepoints` to remove points\n• Use `/checkpoints` to view user points\n• Contact developers for rule text changes',
                        inline: false
                    },
                    {
                        name: '⚠️ Auto-Moderation',
                        value: 'Users are automatically banned at 16 points',
                        inline: false
                    }
                ])
                .setFooter({ text: 'CLA Designs Admin Panel' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } else if (interaction.customId === 'place_order') {
            try {
                // Check order status
                const orderStatus = await orderManager.getOrderStatus();
                
                if (orderStatus.status === 'closed') {
                    return await interaction.editReply({
                        content: '🔴 **Orders are currently closed.** Please check back later or contact staff for urgent requests.'
                    });
                }

                // Send order type selection
                const embed = embedBuilder.createOrderTypeSelectEmbed();
                const selectMenu = this.createOrderTypeSelectMenu();

                await interaction.editReply({
                    embeds: [embed],
                    components: [selectMenu]
                });
            } catch (error) {
                console.error('Error showing order menu:', error);
                await interaction.editReply({
                    content: '❌ There was an error loading the order menu. Please try again.'
                });
            }
        } else if (interaction.customId.startsWith('accept_terms_')) {
            // Handle terms acceptance
            const orderId = interaction.customId.replace('accept_terms_', '');
            const orderManager = require('../utils/orderManager');
            
            const result = await orderManager.acceptTerms(orderId, interaction.user.id);
            
            if (!result.success) {
                return await interaction.reply({
                    content: '❌ Error accepting terms. Please contact staff for assistance.',
                    ephemeral: true
                });
            }

            const { EmbedBuilder } = require('discord.js');
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Terms Accepted!')
                .setDescription('Thank you for accepting our Terms & Conditions. Our design team has been notified and will begin working on your order soon.')
                .setColor('#00ff00')
                .addFields([
                    {
                        name: '📋 Order Details',
                        value: `**Order ID:** ${orderId}\n**Type:** ${result.order.orderType}\n**Status:** In Progress`,
                        inline: false
                    },
                    {
                        name: '📞 Next Steps',
                        value: 'A designer will contact you here to discuss your requirements and timeline.',
                        inline: false
                    }
                ])
                .setFooter({ text: 'CLA Designs Order System' })
                .setTimestamp();

            await interaction.reply({ embeds: [confirmEmbed] });

            // Try to disable the accept button, but don't fail if it doesn't work
            try {
                const disabledRow = this.createAcceptTermsButton(orderId);
                disabledRow.components[0].setDisabled(true).setLabel('Terms Accepted ✅');
                
                // Update the original message that contains the terms button
                const originalMessage = interaction.message;
                if (originalMessage) {
                    await originalMessage.edit({ components: [disabledRow] });
                }
            } catch (error) {
                console.log('Could not disable accept button, but terms were still accepted');
            }
        }
    }

    createOrderTypeSelectMenu() {
        const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('order_type_select')
            .setPlaceholder('Choose your service type...')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('Liveries')
                    .setDescription('Custom vehicle designs and paint jobs')
                    .setValue('liveries')
                    .setEmoji('🎨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Avatars')
                    .setDescription('Profile pictures and character artwork')
                    .setValue('avatars')
                    .setEmoji('🧑‍🎨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('ELS')
                    .setDescription('Emergency lighting system setups')
                    .setValue('els')
                    .setEmoji('🚨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Others')
                    .setDescription('Custom graphics, logos, and other designs')
                    .setValue('others')
                    .setEmoji('🗂️')
            ]);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    async handleSelectMenu(interaction, client) {
        const orderManager = require('../utils/orderManager');

        if (interaction.customId === 'position_select') {
            const selectedPosition = interaction.values[0];
            
            await interaction.reply({
                content: `🚀 Starting your application for **${selectedPosition}**!\n\n` +
                        `I'll send you a private message with the application questions. ` +
                        `Please check your DMs and respond to each question one at a time.\n\n` +
                        `⚠️ **Important:** Make sure your DMs are open so I can contact you!`,
                ephemeral: true
            });

            // Start the application process via DM
            try {
                const success = await applicationHandler.sendInitialQuestion(interaction.user, selectedPosition);
                
                if (!success) {
                    await interaction.followUp({
                        content: '❌ There was an error starting your application. Please try again later.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error starting application:', error);
                
                if (error.code === 50007) {
                    // Cannot send messages to this user (DMs closed)
                    await interaction.followUp({
                        content: '❌ I cannot send you a DM! Please enable DMs from server members and try again.\n\n' +
                                '**How to enable DMs:**\n' +
                                '1. Go to User Settings\n' +
                                '2. Click on Privacy & Safety\n' +
                                '3. Enable "Allow direct messages from server members"',
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: '❌ There was an error starting your application. Please try again later.',
                        ephemeral: true
                    });
                }
            }
        } else if (interaction.customId === 'order_type_select') {
            const selectedOrderType = interaction.values[0];
            
            // Update the deferred reply
            await interaction.editReply({
                content: `🛒 Setting up your **${selectedOrderType}** order, please wait...`
            });

            try {
                if (!interaction.guild) {
                    return await interaction.followUp({
                        content: '❌ This command can only be used in a server.',
                        ephemeral: true
                    });
                }

                // Create the order
                const orderResult = await orderManager.createOrder(
                    interaction.user.id,
                    selectedOrderType,
                    { requestedAt: new Date().toISOString() },
                    interaction.guild.id
                );

                if (!orderResult.success) {
                    return await interaction.followUp({
                        content: '❌ There was an error creating your order. Please try again later.',
                        ephemeral: true
                    });
                }

                // Create private order thread
                const threadName = `Order: ${selectedOrderType} - ${interaction.user.username}`;
                
                // Create thread in the current channel
                const orderThread = await interaction.channel.threads.create({
                    name: threadName,
                    reason: `Order thread for ${interaction.user.username}`,
                    type: require('discord.js').ChannelType.PrivateThread
                });

                // Add the user to the thread
                await orderThread.members.add(interaction.user.id);

                // Update order with thread ID
                if (!orderResult.order?.id) {
                    throw new Error('Invalid order data received');
                }
                
                const updateResult = await orderManager.updateOrderChannel(orderResult.order.id, orderThread.id);
                if (!updateResult.success) {
                    throw new Error('Failed to update order with thread ID');
                }

                // Send Terms & Conditions in the new thread
                const termsEmbed = this.createTermsEmbed(selectedOrderType);
                const acceptButton = this.createAcceptTermsButton(orderResult.order.id);

                await orderThread.send({
                    content: `Welcome ${interaction.user}! Please review and accept our Terms & Conditions to proceed with your **${selectedOrderType}** order.`,
                    embeds: [termsEmbed],
                    components: [acceptButton]
                });

                await interaction.editReply({
                    content: `✅ Order thread created: ${orderThread}\n\nPlease review and accept the Terms & Conditions to continue.`
                });

            } catch (error) {
                console.error('Error creating order:', error);
                
                // Try to send follow up message
                try {
                    await interaction.followUp({
                        content: '❌ There was an error setting up your order. Please contact staff for assistance.',
                        ephemeral: true
                    });
                } catch (followUpError) {
                    console.log('Could not send follow up message, interaction may have expired');
                }
            }
        }
    }

    createTermsEmbed(orderType) {
        const { EmbedBuilder } = require('discord.js');
        
        return new EmbedBuilder()
            .setTitle('📄 Terms & Conditions')
            .setDescription(`Please read and accept our terms for **${orderType}** orders:`)
            .setColor('#0099ff')
            .addFields([
                {
                    name: '💰 Payment',
                    value: 'Payment is required before work begins. We accept PayPal, Venmo, and other agreed methods.',
                    inline: false
                },
                {
                    name: '⏱️ Delivery',
                    value: 'Standard delivery is 3-7 business days. Rush orders available for additional fee.',
                    inline: false
                },
                {
                    name: '🔄 Revisions',
                    value: 'Up to 3 free revisions included. Additional revisions may incur extra charges.',
                    inline: false
                },
                {
                    name: '©️ Copyright',
                    value: 'You receive full commercial rights to your commissioned work upon payment.',
                    inline: false
                },
                {
                    name: '❌ Refunds',
                    value: 'Refunds available before work begins. Partial refunds considered case-by-case.',
                    inline: false
                },
                {
                    name: '📞 Communication',
                    value: 'All communication regarding your order should remain in this channel.',
                    inline: false
                }
            ])
            .setFooter({ text: 'By clicking Accept, you agree to these terms' })
            .setTimestamp();
    }

    createAcceptTermsButton(orderId) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const acceptButton = new ButtonBuilder()
            .setCustomId(`accept_terms_${orderId}`)
            .setLabel('Accept Terms & Conditions')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        return new ActionRowBuilder().addComponents(acceptButton);
    }
}

const interactionHandler = new InteractionHandler();

module.exports = interactionHandler;
