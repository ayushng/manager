const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

class EmbedBuilderUtils {
    createCareersEmbed(settings) {
        const embed = new EmbedBuilder()
            .setTitle(settings.embeds.careers_title)
            .setDescription(settings.embeds.careers_description)
            .setColor(settings.bot.color)
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/logo.png') // Replace with actual logo
            .addFields([
                {
                    name: `${settings.embeds.positions.Designer.emoji} Designer`,
                    value: settings.embeds.positions.Designer.description,
                    inline: true
                },
                {
                    name: `${settings.embeds.positions.Developer.emoji} Developer`,
                    value: settings.embeds.positions.Developer.description,
                    inline: true
                },
                {
                    name: `${settings.embeds.positions.Staff.emoji} Staff`,
                    value: settings.embeds.positions.Staff.description,
                    inline: true
                }
            ])
            .setFooter({ 
                text: settings.bot.footer,
                iconURL: 'https://cdn.discordapp.com/attachments/placeholder/footer-icon.png' // Replace with actual icon
            })
            .setTimestamp();

        return embed;
    }

    createPositionSelectionEmbed(settings) {
        const embed = new EmbedBuilder()
            .setTitle('Select Position')
            .setDescription('Please select the position you would like to apply for:')
            .setColor(settings.bot.color)
            .setFooter({ text: settings.bot.footer })
            .setTimestamp();

        return embed;
    }

