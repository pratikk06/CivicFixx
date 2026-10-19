// server/src/middleware/notFound.js
export default function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      code: 404,
    },
  });
}
