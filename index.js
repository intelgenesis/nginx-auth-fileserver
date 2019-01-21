// imports
const express = require('express');

// constants
const app = express();
const port = 3000;

// route
app.get('/', (request, response) => {
    // allow access to file
    response.sendStatus(200);
    
    // deny access
    // res.statusMessage = "Access Denied!";
    // response.sendStatus(401);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));