const { MongoClient } = require("mongodb");

module.exports = class Database {
    constructor(url) {
        this.url = url;
        this.client = new MongoClient(url);
    }
    async init() {
        console.log('[DB] Init...')
        await this.client.connect();
        console.log('[DB] Connected successfuly')
        this.db = this.client.db('mafia');
        return this;
    }
    /**
     * Создаёт событие игры Mafia
     * @param {Object} params
     * @param {string} params.mode Тип мафии
     * @param {Object} params.modeData Данные которые нужны моду
     * @param {string} params.owner        ID владельца
     * @param {'picks'|'game'|'final'} params.state  Состояние игры
     * @param {Array<{id: string, role?: string, foll?: number, warns?: number, alive?: boolean}>} params.members
     * @param {'day'|'night'|'maintenance'} params.time  Время суток
     * @param {{ text: string, voice?: string, thread?: string, mafia?: string, threadMessage?: string, chatMessage?: string }} params.channels
     * @returns {Promise<Object>} Результат insertOne
     */
    async createMafia({ mode, modeOptions, owner, state, members, server, time, channels }) {
        const events = this.db.collection('events');
        const object = {
            mode, 
            modeOptions,
            owner,
            state,
            members: members ?? [],
            chat: true,
            doctorChoices: [],
            beststep: null,
            time,
            server,
            channels,
            startedAt: null
        };
        return await events.insertOne(object);
    }
    async findMafia({ text, voice, server, thread, owner, _id }) {
        const events = this.db.collection('events');
        const event = await events.findOne({
            $or: [
                { "channels.text": text },
                { "channels.voice": voice },
                { "channels.thread": thread },
                { "server.id": server },
                { "owner": owner },
                { "_id": _id }
            ]
        });
        return event;
    }
    async findAllMafia(params = {}) {
        const events = this.db.collection('events');
        return events.find(params).toArray();
    }
    async editMafia(_id, regexState) {
        const events = this.db.collection('events');
        const event = await events.updateOne({ _id }, regexState);
        return event;
    }
    async deleteMafia(_id) {
        const events = this.db.collection('events');
        await events.deleteOne({ _id })
    }
    /**
     * Дает свободный сервер
     * @returns {Promise<{
     *  _id: string, roles: Array<string>, status: 'allocated'|'unallocated', name: string
     * }|null>} Результат insertOne
     */
    async getFreeServer() {
        const servers = this.db.collection('servers');
        const [server] = await servers.aggregate([
            { $match: { status: 'notallocated' } },
            { $sample: { size: 1 } }
        ]).toArray();
        if(server) {
            await servers.updateOne({ _id: server._id }, { $set: { status: 'allocated' } });
            return server;
        } else {
            return null;
        }
    }
    async unalocateServer(_id) {
        const servers = this.db.collection('servers');
        if(typeof _id == 'object') {
            console.log(_id);
            await servers.bulkWrite(_id.map(x => ({
                updateOne: {
                    filter: { _id: x },
                    update: { $set: { status: 'notallocated' } }
                }
            })))
        } else {
            await servers.updateOne({ _id }, { $set: { status: 'notallocated' } });
        }
        
    }
    async getServerInfo(_id) {
        const servers = this.db.collection('servers');
        return servers.findOne({ _id })
    }
    async findAllServers(params = {}) {
        const servers = await this.db.collection('servers');
        return servers.find(params).toArray();
    }
    async freeServerCount() {
        const servers = this.db.collection('servers');
        return await servers.countDocuments({ status: 'notallocated' });
    }
    /**
     * Создаёт голосование
     * @param {Object} params
     * @param {string} params.mafia        ID игры
     * @param {'voting'|'finished'|'waiting'} params.state  Состояние игры
     * @param {Array<number>} params.candidates
     * @param {Array<{id:number, voteFor:number}>} params.votes
     * @param {{ ownerMenu:string, activeVote:string|null }} params.messages
     * @returns {Promise<Object>} Результат insertOne
     */
    async createVote({ mafia, state, candidates, votes, messages }) {
        const vote = this.db.collection('votes');
        vote.insertOne({
            mafia,
            state,
            candidates,
            votes,
            messages
        })
    }
    async findVote({ ownerMenu, activeVote, mafia, _id }) {
        const votes = this.db.collection('votes');
        const vote = await votes.findOne({
            $or: [
                { "messages.ownerMenu": ownerMenu },
                { "messages.activeVote": activeVote },
                { "mafia": mafia },
                { "_id": _id }
            ]
        });
        return vote;
    }
    async editVote(_id, regexState) {
        const votes = this.db.collection('votes');
        const vote = await votes.updateOne({ _id }, regexState);
        return vote;
    }
    async deleteVote(_id) {
        const votes = this.db.collection('votes');
        await votes.deleteOne({ _id })
    }

}