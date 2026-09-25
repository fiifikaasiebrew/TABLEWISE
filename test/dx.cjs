const path=require('path'); const D=path.join(__dirname,'../desktop/node_modules/');
(async()=>{
 const { Client } = require(D+'pg'); const pg=new Client({host:'127.0.0.1',user:'tw',password:'tw',database:'twdb'}); await pg.connect();
 const my=await require(D+'mysql2/promise').createConnection({host:'127.0.0.1',user:'tw',password:'tw',database:'twdb'});
 const e='order_date';
 const pgq=[`SELECT COUNT(*) FROM orders WHERE ${e} >= CURRENT_DATE - CAST($1 AS INTEGER)`, `SELECT TO_CHAR(${e}, 'YYYY-MM'), TRIM(TO_CHAR(${e}, 'Day')), CAST(EXTRACT(YEAR FROM ${e}) AS INTEGER), CAST(${e} AS DATE) FROM orders LIMIT 1`, `SELECT COUNT(*) FROM orders WHERE TO_CHAR(${e}, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')`];
 console.log((await pg.query(pgq[0],[30])).rows, (await pg.query(pgq[1])).rows, (await pg.query(pgq[2])).rows);
 const myq=[`SELECT COUNT(*) c FROM orders WHERE ${e} >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`, `SELECT DATE_FORMAT(${e}, '%Y-%m') ym, DAYNAME(${e}) d, YEAR(${e}) y, CHAR_LENGTH(ship_city) l FROM orders LIMIT 1`];
 console.log((await my.query(myq[0],[30]))[0], (await my.query(myq[1]))[0]);
 await pg.end(); await my.end();
})();
