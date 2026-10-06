const prisma = require("../../src/config/prisma");

module.exports = {
  crearIngreso,
  actualizarIngreso,
  eliminarIngreso
};

async function crearIngreso(usuarioId,data) {
  return await prisma.ingreso.create({
    data: {
      ...data,
      usuarioId
    }
  });
}



async function actualizarIngreso(id,usuarioId,data) {
  return await prisma.ingreso.updateMany({
    where: {
      id,usuarioId  //seguridad para que no entre otro usuario a modificar el ingreso de otro usuario
    },data
  });
}

async function eliminarIngreso(id,usuarioId) {
  return await prisma.ingreso.deleteMany({
    where: {
      id,usuarioId  //#seguridad para que no entre otro usuario a eliminar el ingreso de otro usuario
    }
  });
}


module.exports = {
  crearIngreso,
  actualizarIngreso,
  eliminarIngreso
};