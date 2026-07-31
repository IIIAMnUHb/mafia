module.exports = class Functions {
    constructor() {}
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    timeFormat(seconds) {
        seconds = Math.floor(seconds);

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        return [h, m, s]
            .map(v => String(v).padStart(2, '0'))
            .join(':');
    }
}