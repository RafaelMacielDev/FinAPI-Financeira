// Conceito e Ferramentas Node.js

// const express = require('express');
// const app = express();
// app.use(express.json());

//app.get("/courses", (request, response) => {
//    const query = request.query;
//    console.log(query);
//    return response.json(["Curso 1", "Curso 2", "Curso 3" ]);
//});

//app.post("/courses", (request, response) => {
//    const body = request.body;
//    console.log(body);
//    return response.json(["Curso 1", "Curso 2", "Curso 3", "Curso 4"]);
//});

//app.put("/courses/:id", (request, response) => {
//    const { id } = request.params;
//    console.log(id);
//    return response.json(["Curso 6", "Curso 2", "Curso 3", "Curso 4"]);
//});

//app.patch("/courses/:id", (request, response) => {
//    return response.json(["Curso 6", "Curso 7", "Curso 3", "Curso 4"]);
//});

//app.delete("/courses/:id", (request, response) => {
//    return response.json(["Curso 6", "Curso 2", "Curso 4"]);
//});

//app.listen(3333);

// ----------------------------------------=----------------------------------------

//API Financeira

// Requisitos
// - [x]Deve ser possivel criar uma conta
// - [x]Deve ser possivel buscar o extrato bancário do cliente
// - [x]Deve ser possível realizar um depósito
// - [x]Deve ser possível realizar um saque
// - [x]Deve ser possível buscar o extrato bancário do cliente por data
// - [x]Deve ser possível atualizar dados da conta do cliente
// - [x]Deve ser possível obter dados da conta do cliente
// - [x]Deve ser possível deletar uma conta

// Regras de negócio
// - [x]Não deve ser possível cadastrar uma conta com CPF já existente
// - [x]Não deve ser possível fazer depósito em uma conta não existente
// - [x]Não deve ser possível buscar extrato em uma conta não existente
// - [x]Não deve ser possível fazer saque em uma conta não existente
// - [x]Não deve ser possível excluir uma conta não existente
// - [x]Não deve ser possível fazer saque quando o saldo for insuficiente
// - [x]Deve ser possível retornar o balance

const express = require("express");
const { v4: uuidv4 } = require("uuid") 

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;
    const customer = customers.find((customer) => customer.cpf === cpf);
    if(!customer) {
        return response.status(400).json({error: "Customer not found"});
    }
    request.customer = customer;
    return next();
}

function getBalance(statement) {
        const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        }else {
            return acc - operation.amount;
        }
    }, 0);  
    return balance;
}


app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

    if(customerAlreadyExists) {
        return response.status(400).json({error: "Customer already exists!"});
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    return response.status(201).send();
});

app.use(verifyIfExistsAccountCPF);

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    customer.statement.push(statementOperation);
    return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;
    const balance = getBalance(customer.statement);
    if(balance < amount) {
    return response.status(400).json({error: "Insufficient funds!"})
    }
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };
    customer.statement.push(statementOperation);
    return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    );

    return response.json(statement);
});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    customers.splice(customer, 1);
    return response.status(200).json(customers);
})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);
    return response.json(balance);
})

app.listen(3333);