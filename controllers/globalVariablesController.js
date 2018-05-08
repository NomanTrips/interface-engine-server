var async = require('async');
var GlobalVars = require('../models/globalvars');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

exports.globalvars_get = function (req, res) {
    GlobalVars.findOne({}, function (err, globals) {
        if (err) {
            res.status(500).send(err); 
        } else {
            res.json(globals);
        }
    });
};

// Handle channel update on PUT
exports.globalvars_post = function (req, res) {
    var globals = new GlobalVars(
        {
            script: req.body.script,
            _id: req.params.id
        });
    var errors = req.validationErrors();

    if (errors) {
        res.status(500).send('Failed to update global vars!');
    }
    else {
        GlobalVars.findByIdAndUpdate(req.params.id, globals, {}, function (err, updatedGlobalVars) {
            if (err) { return next(err); }
            res.json(updatedGlobalVars);
        });
    }
};
