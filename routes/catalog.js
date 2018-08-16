var express = require('express');
var passport = require('passport');
var router = express.Router();

// Require controller modules
var channel_controller = require('../controllers/channelController');
var user_controller = require('../controllers/userController');
var channel_instance_controller = require('../controllers/channelinstanceController');
var message_controller = require('../controllers/messageController');
var transformer_controller = require('../controllers/transformerController');
var channel_stats_controller = require('../controllers/channelStatisticsController');
var library_controller = require('../controllers/libraryController');
var script_templates_controller = require('../controllers/scriptTemplateController');
var server_error_controller = require('../controllers/serverErrorController');
var server_config_controller = require('../controllers/serverConfigController');
var globalvar_controller = require('../controllers/globalVariablesController');
var _ = require('lodash');


var getUserEditPermissions = function(userid, callback) {
    user_controller.user_channel_permissions_get(userid, function (permissions){
        var channelEditPermissions = [];
        _.forEach(permissions, function(value, key) {
            if (value.edit) {
                channelEditPermissions.push(key); 
            }
          });
        callback(channelEditPermissions);
    });
}

var isUserAdmin = function(userid, callback) {
    user_controller.getUser(userid, function(err, userdetails){
        if (err){

        } else {
            callback(userdetails.is_admin);
        }
    })
}

/// Channel ROUTES ///

/* GET catalog home page. */
router.get('/', channel_controller.index);

router.post('/login', user_controller.user_login_post);

router.post('/logout', user_controller.user_logout_post);

router.get('/profile', user_controller.user_profile_get);

router.post('/createuser', user_controller.user_create_post);

router.get('/users', passport.authenticate('jwt', { session: false }),
function(req, res) {
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            user_controller.list_users_get(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

router.post('/updateuser/:id', passport.authenticate('jwt', { session: false }),
function(req, res) {
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            user_controller.update_user_post(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

router.post('/user/:id/setpassword', passport.authenticate('jwt', { session: false }),
function(req, res) { 
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            user_controller.user_set_password(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

//router.post('/authenticatetoken', user_controller.user_authenticate_token);
router.post('/authenticatetoken', passport.authenticate('jwt', { session: false }),
function(req, res) {
    res.send('token authed...');
});

/* GET request for creating a channel. NOTE This must come before routes that display channel (uses id) */
router.get('/channel/create', passport.authenticate('jwt', { session: false }),
function(req, res) { // Had to put jwt auth here and not in it's own function because: reasons...
    channel_controller.channel_create_get(req, res);
});

/* POST request for creating channel. */
router.post('/channel/create', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_create_post(req, res);
});

/* GET request to delete channel. */
router.get('/channel/:id/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_delete_get(req, res);
});

// POST request to delete channel
router.post('/channel/:id/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_delete_post(req, res);
});

/* GET request to update channel. */
router.get('/channel/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_update_get(req, res);
});

// POST request to update channel
router.post('/channel/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    getUserEditPermissions(req.user._id, function(permissions){
        if (_.indexOf(permissions, req.params.id) != -1) { // if user has edit permissions for this channel
            channel_controller.channel_update_post(req, res);
        } else {
            res.status(401).send('Unauthorized'); // user doesn't have edit permission
        }

    })
    
});

// POST request to start channel
router.post('/channel/:id/start', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_start(req, res);
});

// POST request to start channel
router.post('/channel/:id/stop', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_stop(req, res);
});

/* GET request for one channel. */
router.get('/channel/:id', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_detail(req, res);
});

/* GET request for list of all channel items. */
//router.get('/channels', [authToken, channel_controller.channel_list]);

router.get('/channels', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_list(req, res);
});

router.get('/channel/:id/stats', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_stats_controller.channel_stats_get(req, res);
});

router.get('/channel/:id/messagemodifier', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_message_modifier_get(req, res);
});

router.post('/channel/:id/messagemodifier', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_message_modifier_post(req, res);
});

router.post('/channel/:id/sendmessage', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_send_message_post(req, res);
});

router.get('/channel/:id/messagestorageconfig', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_message_storage_config_get(req, res);
});

router.post('/channel/:id/messagestorageconfig/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_controller.channel_message_storage_config_post(req, res);
});

