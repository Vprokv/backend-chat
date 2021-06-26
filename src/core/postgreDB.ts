const Pool = require('pg').Pool
const pool  = new Pool({
    user: "postgres",
    password: "lise1710",
    host: "localhost",
    port: 5432,
    database: "test_db"

})

module.exports = pool

export default Pool;