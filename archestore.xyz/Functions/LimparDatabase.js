const { carrinhos } = require('../Database');

function limparDatabase() {
    for (const key of Object.keys(carrinhos._cache)) {
        delete carrinhos._cache[key];
    }
    if (carrinhos._col) {
        carrinhos._col.deleteMany({}).catch(() => {});
    }
    console.log('Database limpa com sucesso.');
}

module.exports = { limparDatabase };
