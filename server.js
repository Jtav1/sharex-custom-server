const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const express = require('express');
// const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

require('dotenv').config();

const app = express();
app.use('/favicon.ico', express.static('images/favicon.ico'));

app.use(fileUpload({
    limits: { fileSize: 1024 * 1024 * 1024 }
}))

const jsonParser = bodyParser.json();

const port = 3000;

// const limiter = rateLimit({
//     windowMs: 1 * 60 * 1000, //in 1 minute
//     max: 10, // limit each IP to 500 requests per windowMs
// })

// app.use(limiter);

// Log format + logger setup
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
  });
  
const logger = createLogger({
    format: combine(
        label({ label: 'sharex-custom-server' }),
        timestamp(),
        myFormat
    ),
    transports: [new transports.File({ filename: 'server.log' })]
})

//filename generator
const generateFilename = () => {
    const characters = '1234567890abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ';
    return Array(parseInt(process.env.FILENAME_LENGTH)).fill('').map(() => characters[Math.floor(Math.random() * characters.length)]).join('');
}

app.get('/:filename', (req, res) => {
    filePath = __dirname + process.env.SAVE_DIRECTORY + req.params.filename;
    res.sendFile(filePath);
})

app.post('/up', jsonParser, (req, res) => {
    logger.log({ level: "info", message: 'request received' })

    let sentSecret = req.body.secret;

    if(sentSecret === process.env.SECRET_KEY) {

        let sharex = null;

        if(Object.hasOwn(req.files, 'sharex')){
            sharex = req.files.sharex

            let fileExt = sharex.name.split('.').pop();
            filename = generateFilename() + '.' + fileExt;

            uploadPath = __dirname + process.env.SAVE_DIRECTORY + filename;

            // If the images directory doesnt exist this will blow up lol
            sharex.mv(uploadPath, (err) => {
                if(err) {
                    logger.log({ level: "error", message: 'error saving file' })
                    res.send('Error saving file');
                }
            })

            logger.log({ level: "info", message: 'All good, sending correct response' })
            res.send(process.env.SITE_URL + filename);
            
        } else {
            logger.log({ level: "error", message: 'no file attached' })
            res.send('No file attached');
        }
        
        
    } else {
        logger.log({ level: "error", message: 'Incorrect secret key' })
        res.send('Incorrect secret key');
    }
});

app.listen(port, () => logger.log({
    level: "info",
    message: 'server listening on port ' + port
}))