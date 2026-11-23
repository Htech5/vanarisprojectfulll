// Wraps an async route handler so a rejected promise reaches Express's
// error middleware instead of crashing the process or hanging the request.
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
