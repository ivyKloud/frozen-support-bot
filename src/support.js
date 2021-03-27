const model = require('./model')
const db = require('quick.db')

const secret = require('../secret.json')
const colors = require('./lib/colors')
const topics = require('./lib/topics')

const diffDate = require('./utils/diffDate')

const defaultIcon = 'https://i.imgur.com/AsYSVWe.png'
const defaultUser = 'Azuria Support Team'

const support = {
    bot: null,
    setBot: (bot) => {
        this.bot = bot
        model.setTable(new db.table('Support'))
    },

    onReceiveDM: async (message) => {
        console.log('I received a DM')
        let supportChannel = await model.getSupportIdByUser(message.author.id)
        let support = null

        if (supportChannel) {
            console.log(`supportChannel already exists : ${supportChannel}`)
            support = model.getSupport(supportChannel)
        } else {
            const index = await model.getNextIndex()
            channel = await this.bot.guild.channels.create(
                `🔵_${index}_${message.author.username}-${message.author.discriminator}`,
                { type: 'text' }
            )
            channel.setParent(secret.SUPPORT_WAITING_CATEGORY)
            channel.setTopic(topics.waiting)
            console.log(`new supportChannel : ${channel.id}`)
            supportChannel = channel.id

            const twoDigits = (n) => ('0' + n).slice(-2)
            const d = new Date()

            const fullDate = `${twoDigits(d.getDate())}/${twoDigits(
                d.getMonth() + 1
            )}/${d.getFullYear()} à ${twoDigits(d.getHours())}h${twoDigits(
                d.getMinutes()
            )}`

            support = {
                id: channel.id,
                index: index,
                user: {
                    id: message.author.id,
                    username: message.author.username,
                    discriminator: message.author.discriminator,
                },
                createDate: fullDate,
                timestamp: d.getTime()
            }
            model.setSupportIdByUser(message.author.id, channel.id)

            model.setSupport(channel.id, support)
            model.setSupportStatus(channel.id, topics.waiting)
            this.bot.messageChannel({
                embed: true,
                channelId: supportChannel,
                color: colors.green,
                authorName: `Nouveau Ticket #${support.index}`,
                authorIcon: defaultIcon,
                thumbnail: message.author.avatarURL(),
                fields: [
                    {
                        name: 'Ouvert par :',
                        value: `${message.author}`,
                    },
                    {
                        name: 'Discord Tag :',
                        value: `${message.author.username}#${message.author.discriminator}`,
                    },
                    {
                        name: 'Discord ID :',
                        value: `${message.author.id}`,
                    },
                ],
            })

            this.bot.messageUser({
                userId: message.author.id,
                embed: true,
                authorName: `Nouveau Ticket #${support.index}`,
                authorIcon: defaultIcon,
                color: colors.green,
                description: "Votre demande a bien été prise en compte.\nNous reviendrons vers vous dans les plus brefs délais.",
            })
        }
        const isBlocked = await model.isSupportBlocked(supportChannel)

        if (isBlocked) {
            message.react('⛔')
        } else {
            this.bot.messageChannel({
                embed: true,
                authorName: `${message.author.username}#${message.author.discriminator}`,
                authorIcon: message.author.avatarURL(),
                color: colors.blue,
                channelId: supportChannel,
                description: message.content,
                attachments: message.attachments,
            })
        }
    },

    onReceiveSupportMsg: async (message) => {
        const channelId = message.channel.id
        const support = await model.getSupport(channelId)
        if (support) {
            console.log('I received a msg from support')
            const isPaused = await model.isSupportPaused(channelId)
            const isBlocked = await model.isSupportBlocked(channelId)
            const isClosed = await model.isSupportClosed(channelId)
            if (!message.content.startsWith('/anon ') && message.content.startsWith('/')) {
                this.bot.messageChannel({
                    embed: true,
                    authorName: `Azuria Support Bot`,
                    authorIcon: defaultIcon,
                    color: colors.orange,
                    channelId: channelId,
                    description: "Commande incorrecte.",
                    attachments: null,
                })
            }else if (isBlocked) {
                message.react('⛔')
            } else if (isPaused) {
                message.react('⏳')
            } else if (isClosed) {
                message.react('🔒')
            } else {
                let supportUser =
                    this.bot.guild.member(message.author).nickname ||
                    message.author.username
                let supportIcon = message.author.avatarURL()
                let msg = message.content
                message.react('☑️')
                if (message.content.startsWith('/anon ')) {
                    supportUser = defaultUser
                    supportIcon = defaultIcon

                    msg = message.content.split(' ').slice(1).join(' ')
                    message.react('🕵')
                }

                this.bot.messageUser({
                    userId: support.user.id,
                    embed: true,
                    authorName: supportUser,
                    authorIcon: supportIcon,
                    color: colors.blue,
                    description: msg,
                    attachments: message.attachments,
                })
            }
        } else {
            console.log('other channels')
        }
    },

    onReceiveStatusMsg: async (message) => {

        const channelId = message.channel.id
        const support = await model.getSupport(channelId)
        if (support) {

            const sendStatus = async () => {
                const user = await this.bot.client.users.fetch(support.user.id)
                const status = await model.getSupportStatus(channelId)
                const nbDays = diffDate(support.timestamp, Date.now())
    
                this.bot.messageChannel({
                    embed: true,
                    channelId: channelId,
                    color: colors.purple,
                    authorName: `Ticket #${support.index}`,
                    authorIcon: defaultIcon,
                    thumbnail: user.avatarURL(),
                    fields: [
                        {
                            name: 'Ouvert par :',
                            value: `${user}`,
                        },
                        {
                            name: 'Le :',
                            value: `${support.createDate}`,
                        },
                        {
                            name: 'Statut :',
                            value: `${status}`,
                        },
                        {
                            name: 'Demande ouverte depuis :',
                            value: `${nbDays} jour${nbDays > 1 ? 's' : ''}`,
                        },
                    ],
                })
            }

            const isBlocked = await model.isSupportBlocked(channelId)
            const isPaused = await model.isSupportPaused(channelId)
            const isClosed = await model.isSupportClosed(channelId)
            const msgPause = message.content === '/pause'
            const msgContinue = message.content === '/continue'
            const msgBlock = message.content === '/block'
            const msgUnblock = message.content === '/unblock'
            const msgStatus = message.content === '/status'
            const msgClose = message.content === '/close'
            const msgArchive = message.content === '/archive'

            if (msgStatus) {
                sendStatus()
            } else {
                let msg = ''
                let color = null
                let newTopic = null
                let msgUser = null

                if (isBlocked) {
                    if (msgUnblock) {
                        await model.unBlockSupport(channelId)
                        model.setSupportStatus(
                            channelId,
                            isPaused ? topics.pause : topics.open
                        )
                        msg = `L'utilisateur a été débloqué.\nSes nouveaux messages seront transmis dans ce canal.\n${
                            isPaused
                                ? 'Vos messages ne lui seront pas transmis. (Canal en pause.)'
                                : 'Vos messages lui seront également transmis.'
                        }`
                        msgUser =
                            'Vous avez été débloqué. \nVos messages seront de nouveau transmis au Support.'
                        color = colors.green
                        newTopic = isPaused ? topics.pause : topics.open
                    } else {
                        msg =
                            "L'utilisateur est bloqué.\nVous ne pouvez pas faire cette action avant de l'avoir débloqué."
                        color = colors.orange
                    }
                } else if (isClosed) {
                    if (msgArchive) {
                        await sendStatus()

                        await model.unCloseSupport(channelId)
                        await model.deleteSupport(channelId)
                        await model.deleteSupportStatus(channelId)

                        message.channel.setParent(secret.SUPPORT_ARCHIVED_CATEGORY)

                        msg = `Demande archivée.`
                        color = colors.purple
                    } else {
                        msg =
                            "Cette demande est résolue.\nVous ne pouvez pas faire cette action."
                        color = colors.orange
                    }
                } else {
                    if (msgPause) {
                        if (isPaused) {
                            msg = 'Ce canal est déjà en pause.'
                            color = colors.orange
                        } else {
                            await model.pauseSupport(channelId)
                            model.setSupportStatus(channelId, topics.pause)
                            msg =
                                "Ce canal a été mis en pause. \nLes nouveux messages ne seront pas transmis à l'utilisateur."
                            color = colors.yellow
                            newTopic = topics.pause
                        }
                    } else if (msgContinue) {
                        if (isPaused) {
                            await model.unPauseSupport(channelId)
                            model.setSupportStatus(channelId, topics.open)
                            msg =
                                "Ce canal n'est plus en pause. \nLes nouveaux messages seront transmis à l'utilisateur."
                            color = colors.green
                            newTopic = topics.open
                        } else {
                            msg = "Ce canal n'est pas en pause."
                            color = colors.orange
                        }
                    } else if (msgBlock) {
                        await model.blockSupport(channelId)
                        model.setSupportStatus(channelId, topics.blocked)
                        msg =
                            "L'utilisateur a été bloqué. \nSes messages ne seront plus transmis dans ce canal."
                        color = colors.red
                        newTopic = topics.blocked
                        msgUser =
                            'Vous avez été bloqué. \nVos messages ne seront plus transmis au Support.'
                    } else if (msgClose) {
                        await model.deleteUserSupport(support.user.id)
                        await model.closeSupport(channelId)
                        model.setSupportStatus(channelId, topics.closed)
                        msg =
                            "La demande a été marquée comme résolue.\nVos messages ne seront plus transmis à l'utilisateur."
                        color = colors.purple
                        newTopic = topics.closed
                        msgUser =
                            'Votre demande a été marquée comme résolue.\nMerci de ne pas répondre après ce message.'
                    } else if (msgUnblock) {
                        msg = "L'utilisateur n'est pas bloqué."
                        color = colors.orange
                    } else if (msgArchive) {
                        msg = "La demande n'est pas résolue."
                        color = colors.orange
                    }
                }

                // if (newNameColor)
                //     message.channel.setName(
                //         `${newNameColor}_${support.index}_${support.user.username}-${support.user.discriminator}`
                //     )

                if (newTopic) message.channel.setTopic(newTopic)

                this.bot.messageChannel({
                    embed: true,
                    authorName: `Azuria Support Bot`,
                    authorIcon: defaultIcon,
                    color: color,
                    channelId: channelId,
                    description: msg,
                    attachments: null,
                })

                if (msgUser)
                    this.bot.messageUser({
                        userId: support.user.id,
                        embed: true,
                        authorName: defaultUser,
                        authorIcon: defaultIcon,
                        color: color,
                        description: msgUser,
                        attachments: null,
                    })
            }
        }
    },
}
module.exports = support