// Script template routes
router.get('/scripttemplates', passport.authenticate('jwt', { session: false }),
function(req, res) {
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            script_templates_controller.script_template_list(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

router.post('/scripttemplates/create', passport.authenticate('jwt', { session: false }),
function(req, res) {
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            script_templates_controller.script_template_create_post(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

router.post('/scripttemplates/:id/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {  
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            script_templates_controller.script_template_delete_post(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

router.post('/scripttemplates/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {   
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            script_templates_controller.script_template_post(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

// global vars
router.get('/globalvariables', passport.authenticate('jwt', { session: false }),
function(req, res) {
    globalvar_controller.globalvars_get(req, res);
});

router.post('/globalvariables/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            globalvar_controller.globalvars_post(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

// Message routes

/* GET request for one message. */
router.get('/message/:id', passport.authenticate('jwt', { session: false }),
function(req, res) {
    message_controller.message_detail(req, res);
});

/* GET request for list of all messages. */
router.get('/messages', passport.authenticate('jwt', { session: false }),
function(req, res) {
    message_controller.message_list(req, res);
});

/* GET request to delete message. */
router.get('/message/:channelId/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    message_controller.message_delete_get(req, res);
});

// POST request to delete message
router.post('/message/:channelId/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    message_controller.message_delete_post(req, res);
});

// Server error routes
/* GET request for list of all messages. */
router.get('/servererrors', passport.authenticate('jwt', { session: false }),
function(req, res) {
    server_error_controller.server_error_list(req, res);
});

// Server config routes
router.get('/serverconfig', passport.authenticate('jwt', { session: false }),
function(req, res) {  
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            server_config_controller.server_config_get(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

router.post('/serverconfig/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    isUserAdmin(req.user._id, function(isAdmin){
        if (isAdmin) {
            server_config_controller.server_config_post(req, res);
        } else {
            res.status(401).send("Unauthorized.");
        }
    })
});

// Transformer routes

// POST request to update channel
router.post('/transformer/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    transformer_controller.transformer_update_post(req, res);
});

router.post('/channel/:id/transformer/create', passport.authenticate('jwt', { session: false }),
function(req, res) {
    transformer_controller.transformer_create_post(req, res);
});

router.get('/transformer/:id', transformer_controller.transformer_detail);
router.get('/transformer/:id', passport.authenticate('jwt', { session: false }),
function(req, res) {
    transformer_controller.transformer_detail(req, res);
});

/* GET request for list of all transformers. */
router.get('/channel/:id/transformers', passport.authenticate('jwt', { session: false }),
function(req, res) {
    transformer_controller.transformer_list(req, res);
});

/* GET request to delete transformer. */
router.get('/transformer/:id/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    transformer_controller.transformer_delete_get(req, res);
});

// POST request to delete transformer
router.post('/transformer/:id/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    transformer_controller.transformer_delete_post(req, res);
});

// Library routes
router.post('/library/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    library_controller.library_update_post(req, res);
});

router.post('/library/create', library_controller.library_create_post);
router.post('/library/create', passport.authenticate('jwt', { session: false }),
function(req, res) {
    tlibrary_controller.library_create_post(req, res);
});

router.get('/library/:id', passport.authenticate('jwt', { session: false }),
function(req, res) {
    library_controller.library_detail(req, res);
});

router.get('/libraries', passport.authenticate('jwt', { session: false }),
function(req, res) {
    library_controller.library_list(req, res);
});


/// User ROUTES ///

/* GET request for creating user. NOTE This must come before route for id (i.e. display user) */
/*
router.get('/user/create', user_controller.user_create_get);


router.post('/user/create', user_controller.user_create_post);


router.get('/user/:id/delete', user_controller.user_delete_get);


router.post('/user/:id/delete', user_controller.user_delete_post);


router.get('/user/:id/update', user_controller.user_update_get);


router.post('/user/:id/update', user_controller.user_update_post);


router.get('/user/:id', user_controller.user_detail);


router.get('/users', user_controller.user_list);
*/

/// channelINSTANCE ROUTES ///

/* GET request for creating a channelinstance. NOTE This must come before route that displays channelinstance (uses id) */
router.get('/channelinstance/create', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_create_get(req, res);
});


/* POST request for creating channelinstance. */
router.post('/channelinstance/create', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_create_post(req, res);
});

/* GET request to delete channelinstance. */
router.get('/channelinstance/:id/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_delete_get(req, res);
});

// POST request to delete channelinstance
router.post('/channelinstance/:id/delete', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_delete_post(req, res);
});

/* GET request to update channelinstance. */
router.get('/channelinstance/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_update_get(req, res);
});

// POST request to update channelinstance
router.post('/channelinstance/:id/update', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_update_post(req, res);
});

/* GET request for one channelinstance. */
router.get('/channelinstance/:id', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_detail(req, res);
});

/* GET request for list of all channelinstance. */
router.get('/channelinstances', passport.authenticate('jwt', { session: false }),
function(req, res) {
    channel_instance_controller.channelinstance_list(req, res);
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    
        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated())
            return next();
    
        // if they aren't redirect them to the home page
        res.redirect('/');
    }

module.exports = router;