const prisma = require("../config/prisma");

function createCrudService(modelName, fields, orderBy) {
  const model = prisma[modelName];

  function sanitize(data) {
    return Object.fromEntries(
      Object.entries(data || {}).filter(([key, value]) => fields.includes(key) && value !== undefined),
    );
  }

  return {
    listar: (usuarioId, where = {}) =>
      model.findMany({
        where: { usuarioId, ...where },
        orderBy,
      }),

    obtener: (id, usuarioId) =>
      model.findFirst({
        where: { id, usuarioId },
      }),

    crear: (usuarioId, data) =>
      model.create({
        data: { ...sanitize(data), usuarioId },
      }),

    actualizar: (id, usuarioId, data) =>
      model.updateMany({
        where: { id, usuarioId },
        data: sanitize(data),
      }),

    eliminar: (id, usuarioId) =>
      model.deleteMany({
        where: { id, usuarioId },
      }),
  };
}

function createCrudController(service, singular) {
  return {
    list: async (req, res, next) => {
      try {
        res.json(await service.listar(req.usuarioId));
      } catch (error) {
        next(error);
      }
    },
    get: async (req, res, next) => {
      try {
        const item = await service.obtener(req.params.id, req.usuarioId);
        if (!item) return res.status(404).json({ message: `${singular} no encontrado` });
        res.json(item);
      } catch (error) {
        next(error);
      }
    },
    create: async (req, res, next) => {
      try {
        res.status(201).json(await service.crear(req.usuarioId, req.body));
      } catch (error) {
        next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const result = await service.actualizar(req.params.id, req.usuarioId, req.body);
        if (!result.count) return res.status(404).json({ message: `${singular} no encontrado o no autorizado` });
        res.json(await service.obtener(req.params.id, req.usuarioId));
      } catch (error) {
        next(error);
      }
    },
    remove: async (req, res, next) => {
      try {
        const result = await service.eliminar(req.params.id, req.usuarioId);
        if (!result.count) return res.status(404).json({ message: `${singular} no encontrado o no autorizado` });
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}

function createCrudRouter(controller) {
  const express = require("express");
  const router = express.Router();
  router.post("/", controller.create);
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);
  return router;
}

module.exports = { createCrudService, createCrudController, createCrudRouter };
