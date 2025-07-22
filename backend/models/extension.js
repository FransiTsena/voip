const mongoose = require('mongoose');

const ExtensionSchema = new mongoose.Schema({
  extension: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  type: { type: String, default: 'endpoint' },
  aors: { type: String, required: true },
  auth: { type: String, required: true },
  tos_audio: { type: String, default: 'ef' },
  tos_video: { type: String, default: 'af41' },
  cos_audio: { type: Number, default: 5 },
  cos_video: { type: Number, default: 4 },
  allow: { type: String, default: 'ulaw,alaw,gsm,g726,g722' },
  context: { type: String, default: 'from-internal' },
  callerid: { type: String },
  dtmf_mode: { type: String, default: 'rfc4733' },
  direct_media: { type: String, default: 'yes' },
  aggregate_mwi: { type: String, default: 'yes' },
  use_avpf: { type: String, default: 'no' },
  rtcp_mux: { type: String, default: 'no' },
  max_audio_streams: { type: Number, default: 1 },
  max_video_streams: { type: Number, default: 1 },
  bundle: { type: String, default: 'no' },
  ice_support: { type: String, default: 'no' },
  media_use_received_transport: { type: String, default: 'no' },
  trust_id_inbound: { type: String, default: 'yes' },
  user_eq_phone: { type: String, default: 'no' },
  send_connected_line: { type: String, default: 'yes' },
  media_encryption: { type: String, default: 'no' },
  timers: { type: String, default: 'yes' },
  timers_min_se: { type: Number, default: 90 },
  media_encryption_optimistic: { type: String, default: 'no' },
  refer_blind_progress: { type: String, default: 'yes' },
  rtp_timeout: { type: Number, default: 30 },
  rtp_timeout_hold: { type: Number, default: 300 },
  rtp_keepalive: { type: Number, default: 0 },
  send_pai: { type: String, default: 'yes' },
  rtp_symmetric: { type: String, default: 'yes' },
  rewrite_contact: { type: String, default: 'yes' },
  force_rport: { type: String, default: 'yes' },
  language: { type: String, default: 'en' },
  one_touch_recording: { type: String, default: 'on' },
  record_on_feature: { type: String, default: 'apprecord' },
  record_off_feature: { type: String, default: 'apprecord' },
  transport: { type: String, default: '0.0.0.0-ws' },
  webrtc: { type: String, default: 'yes' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ExtensionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Extension', ExtensionSchema);
