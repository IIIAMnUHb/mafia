const { BaseInteraction } = require('discord.js')

class Interaction {
    constructor(customName) {
        this.customName = customName;
    }
    /**
     * @constructor
     * @param {BaseInteraction} interaction
     */
    async execute(interaction) {}
}
module.exports = Interaction;