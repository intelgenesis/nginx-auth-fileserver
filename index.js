// imports
const express = require('express');
const crypto = require('crypto');
var cookieParser = require('cookie-parser')

// start app
const app = express();
// app middleware setup
app.use(cookieParser())

// constants
const port = 3000;
const BASE_URL = "http://*";

// encryption constants
const ALGO = 'aes-256-cbc';
const ENCRYPTION_KEY = '8PlhDlp3bG4KnukX6UZmWJoUQ0PJ6tCu';
const ENCRYPTION_KEY_ALLOC = 32;
const IV_LENGTH = 16;

////////////////////////////////////////////////////////////
// NodeJS Encrption with CRT
function encrypt(text){
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, new Buffer.alloc(ENCRYPTION_KEY_ALLOC, ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
function decrypt(text){
    let textParts = text.split(':');
    let iv = new Buffer.from(textParts.shift(), 'hex');
    let encryptedText = new Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(ALGO, new Buffer.alloc(ENCRYPTION_KEY_ALLOC,ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
// END NodeJS Encryption with CBC

function getParam(url_string, param = "bearer") {
    const url = new URL(url_string);
    var p = url.searchParams.get(param);
    return p;
}

// example json obj
const exObj = {
    id : 300,
    name: "test",
    validThrough: "1-21-2019"
}

// encrypted example json
const encJsonObj = encrypt(JSON.stringify(exObj));
console.log("request with text exmaple: ", encJsonObj);

// route
app.get('/', (request, response) => {
    try {
        // console.log(request);

        // get original url from nginx
        const originalUrl = request.headers["x-original-uri"] || request.url;

        // get bearer
        let bearer = null;

        if(bearer === null && request.cookies.bearer !== undefined) {
            bearer = request.cookies.bearer;
        }

        // if bearer null get it from link
        if(bearer === null) {
            bearer = getParam(`${BASE_URL}${originalUrl}`);
        }

        // if no key reject access
        if(bearer == undefined) {
            response.sendStatus(401);
            return;
        }

        // try parse json from decryption
        // on error deny access
        let obj = null;
        try {
            obj = JSON.parse(decrypt(bearer));
        } catch (e) {
            // console.error(e);
            response.sendStatus(401);
            return;
        }

        // check keys and time
        if(obj.name == undefined) {
            response.sendStatus(401);
        }

        // if all check are good allow access
        response.sendStatus(200);
    } catch (e) {
        console.log(e);
        // if any other scenario return 401
        response.sendStatus(401);
    }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));