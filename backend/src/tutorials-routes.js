// Alias wrapper for academy/tutorials routes
const academyRoutes = require("./academy-routes");

module.exports = {
  ...academyRoutes,
  mountTutorialsRoutes: academyRoutes.mountAcademyRoutes
};
