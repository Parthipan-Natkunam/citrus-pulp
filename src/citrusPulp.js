import config from '../citrus-pulp-config.js';


class CitrusPulp {
    #config;

    constructor() {
        this.#config = config;
    }

    get config() {
        return this.#config;
    }

    init() {
        console.table(this.config);
    }
}


export default new CitrusPulp();