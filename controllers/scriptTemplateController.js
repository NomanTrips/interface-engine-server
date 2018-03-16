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

exports.script_template_delete_post = function (req, res) {
    Template.remove({ _id: req.params.id }, function (err) {
        if (!err) {
            console.log('Succesfully deleted template.');
            res.status(200).send('Succesfully deleted template.');
        }
        else {
            console.log('Failed to delete template.');
            res.status(500).send('Failed to delete template.');
        }
    });
};

// Handle channel update on PUT
exports.script_template_post = function (req, res) {
    req.checkBody('name', 'name must be specified').notEmpty(); 
    req.sanitize('name').escape();
    //req.sanitize('script').escape();

    var template = new Template(
        {
            name: req.body.name,
            script: req.body.script,
            _id: req.params.id
        });
    var errors = req.validationErrors();

    if (errors) {
        res.status(500).send('Failed to update!');
    }
    else {
        Template.findByIdAndUpdate(req.params.id, template, {}, function (err, updatedTemplate) {
            if (err) { return next(err); }
            res.status(200).send('Success!');
        });
    }
};