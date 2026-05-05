export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json({ message: err.message || 'Internal server error' });
};
