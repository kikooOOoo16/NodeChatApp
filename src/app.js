const express = require('express');
const path = require('path');

const app = express();

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');

// allow static content access
app.use(express.static(publicDirectoryPath));

app.get('', (req, res, next) => {
    res.render('index')
});

module.exports = app;
