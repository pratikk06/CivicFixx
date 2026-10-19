// server/src/controllers/healthController.js
export const getHealth = (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      service: "civicfix-api",
    },
  });
};
