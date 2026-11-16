# Dev Coffee API

Trabalho AP2 de Desenvolvimento Back-End. É uma API para gerenciar os pedidos da cafeteria Dev Coffee, feita só com o módulo `http` nativo do Node.js (sem Express e sem nenhuma dependência).

**Autor:** Lucas Matzembacker

## Como rodar

Precisa ter o Node.js instalado.

```bash
npm start
```

O servidor sobe em `http://localhost:3000`.

## Rotas

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | /orders | Lista todos os pedidos (aceita `?status=pendente`) |
| GET | /orders/:id | Mostra um pedido |
| POST | /orders | Cria um pedido |
| PATCH | /orders/:id/status | Muda o status do pedido |
| DELETE | /orders/:id | Apaga um pedido |

Os status aceitos são `pendente`, `pronto` e `cancelado`.

## Exemplos com cURL

Criar um pedido:

```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d "{\"client\": \"Ana\", \"item\": \"Cappuccino\"}"
```

Listar todos os pedidos:

```bash
curl http://localhost:3000/orders
```

Listar só os pendentes:

```bash
curl "http://localhost:3000/orders?status=pendente"
```

Buscar o pedido 1:

```bash
curl http://localhost:3000/orders/1
```

Mudar o status do pedido 1:

```bash
curl -X PATCH http://localhost:3000/orders/1/status -H "Content-Type: application/json" -d "{\"status\": \"pronto\"}"
```

Apagar o pedido 1:

```bash
curl -X DELETE http://localhost:3000/orders/1
```

Obs: no PowerShell tem que usar `curl.exe` no lugar de `curl`.

## Respostas de erro

- `400` quando falta `client` ou `item`, quando o JSON está errado ou quando o status não é válido
- `404` quando o pedido não existe ou a rota não existe
