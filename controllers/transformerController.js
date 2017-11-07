var Channel = require('../models/channel');
var Transformer = require('../models/transformer');

var async = require('async');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

exports.transformer_update_post = function (req, res) {
    var trans = new Transformer(
        {
            channel: req.body.channel,
            title: req.body.title,
            script: req.body.script,
            _id: req.params.id
        });

        Transformer.findByIdAndUpdate(req.params.id, trans, {}, function (err, transformer) {
            if (err) {
                console.log(err);
                res.status(500).send('Failed to update transformer!');
                return;
            }
            res.status(200).send('Success!');
        });
};

exports.transformer_create_post = function (req, res) {
        transformerdetail = {
          channel: req.params.id,
          title: req.body.title,
          script: req.body.script,
        }
          console.log(transformerdetail);
        var trans = new Transformer(transformerdetail);
        trans.save(function (err) {
          if (err) {
            console.log(err);
            //callback(false)
            res.status(500).send('Failed to create transformer.');
            return
          }
          console.log('New transformer: ' + trans);
          res.status(200).send('Success!');
        }  );

}

// Display list of all Channels
exports.transformer_list = function (req, res, next) {
    console.log(req.params.id);
    Transformer.find({channel: req.params.id}, 'title script')
        //.populate('channel')
        .exec(function (err, list_transformers) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(list_transformers);
        });

};

// Display detail page for a specific message
exports.transformer_detail = function (req, res) {

    Transformer.findById(req.params.id)
        .populate('channel')
        .exec(function (err, transformer_detail) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(transformer_detail);
        });

};

// Display message delete form on GET
exports.transformer_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: message delete GET');
};

// Handle message delete on POST
exports.transformer_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: message delete POST');
};