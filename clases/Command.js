class Command {
    constructor({name, description, options}) {
        this.name = name;
        this.description = description;
        this.options = options || [];
    }
    async register(client) {
        await client.application.commands.create({
            name: this.name,
            description: this.description,
            options: this.options
        });
    }
    async execute(interaction) {}
}
module.exports = Command;