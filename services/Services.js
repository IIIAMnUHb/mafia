const { database } = require("../config");
const Database = require("./Database");
const Functions = require("./Functions");
const Messages = require("./Messages");

class Services {
    async init() {
        this.database = await new Database(database).init();
        this.messages = new Messages();
        this.functions = new Functions();

        return this;
    }
}

module.exports = new Services();