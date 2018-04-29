var ServerConfig = require('../models/serverconfig');

var async = require('async');

exports.server_config_get = function (req, res) {
    ServerConfig.findOne({}, function (err, config) {
        if (err) {
            res.status(500).send(err); 
        } else {
            res.json(config);
        }
    });
};

// Handle channel update on PUT
exports.server_config_post = function (req, res) {
    //req.sanitize('name').escape();
    //req.sanitize('script').escape();

    var config = new ServerConfig(
        {
            isDarkTheme: req.body.isDarkTheme,
            globalVariables: req.body.globalVariables,
            _id: req.params.id
        });
    var errors = req.validationErrors();

    if (errors) {
        res.status(500).send('Failed to update server config!');
    }
    else {
        ServerConfig.findByIdAndUpdate(req.params.id, config, {}, function (err, updatedConfig) {
            if (err) { return next(err); }
            res.json(updatedConfig);
        });
    }
};