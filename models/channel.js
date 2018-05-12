var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChannelSchema = Schema({
  name: {type: String, required: true},
  user: {type: Schema.ObjectId, ref: 'User', required: false},
  description: {type: String, required: false},
  inbound_type: {type: String, required: false},
  outbound_type: {type: String, required: false},
  inbound_location: {type: String, required: false},
  outbound_location: {type: String, required: false},
  http_destination: {type: String, required: false},
  move_destination: {type: String, required: false},
  post_processing_action: {type: String, required: false},
  copy_destination: {type: String, required: false},
  schedule_type: {type: String, required: false},
  schedule_interval: {type: String, required: false},
  schedule_unit: {type: String, required: false},
  status: {type: String, required: false}, 
  sftp_host: {type: String, required: false},
  sftp_port: {type: String, required: false},
  sftp_username: {type: String, required: false},
  sftp_password: {type: String, required: false},
  sftp_path: {type: String, required: false},
  sftp_private_key: {type: String, required: false},
  sftp_auth_type: {type: Boolean, required: false},
  http_port: {type: String, required: false},
  https_privateKey: {type: String, required: false},
  https_certificate: {type: String, required: false},
  https_port: {type: String, required: false},
  https_dest_host: {type: String, required: false}, 
  https_dest_port: {type: String, required: false}, 
  https_dest_method: {type: String, required: false}, 
  https_dest_cert: {type: String, required: false},
  https_dest_ca: {type: String, required: false},
  sftp_dest_host: {type: String, required: false},
  sftp_dest_port: {type: String, required: false},
  sftp_dest_username: {type: String, required: false},
  sftp_dest_password: {type: String, required: false},
  sftp_dest_path: {type: String, required: false},
  sftp_dest_private_key: {type: String, required: false},
  sftp_dest_auth_type: {type: Boolean, required: false},
  ftp_host: {type: String, required: false},
  ftp_port: {type: String, required: false},
  ftp_username: {type: String, required: false},
  ftp_password: {type: String, required: false},
  ftp_path: {type: String, required: false},
  ftp_use_tls: {type: Boolean, required: false},
  ftp_dest_host: {type: String, required: false},
  ftp_dest_port: {type: String, required: false},
  ftp_dest_username: {type: String, required: false},
  ftp_dest_password: {type: String, required: false},
  ftp_dest_path: {type: String, required: false},
  ftp_dest_use_tls: {type: Boolean, required: false},
  tcp_port: {type: String, required: false},
  tcp_host: {type: String, required: false},
  tcp_dest_port: {type: String, required: false},
  tcp_dest_host: {type: String, required: false},
  message_modifier_script: {type: String, required: false},
  message_modifier_script_name: {type: String, required: false},
  is_running: {type: Boolean, required: false},
  db_reader_user: {type: String, required: false},
  db_reader_password: {type: String, required: false},
  db_reader_host: {type: String, required: false},
  db_reader_database: {type: String, required: false},
  db_reader_port: {type: String, required: false},
  db_reader_query: {type: String, required: false},
  db_reader_type: {type: String, required: false},
  db_reader_post_process_query: {type: String, required: false},
  db_reader_use_post_process_query: {type: Boolean, required: false},
});

// Virtual for book's URL
ChannelSchema
.virtual('url')
.get(function () {
  return '/channel/' + this._id;
});

//Export model
module.exports = mongoose.model('Channel', ChannelSchema);