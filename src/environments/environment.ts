export const environment = {
  production: false,
  // Con el proxy dev-server, las peticiones a /api se redirigen al microservicio respectivo
  apiUrl: '/api',
  services: {
    usuarios: 'http://localhost:8081',
    pedidos: 'http://localhost:8082',
    atenciones: 'http://localhost:8083',
    mesas: 'http://localhost:8084'
  }
};
