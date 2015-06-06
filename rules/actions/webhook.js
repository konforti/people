exports = module.exports = function(req, event, user) {
  var payload = {event: event, user: user};
  req.hooks.webhook(payload);

  return payload;
};