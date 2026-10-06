const service = require("./ingreso.service");


async function crearIngreso(req, res, next) {
  try {
    const ingreso = await service.crearIngreso(req.usuarioId, req.body);
    res.status(201).json(ingreso);
    
  } catch (error) {
    next(error);
  } 
}


async function list(req, res, next) {
  try {
    const ingresos = await service.listarIngresos(req.usuarioId);
    res.status(200).json(ingresos);
  } catch (error) {
    next(error);
  }
}


async function update(req, res, next) {
    try {
        const result = await service.actualizarIngreso(req.params.id, req.usuarioId, req.body);
        if (result.count === 0) {
            return res.status(404).json({ message: "Ingreso no encontrado o no autorizado" });
        } else {    
            res.status(200).json({ message: "Ingreso actualizado correctamente" }); 
        }
    }catch (error) {next(error);}


}


async function remove(req, res, next) {
    try {
        const result = await service.eliminarIngreso(req.params.id, req.usuarioId);
        if (result.count === 0) {
            return res.status(404).json({ message: "Ingreso no encontrado o no autorizado" });
        } else {    
            res.status(200).json({ message: "Ingreso eliminado correctamente" }); 
        }
    }catch (error) {next(error);}}



module.exports = {
  crearIngreso,
  list,
  update,
  remove
};