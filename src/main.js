const { Client } = require('discord.js')

const { bot } = require('./bot')
const support = require('./support')

const secret = require('../secret.json')

const client = new Client()

client.login(secret.DISCORD_TOKEN)

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} !`)
    client.user
        .setPresence({
            activity: { name: 'le chant du pingouin', type: 'LISTENING' },
            status: 'online',
        })
        .then()
        .catch(console.error)
    bot.setClient(client)
    bot.setGuild(client.guilds.cache.get(secret.SUPPORT_GUILD))
    support.setBot(bot)
})

client.on('message', (message) => {
    if (!message.author.bot) {
        if (message.channel.type === 'dm') {
            // DM
            support.onReceiveDM(message)
            console.log('----------------')
        } else if (message.guild.id == secret.SUPPORT_GUILD) {
            if (
                [
                    '/pause',
                    '/continue',
                    '/status',
                    '/block',
                    '/unblock',
                    '/close',
                    '/archive'
                ].includes(message.content)
            ) {
                support.onReceiveStatusMsg(message)
            }
            else if (message.content === '/help') {
                support.onReceiveHelpMsg(message)
            } else {
                support.onReceiveSupportMsg(message)
            }
            console.log('----------------')
        }
    }
})
