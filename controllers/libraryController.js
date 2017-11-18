var Library = require('../models/library');

var async = require('async');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};

exports.library_update_post = function (req, res) {
    var lib = new Library(
        {
            name: req.body.name,
            description: req.body.description,
            _id: req.params.id
        });

        Library.findByIdAndUpdate(req.params.id, lib, {}, function (err, library) {
            if (err) {
                console.log(err);
                res.status(500).send('Failed to update library!');
                return;
            }
            res.status(200).send('Success!');
        });
};

exports.library_create_post = function (req, res) {
        librarydetail = {
            name: req.body.name,
            description: req.body.description,
        }
        var lib = new Library(librarydetail);
        lib.save(function (err) {
          if (err) {
            console.log(err);
            //callback(false)
            res.status(500).send('Failed to create library.');
            return
          }
          console.log('New library: ' + lib);
          res.status(200).send('Success!');
        }  );

}

// Display list of all Channels
exports.library_list = function (req, res, next) {
    Library.find({}, 'name description')
        .exec(function (err, list_libraries) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(list_libraries);
        });

};

// Display detail page for a specific message
exports.library_detail = function (req, res) {
    Library.findById(req.params.id)
        .exec(function (err, library_detail) {
            if (err) { return next(err); }
            //Successful, so render
            res.json(library_detail);
        });

};

// Display message delete form on GET
exports.library_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: message delete GET');
};

// Handle message delete on POST
exports.library_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: message delete POST');
};