    createPositionSelectMenu(settings) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('position_select')
            .setPlaceholder('Choose a position...')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('Designer')
                    .setDescription('Create stunning visuals and user interfaces')
                    .setValue('Designer')
                    .setEmoji('🎨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Developer')
                    .setDescription('Build and maintain applications and systems')
                    .setValue('Developer')
                    .setEmoji('💻'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Staff')
                    .setDescription('Help moderate and support our community')
                    .setValue('Staff')
                    .setEmoji('🛡️')
            ]);

        return new ActionRowBuilder().addComponents(selectMenu);
    }

    createQuestionEmbed(question, currentIndex, totalQuestions, position, settings) {
        const embed = new EmbedBuilder()
            .setTitle(`${position} Application - Question ${currentIndex}/${totalQuestions}`)
            .setDescription(`**${question.question}**\n\n*Please respond with your answer in your next message.*`)
            .setColor(settings.bot.color)
            .setFooter({ 
                text: `${settings.bot.footer} • Application in progress...`,
            })
            .setTimestamp();

        // Add progress bar
        const progressBar = this.createProgressBar(currentIndex, totalQuestions);
        embed.addFields([
            {
                name: 'Progress',
                value: progressBar,
                inline: false
            }
        ]);

        return embed;
    }

    createProgressBar(current, total) {
        const percentage = (current / total) * 100;
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        
        const filledBar = '▓'.repeat(filled);
        const emptyBar = '░'.repeat(empty);
        
        return `${filledBar}${emptyBar} ${Math.round(percentage)}%`;
    }

    createConfirmationEmbed(settings) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Application Submitted!')
            .setDescription(settings.application.confirmation_message)
            .setColor('#00ff00')
            .setFooter({ text: settings.bot.footer })
            .setTimestamp();

        return embed;
    }

    createHRNotificationEmbed(applicationData, settings) {
        const embed = new EmbedBuilder()
            .setTitle('📋 New Career Application')
            .setDescription(`**Position:** ${applicationData.position}`)
            .setColor(settings.bot.color)
            .addFields([
                {
                    name: '👤 Applicant',
                    value: `<@${applicationData.userId}>\n${applicationData.username}#${applicationData.discriminator}`,
                    inline: true
                },
                {
                    name: '🕒 Submitted',
                    value: new Date(applicationData.submittedAt).toLocaleString(),
                    inline: true
                },
                {
                    name: '🆔 Application ID',
                    value: `\`${applicationData.id}\``,
                    inline: true
                }
            ])
            .setFooter({ text: settings.bot.footer })
            .setTimestamp();

        // Add answers as fields
        Object.entries(applicationData.answers).forEach(([questionId, answer], index) => {
            // Find the original question text
            const questionText = this.getQuestionText(questionId, applicationData.position);
            
            embed.addFields([
                {
                    name: `📝 ${questionText}`,
                    value: answer.length > 1024 ? answer.substring(0, 1021) + '...' : answer,
                    inline: false
                }
            ]);
        });

        return embed;
    }

    getQuestionText(questionId, position) {
        // This is a simplified version - in a real implementation, 
        // you'd load the questions config and find the matching question
        const questionMap = {
            'design_experience': 'Design Experience',
            'design_software': 'Design Software',
            'portfolio': 'Portfolio',
            'design_style': 'Design Style',
            'programming_experience': 'Programming Experience',
            'programming_languages': 'Programming Languages',
            'frameworks': 'Frameworks & Technologies',
            'github_portfolio': 'GitHub/Portfolio',
            'database_experience': 'Database Experience',
            'previous_experience': 'Previous Experience',
            'timezone': 'Timezone & Availability',
            'conflict_resolution': 'Conflict Resolution',
            'community_contribution': 'Community Contribution',
            'availability': 'Weekly Availability',
            'motivation': 'Motivation'
        };

        return questionMap[questionId] || questionId;
    }

    createRulesEmbed(settings) {
        const embed = new EmbedBuilder()
            .setTitle('📋 CLA Designs Server Rules')
            .setDescription('Please read and follow all server rules. Click the buttons below for additional information.')
            .setColor(settings.bot.color)
            .setThumbnail('https://cdn.discordapp.com/attachments/placeholder/rules-icon.png')
            .addFields([
                {
                    name: '1️⃣ Respect Everyone',
                    value: 'Treat all members with respect. No harassment, bullying, or discrimination.',
                    inline: false
                },
                {
                    name: '2️⃣ No Spam or Self-Promotion',
                    value: 'Avoid excessive posting, advertising, or self-promotion without permission.',
                    inline: false
                },
                {
                    name: '3️⃣ Keep Content Appropriate',
                    value: 'No NSFW, violent, or illegal content. Keep discussions family-friendly.',
                    inline: false
                },
                {
                    name: '4️⃣ Use Proper Channels',
                    value: 'Post content in the appropriate channels. Check channel descriptions.',
                    inline: false
                },
                {
                    name: '5️⃣ No Drama or Arguments',
                    value: 'Keep personal disputes private. Contact staff if issues arise.',
                    inline: false
                },
                {
                    name: '⚠️ Infractions System',
                    value: 'Rule violations result in points. **16 points = automatic ban.**',
                    inline: false
                }
            ])
            .setFooter({ 
                text: `${settings.bot.footer} • Questions? Contact staff`,
                iconURL: 'https://cdn.discordapp.com/attachments/placeholder/footer-icon.png'
            })
            .setTimestamp();

        return embed;
    }

    createPointsActionEmbed(action, targetUser, amount, reason, newTotal, moderator) {
        const actionText = action === 'added' ? 'Added' : 'Removed';
        const actionEmoji = action === 'added' ? '➕' : '➖';
        const color = action === 'added' ? '#ff6b6b' : '#51cf66';

        const embed = new EmbedBuilder()
            .setTitle(`${actionEmoji} Points ${actionText}`)
            .setColor(color)
            .addFields([
                {
                    name: '👤 User',
                    value: `${targetUser}`,
                    inline: true
                },
                {
                    name: `📊 Points ${actionText}`,
                    value: `${amount}`,
                    inline: true
                },
                {
                    name: '🔢 New Total',
                    value: `${newTotal}`,
                    inline: true
                },
                {
                    name: '📝 Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: '👮 Moderator',
                    value: `${moderator}`,
                    inline: true
                }
            ])
            .setFooter({ text: newTotal >= 16 ? '⚠️ User has reached ban threshold!' : `Current points: ${newTotal}/16` })
            .setTimestamp();

        return embed;
    }

    createPointsCheckEmbed(user, points, history) {
        const embed = new EmbedBuilder()
            .setTitle(`📊 Points for ${user.username}`)
            .setColor(points >= 16 ? '#ff0000' : points >= 10 ? '#ff9500' : '#00ff00')
            .addFields([
                {
                    name: '🔢 Current Points',
                    value: `${points}/16`,
                    inline: true
                },
                {
                    name: '⚠️ Status',
                    value: points >= 16 ? '🔴 Ban Threshold' : points >= 10 ? '🟠 Warning Level' : '🟢 Good Standing',
                    inline: true
                }
            ])
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        // Add recent history if available
        if (history.length > 0) {
            const historyText = history.slice(-5).map(entry => {
                const action = entry.action === 'add' ? '➕' : '➖';
                const date = new Date(entry.timestamp).toLocaleDateString();
                return `${action} ${entry.amount} - ${entry.reason} (${date})`;
            }).join('\n');

            embed.addFields([
                {
                    name: '📋 Recent History',
                    value: historyText || 'No recent activity',
                    inline: false
                }
            ]);
        }

        return embed;
    }

    createAutoBanEmbed(user, points) {
        const embed = new EmbedBuilder()
            .setTitle('🔨 Auto-Ban Executed')
            .setDescription(`User has been automatically banned for reaching ${points} infraction points.`)
            .setColor('#ff0000')
            .addFields([
                {
                    name: '👤 Banned User',
                    value: `${user}`,
                    inline: true
                },
                {
                    name: '📊 Total Points',
                    value: `${points}`,
                    inline: true
                },
                {
                    name: '⚡ Action',
                    value: 'Automatic Ban',
                    inline: true
                }
            ])
            .setFooter({ text: 'CLA Designs Auto-Moderation System' })
            .setTimestamp();

        return embed;
    }

    createOrdersEmbed(settings, orderStatus) {
        const statusEmojis = {
            'available': '🟢',
            'delayed': '🟠',
            'closed': '🔴'
        };

        const statusTexts = {
            'available': 'Available - Orders are open and accepted',
            'delayed': 'Delayed - Orders are accepted but may be slow',
            'closed': 'Closed - No new orders allowed at this time'
        };

        const embed = new EmbedBuilder()
            .setTitle('🛒 CLA Designs Ordering System')
            .setDescription('Professional design services for the ER:LC community')
            .setColor(settings.bot.color)
            .addFields([
                {
                    name: '📊 Current Status',
                    value: `${statusEmojis[orderStatus.status]} ${statusTexts[orderStatus.status]}`,
                    inline: false
                },
                {
                    name: '🎨 Available Services',
                    value: '**Liveries** - Custom vehicle designs\n**Avatars** - Profile pictures and character art\n**ELS** - Emergency lighting setups\n**Other** - Custom graphics and designs',
                    inline: false
                },
                {
                    name: '💰 Pricing',
                    value: '**Liveries:** $15-50 depending on complexity\n**Avatars:** $10-25 per design\n**ELS:** $20-40 per setup\n**Custom Work:** Quote on request',
                    inline: false
                },
                {
                    name: '⏱️ Typical Turnaround',
                    value: '3-7 business days (may vary during busy periods)',
                    inline: true
                },
                {
                    name: '📞 Support',
                    value: 'Questions? Contact our design team!',
                    inline: true
                }
            ])
            .setFooter({ 
                text: `${settings.bot.footer} • Click below to place an order`,
                iconURL: 'https://cdn.discordapp.com/attachments/placeholder/footer-icon.png'
            })
            .setTimestamp();

        return embed;
    }

    createOrderStatusUpdateEmbed(status, emoji, statusText, updatedBy) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Order Status Updated')
            .setDescription(`Order system status has been changed to: ${emoji} **${statusText}**`)
            .setColor(status === 'available' ? '#00ff00' : status === 'delayed' ? '#ff9500' : '#ff0000')
            .addFields([
                {
                    name: '👮 Updated By',
                    value: `${updatedBy}`,
                    inline: true
                },
                {
                    name: '🕒 Updated At',
                    value: new Date().toLocaleString(),
                    inline: true
                }
            ])
            .setFooter({ text: 'CLA Designs Management System' })
            .setTimestamp();

        return embed;
    }

    createOrderTypeSelectEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('🛒 Select Order Type')
            .setDescription('Please select the type of design service you need:')
            .setColor('#0099ff')
            .addFields([
                {
                    name: '🎨 Liveries',
                    value: 'Custom vehicle designs and paint jobs',
                    inline: true
                },
                {
                    name: '🧑‍🎨 Avatars',
                    value: 'Profile pictures and character artwork',
                    inline: true
                },
                {
                    name: '🚨 ELS',
                    value: 'Emergency lighting system setups',
                    inline: true
                },
                {
                    name: '🗂️ Others',
                    value: 'Custom graphics, logos, and other designs',
                    inline: true
                }
            ])
            .setFooter({ text: 'Select your service type from the menu below' })
            .setTimestamp();

        return embed;
    }
}

module.exports = new EmbedBuilderUtils();
