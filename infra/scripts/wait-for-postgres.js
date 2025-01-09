const { exec } = require("node:child_process");

let contador = 0; // Contador global para o relógio
let relogio = ["|", "/", "–", "\\"]; // Símbolos do relógio

function checkPostgres() {
    exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

    function handleReturn(error, stdout) {
        if (stdout.search("accepting connections") === -1) {
            // Move o cursor para o início da linha e exibe o relógio junto com a mensagem
            process.stdout.write(`\r${relogio[contador % relogio.length]} ⌛ Aguardando PostgreSQL aceitar conexões...`);
            contador++;

            // Chama a função novamente após 250ms
            setTimeout(checkPostgres, 250);
            return;
        }

        // Quando estiver pronto, limpa a linha e exibe a mensagem final
        console.log("\n\n✅ PostgreSQL está pronto e aceitando conexões!\n");
    }
}

checkPostgres();
