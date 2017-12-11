var express = require('express');
var router = express.Router();

// Require controller modules
var channel_controller = require('../controllers/channelController');
var user_controller = require('../controllers/userController');
var channel_instance_controller = require('../controllers/channelinstanceController');
var message_controller = require('../controllers/messageController');
var transformer_controller = require('../controllers/transformerController');
var channel_stats_controller = require('../controllers/channelStatisticsController');
var library_controller = require('../controllers/libraryController');

/// Channel ROUTES ///

/* GET catalog home page. */
router.get('/', channel_controller.index);

/* GET request for creating a channel. NOTE This must come before routes that display channel (uses id) */
router.get('/channel/create', channel_controller.channel_create_get);

/* POST request for creating channel. */
router.post('/channel/create', channel_controller.channel_create_post);

/* GET request to delete channel. */
router.get('/channel/:id/delete', channel_controller.channel_delete_get);

// POST request to delete channel
router.post('/channel/:id/delete', channel_controller.channel_delete_post);

/* GET request to update channel. */
router.get('/channel/:id/update', channel_controller.channel_update_get);

// POST request to update channel
router.post('/channel/:id/update', channel_controller.channel_update_post);

// POST request to start channel
router.post('/channel/:id/start', channel_controller.channel_start);

// POST request to start channel
router.post('/channel/:id/stop', channel_controller.channel_stop);

/* GET request for one channel. */
router.get('/channel/:id', channel_controller.channel_detail);

/* GET request for list of all channel items. */
router.get('/channels', channel_controller.channel_list);

router.get('/channel/:id/stats', channel_stats_controller.channel_stats_get);

// Message routes

/* GET request for one message. */
router.get('/message/:id', message_controller.message_detail);

/* GET request for list of all messages. */
router.get('/messages', message_controller.message_list);

/* GET request to delete message. */
router.get('/message/:channelId/delete', message_controller.message_delete_get);

// POST request to delete message
router.post('/message/:channelId/delete', message_controller.message_delete_post);

// Transformer routes

// POST request to update channel
router.post('/transformer/:id/update', transformer_controller.transformer_update_post);

router.post('/channel/:id/transformer/create', transformer_controller.transformer_create_post);

router.get('/transformer/:id', transformer_controller.transformer_detail);

/* GET request for list of all transformers. */
router.get('/channel/:id/transformers', transformer_controller.transformer_list);

/* GET request to delete transformer. */
router.get('/transformer/:id/delete', transformer_controller.transformer_delete_get);

// POST request to delete transformer
router.post('/transformer/:id/delete', transformer_controller.transformer_delete_post);

// Library routes
router.post('/library/:id/update', library_controller.library_update_post);

router.post('/library/create', library_controller.library_create_post);

router.get('/library/:id', library_controller.library_detail);

router.get('/libraries', library_controller.library_list);


/// User ROUTES ///

/* GET request for creating user. NOTE This must come before route for id (i.e. display user) */
router.get('/user/create', user_controller.user_create_get);

/* POST request for creating user. */
router.post('/user/create', user_controller.user_create_post);

/* GET request to delete user. */
router.get('/user/:id/delete', user_controller.user_delete_get);

// POST request to delete user
router.post('/user/:id/delete', user_controller.user_delete_post);

/* GET request to update user. */
router.get('/user/:id/update', user_controller.user_update_get);

// POST request to update user
router.post('/user/:id/update', user_controller.user_update_post);

/* GET request for one user. */
router.get('/user/:id', user_controller.user_detail);

/* GET request for list of all users. */
router.get('/users', user_controller.user_list);


/// channelINSTANCE ROUTES ///

/* GET request for creating a channelinstance. NOTE This must come before route that displays channelinstance (uses id) */
router.get('/channelinstance/create', channel_instance_controller.channelinstance_create_get);

/* POST request for creating channelinstance. */
router.post('/channelinstance/create', channel_instance_controller.channelinstance_create_post);

/* GET request to delete channelinstance. */
router.get('/channelinstance/:id/delete', channel_instance_controller.channelinstance_delete_get);

// POST request to delete channelinstance
router.post('/channelinstance/:id/delete', channel_instance_controller.channelinstance_delete_post);

/* GET request to update channelinstance. */
router.get('/channelinstance/:id/update', channel_instance_controller.channelinstance_update_get);

// POST request to update channelinstance
router.post('/channelinstance/:id/update', channel_instance_controller.channelinstance_update_post);

/* GET request for one channelinstance. */
router.get('/channelinstance/:id', channel_instance_controller.channelinstance_detail);

/* GET request for list of all channelinstance. */
router.get('/channelinstances', channel_instance_controller.channelinstance_list);

module.exports = router;