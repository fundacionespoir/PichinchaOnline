

const { Sequelize } = require('sequelize');

// Metodo que setea los valores para la conexion a base datos, asi como configuracion de conexion
// {params} null {/params}
// {returns} Retorna los valores para la conexion MSSql {/returns}
const db = new Sequelize('ESP_GRUPAL', 'sa', 'espoirprod', {
    //isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    host: '192.168.20.238',
    port: '54482',
    //host: '192.168.0.16',
    //port: '1433',
    dialect: 'mssql',
    // requestTimeout: 300000,
    dialectOptions: {
    //    requestTimeout: 300000,
    options: { "requestTimeout": 300000 },
    decimalNumbers: true // Indica a Sequelize que los números decimales deben manejarse como decimales
    }
    /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
});

module.exports = {
    db,
}
