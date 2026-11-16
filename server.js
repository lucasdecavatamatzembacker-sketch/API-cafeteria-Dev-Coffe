// API da Dev Coffee - AP2 de Back-End
// Feita só com o modulo http do Node, sem express nem nada instalado pelo npm

const http = require('http');
const { URL } = require('url');

// se não passar a porta pela variavel de ambiente usa a 3000
const PORT = process.env.PORT || 3000;

// esses são os unicos status que o pedido pode ter
const statusValidos = ['pendente', 'pronto', 'cancelado'];

// como não tem banco de dados os pedidos ficam guardados nesse array mesmo
// (se reiniciar o servidor perde tudo)
let pedidos = [];

// contador pro id, assim mesmo que apague um pedido o id não se repete
let proximoId = 1;

// funcao pra não ficar repetindo o writeHead + JSON.stringify em todo lugar
function responderJson(res, codigo, dados) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(dados));
}

// le o body da requisicao
// o body não chega de uma vez, ele vem em pedaços (chunks), entao vou juntando
// tudo no 'data' e só quando chega no 'end' que da pra transformar em JSON
function lerBody(req, callback) {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    // o try/catch é pra se mandarem um JSON errado o servidor não cair,
    // ai só devolve o erro pra quem chamou
    try {
      const json = JSON.parse(body);
      callback(null, json);
    } catch (erro) {
      callback(erro, null);
    }
  });
}

// procura o pedido pelo id, se não achar retorna null
function buscarPedido(id) {
  for (let i = 0; i < pedidos.length; i++) {
    if (pedidos[i].id === id) {
      return pedidos[i];
    }
  }
  return null;
}

// GET /orders
// se vier ?status=alguma coisa na url eu filtro, senão mostra todos
function listarPedidos(req, res, url) {
  const status = url.searchParams.get('status');

  if (status) {
    const filtrados = pedidos.filter(p => p.status === status);
    responderJson(res, 200, filtrados);
  } else {
    responderJson(res, 200, pedidos);
  }
}

// GET /orders/:id
function mostrarPedido(req, res, id) {
  const pedido = buscarPedido(id);

  if (!pedido) {
    responderJson(res, 404, { erro: 'Pedido nao encontrado' });
    return;
  }

  responderJson(res, 200, pedido);
}

// POST /orders
function criarPedido(req, res) {
  lerBody(req, (erro, dados) => {
    // aqui testo se deu erro no parse e tambem se o que veio é um objeto mesmo
    // (JSON.parse aceita "null" ou um array, e isso não serve pra criar pedido)
    if (erro || dados === null || typeof dados !== 'object' || Array.isArray(dados)) {
      responderJson(res, 400, { erro: 'JSON invalido' });
      return;
    }

    // client e item são obrigatorios e não podem ser texto vazio
    if (typeof dados.client !== 'string' || dados.client.trim() === '' ||
        typeof dados.item !== 'string' || dados.item.trim() === '') {
      responderJson(res, 400, { erro: 'Os campos client e item sao obrigatorios' });
      return;
    }

    // todo pedido novo começa como pendente
    const novoPedido = {
      id: proximoId,
      client: dados.client,
      item: dados.item,
      status: 'pendente'
    };

    proximoId++;
    pedidos.push(novoPedido);

    responderJson(res, 201, novoPedido);
  });
}

// PATCH /orders/:id/status
// só muda o status, o resto do pedido fica igual
function atualizarStatus(req, res, id) {
  lerBody(req, (erro, dados) => {
    const pedido = buscarPedido(id);

    if (!pedido) {
      responderJson(res, 404, { erro: 'Pedido nao encontrado' });
      return;
    }

    if (erro || dados === null || typeof dados !== 'object') {
      responderJson(res, 400, { erro: 'JSON invalido' });
      return;
    }

    // não deixa colocar um status que não ta na lista
    if (!statusValidos.includes(dados.status)) {
      responderJson(res, 400, { erro: 'Status invalido, use: pendente, pronto ou cancelado' });
      return;
    }

    pedido.status = dados.status;
    responderJson(res, 200, pedido);
  });
}

// DELETE /orders/:id
function deletarPedido(req, res, id) {
  const pedido = buscarPedido(id);

  if (!pedido) {
    responderJson(res, 404, { erro: 'Pedido nao encontrado' });
    return;
  }

  // crio um array novo sem o pedido que foi apagado
  pedidos = pedidos.filter(p => p.id !== id);

  // 204 não tem corpo, por isso não mando JSON nem o Content-Type
  res.writeHead(204);
  res.end();
}

// aqui é onde chegam todas as requisicoes e eu decido qual funcao chamar
const server = http.createServer((req, res) => {
  // uso o URL pra separar o caminho da query string (?status=...)
  const url = new URL(req.url, 'http://localhost:' + PORT);
  const caminho = url.pathname;
  const metodo = req.method;

  // quebro o caminho nas barras, ex: /orders/1/status vira ['orders', '1', 'status']
  const partes = caminho.split('/').filter(p => p !== '');

  if (partes[0] === 'orders') {
    // /orders
    if (partes.length === 1) {
      if (metodo === 'GET') {
        listarPedidos(req, res, url);
        return;
      }
      if (metodo === 'POST') {
        criarPedido(req, res);
        return;
      }
    }

    // o id vem como texto da url, entao converto pra numero
    const id = Number(partes[1]);

    // /orders/:id
    if (partes.length === 2 && Number.isInteger(id)) {
      if (metodo === 'GET') {
        mostrarPedido(req, res, id);
        return;
      }
      if (metodo === 'DELETE') {
        deletarPedido(req, res, id);
        return;
      }
    }

    // /orders/:id/status
    if (partes.length === 3 && partes[2] === 'status' && Number.isInteger(id) && metodo === 'PATCH') {
      atualizarStatus(req, res, id);
      return;
    }
  }

  // se chegou aqui é porque nenhuma rota bateu, entao é 404
  responderJson(res, 404, { erro: 'Rota nao encontrada: ' + metodo + ' ' + caminho });
});

server.listen(PORT, () => {
  console.log('Servidor rodando em http://localhost:' + PORT);
});
