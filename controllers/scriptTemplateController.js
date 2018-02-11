var Template = require('../models/scripttemplates.js');

var async = require('async');

exports.script_template_list = function (req, res, next) {

    Template.find({}, 'name script')
        .exec(function (err, list_templates) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(list_templates);
        });

};

// Handle channel create on POST
exports.script_template_create_post = function (req, res) {
    var template = new Template({
        name: req.body.name,
        script: req.body.script,
    })
    template.save(function (err) {
        if (err) {
            console.log(err);
            //callback(false)
            res.status(500).send('Failed to create template.');
            return
        }
        console.log('New template added: ' + template);
        res.status(200).send(template);
    });
};