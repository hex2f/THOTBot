const mongoose = require('mongoose')
mongoose.connect(`mongodb://${process.argv[3]}/thot`)

const THOT = require('../thotjs/lib')

const bot = new THOT(process.argv[2], { commandsPath: process.cwd() + '/commands', prefix: '-' })
