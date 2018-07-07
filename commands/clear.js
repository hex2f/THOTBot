let thot

const { Queue } = require('../dbmodels')

const handle = async (args, msg, bot) => {
    try {
        if(!thot) thot = bot
        let queue = await Queue.find({ server: msg.guild.id })
        if (queue === undefined || queue === null || queue.length === 0) {
            msg.channel.send(`😞 The queue is empty.`)
            return
        }
        await Queue.remove({ server: msg.guild.id })
        try { msg.member.voiceChannel.leave() } catch(e) {}
        msg.channel.send(`:wastebasket: Cleard the queue of ${queue.length} items.`)
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    command: 'clear',
    aliases: ['c'],
    name: 'clear',
    description: 'Clear the queue.',
    usage: [],
    action: handle,
    init: (t) => { thot = t; console.log(thot) }
}