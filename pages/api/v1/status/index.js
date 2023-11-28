import database from "../../../../infra/database.js"

// para validar os testes é necessário o servidor web e 
// o serviço do banco de dados estarem rodando

//comando para inicializar o servidor web
//npm run dev

async function status(request, response) {
    const result = await database.query("select 1 + 1 as sum;")
    console.log(result.rows);
    response.status(200).json("Testé são um teste")
}

export default status;