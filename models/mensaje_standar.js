// Json de guardado de Erroes que seran presentados en los diferentes endPoints
const dbError = [
    { 
        id: 401,
        title: "Authorization Error",
        detail: "Client credentials are invalid",
        instance: "033",
        type: "2999",
        idSec: "104"
    },
    {
        id: 400,
        title: "Missing mandatory fields",
        detail: "Los campos de entrada no son correctos",
        errors: [
            {
                message: "003",
                bussinessMesagge: "The header field: 'X-Petition-ID' is a mandatory field.",
            }
        ],
        instance: "022",
        type: "/api/v1/companies/payment",
        idSec: "114"
    },
    {
        id: 403,
        title: "Forbbiden access to resource {URI}",
        detail: "No dispone de permisos para esta API, por favor contactese con soporte para solicitarlo",
        instance: "033",
        idSec: "115"
    },
    {
        id: 404,
        title: "Resource not found",
        detail: "No se pudo encontrar el recurso solicitado",
        instance: "044",
        type: "/api/v1/companies/payment",
        idSec: "116"
    },
    {
        id: 429,
        title: "Too many request",
        detail: "Too many request in a short time, try again in 1 minute.",
        instance: "010",
        type: "/api/v1/companies/payment",
        idSec: "001"
    },
    {
        id: 500,
        title: "Internal Server Error",
        detail: "Se produjo un error interno, lo estamos revisando",
        instance: "500",
        type: "/api/v1/companies/payment",
        idSec: "0000"
    },
    {
        id: 504,
        title: "Gateway Timeout",
        detail: "Request timeout exceeded. If it happens repeatedly, consider reducing the request complexity",
        instance: "504",
        type: "/api/v1/companies/payment",
        idSec: "003"
    },
    {
        id: 401,
        title: "Error in Credit Amount",
        detail: "El cliente no reporta deuda",
        instance: "033",
        type: "2999",
        status: "/v1/auth/other",
        idSec: "105"
    },
    {
        id: 419,
        title: "Token error",
        detail: "Token null or expired",
        instance: "033",
        type: "2999",
        status: "/v1/auth/other",
        idSec: "000"
    },
    {
        id: 403,
        title: "Transaction declined",
        detail: "The transaction was not processed, contact the institution",
        instance: "033",
        idSec: "112"
    },
    {
        id: 400,
        title: "Missing mandatory fields",
        errors: [
            {
                code: "003",
                name: "error in the amount sent for credit cancellation",
                reason: "El monto ingresado es mayor al adeudado."
            }
        ],
        instance: "022",
        type: "/api/v1/companies/payment",
        idSec: "117"
    },
]

module.exports = {
    dbError,
}