const dbErrorStandard = [
    {
        "title": "Error en consulta",
        "detail": "Error en consulta",
        "errors": [
            {
            "message": " Contrapartida no existe.",
            "businessMessage": "Contrapartida incorrecta."
            }
        ],
        "instance": "EC001",
        "type": "/api/v1/companies/payment",
        "id": "101"
    },
    {
        "title": "Error en consulta",
        "detail": "Error en consulta",
        "errors": [
            {
            "message": " Contrapartida sin deuda.",
            "businessMessage": "Contrapartida sin deuda."
            }
        ],
        "instance": "EC002",
        "type": "/api/v1/companies/payment",
        "id": "105"
    },
    {
        "title": "Error en pago",
        "detail": "Error en pago",
        "errors": [
            {
            "message": "Monto mayor al adeudado.",
            "businessMessage": "Monto mayor al adeudado."
            }
        ],
        "instance": "EC004",
        "type": "/api/v1/companies/payment",
        "id": "117"
    },
    {
        "title": "Error en pago",
        "detail": "Error en pago",
        "errors": [
            {
            "message": "Por favor acercarse a las oficinas CREDITO CANCELADO.",
            "businessMessage": "Por favor acercarse a las oficinas CREDITO CANCELADO."
            }
        ],
        "instance": "EC005",
        "type": "/api/v1/companies/payment",
        "id": "112"
    },     
]

module.exports = {
    dbErrorStandard,
}