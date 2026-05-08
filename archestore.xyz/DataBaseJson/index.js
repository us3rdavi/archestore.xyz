const {
  JsonDatabase,
} = require("wio.db");

const produtos = new JsonDatabase({
  databasePath: "./DataBaseJson/produtos.json"
});

const automaticos = new JsonDatabase({
  databasePath: "./DataBaseJson/configautos.json"
});

const buttons = new JsonDatabase({
  databasePath: "./DataBaseJson/buttons.json"
});

const carrinhos = new JsonDatabase({
  databasePath: "./DataBaseJson/carrinhos.json"
});

const pagamentos = new JsonDatabase({
  databasePath: "./DataBaseJson/pagamentos.json"
});

const pedidos = new JsonDatabase({
  databasePath: "./DataBaseJson/pedidos.json"
});

const estatisticas = new JsonDatabase({
  databasePath: "./DataBaseJson/estatisticas.json"
});

const configuracao = new JsonDatabase({
  databasePath: "./DataBaseJson/configuracao.json"
});

const tickets = new JsonDatabase({
  databasePath: "./DataBaseJson/tickets.json"
});

const perms = new JsonDatabase({
  databasePath: "./DataBaseJson/perms.json"
});

const PermsAvançados = new JsonDatabase({
  databasePath: "./DataBaseJson/permsavancados.json"
});

const msgsauto = new JsonDatabase({
  databasePath: "./DataBaseJson/msgsauto.json"
});

const dbembed = new JsonDatabase({
  databasePath: "./DataBaseJson/dbembed.json"
});

const entregaslog = new JsonDatabase({
  databasePath: "./DataBaseJson/entregaslog.json"
});

const SystemMod = new JsonDatabase({
  databasePath: "./DataBaseJson/SystemMod.json"
});

const Temporario = new JsonDatabase({
  databasePath: "./DataBaseJson/Temporario.json"
});

const Convites = new JsonDatabase({
  databasePath: "./DataBaseJson/Convites.json"
});

const GuildsInvites = new JsonDatabase({
  databasePath: "./DataBaseJson/GuildsInvites.json"
});

const Emojis = new JsonDatabase({
  databasePath: "./DataBaseJson/Emojis.json"
});

const refounds = new JsonDatabase({
  databasePath: "./DataBaseJson/refounds.json"
});

const Compras = new JsonDatabase({
  databasePath: "./DataBaseJson/Compras.json"
});

const painelCards = new JsonDatabase({
  databasePath: "./DataBaseJson/painelCards.json"
});

const formularios = new JsonDatabase({
  databasePath: "./DataBaseJson/formularios.json"
});

module.exports = {
  produtos,
  buttons,
  carrinhos,
  pagamentos,
  pedidos,
  configuracao,
  estatisticas,
  GuildsInvites,
  tickets,
  perms,
  msgsauto,
  entregaslog,
  SystemMod,
  Temporario,
  Convites,
  Emojis,
  refounds,
  Compras,
  dbembed,
  painelCards,
  formularios,
}
