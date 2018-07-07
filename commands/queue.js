let thot

const { Queue } = require('../dbmodels')

const handle = async (args, msg, bot) => {
    try {
        if(!thot) thot = bot
        let queue = await Queue.find({server: msg.guild.id}, null, {sort: {added: 1 }})
        if (queue === undefined || queue === null || queue.length === 0) {
            msg.channel.send(`😞 The queue is empty.`)
            return
        }

        if (msg.member.roles.last().calculatedPosition < thot.client.guilds.get(msg.guild.id).members.get(thot.client.user.id).roles.last().calculatedPosition) {
            msg.channel.send(`😞 You don't have access to that command.`)
            return
        }

        let str = ':notes: **The Current Queue**'
        
        queue.forEach(q => str += `\n**[${q.title}]** - Requested by *${q.requestedByName}*`)

        msg.channel.send(str)
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    command: 'queue',
    aliases: ['q'],
    name: 'queue',
    description: 'Get a list of the current queue.',
    usage: [],
    action: handle,
    init: (t) => { thot = t; console.log(thot) }
}