//Importando a módulo da calculadora
const calculadora = require('../models/calculadora.js')

test("2+2 é 4", () => {
    const res = calculadora.somar(2, 2)
    expect(res).toBe(4)
})