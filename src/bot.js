const { MessageEmbed, MessageAttachment } = require('discord.js')

const bot = {
    client: null,
    setClient: (client) => {
        this.bot.client = client
    },

    guild: null,
    setGuild: (guild) => {
        this.bot.guild = guild
    },

    getInfo: () => {
        return this.bot.guild
    },

    getUser: ({ userId }) => {
        return this.bot.guild.members.cache.get(userId).user
    },

    hasUserRole: ({ userId, roleId }) => {
        return this.bot.guild.members.cache
            .get(userId)
            .roles.cache.some((role) => role.id === roleId)
    },

    messageUser: ({ userId, attachments, ...props }) => {
        const msg = createMsg({...props})
        this.bot.client.users.fetch(userId).then(user => user.send(msg))

        if (attachments && attachments.first() !== undefined){
            const attachment = new MessageAttachment(attachments.first().url)
            this.bot.client.users.fetch(userId).then(user => user.send(attachment))
        }
    },
    
    messageChannel: ({ channelId, attachments = null, ...props }) => {
       
        const msg = createMsg({...props})
        
        this.bot.guild.channels.cache.get(channelId).send(msg)

        if (attachments && attachments.first() !== undefined){
            const attachment = new MessageAttachment(attachments.first().url)
            this.bot.guild.channels.cache.get(channelId).send(attachment)
        }

    },

}

const createMsg = ({ embed = false, title = null, color = null, description = null, image = null, thumbnail = null, authorName = null, authorIcon = null, fields = null }) => {
    let msg = description
        
    if(embed) {
        msg = new MessageEmbed()

        if (title) msg.setTitle(title)
        if (color) msg.setColor(color)
        if (description) msg.setDescription(description)
        if (image) msg.setImage(image)
        if (thumbnail) msg.setThumbnail(thumbnail)
        if (authorName && authorIcon) msg.setAuthor(authorName, authorIcon)
        if (fields) msg.addFields(fields)           
    }

    return msg
}

module.exports.bot = bot
