const _config = require("./config.json");

export class Command {

    constructor(raw_message, user) {
        this.text = raw_message.replace(_config.command_prefix, "");
        this.user = user
    }
}