const prisma = require("../config/prisma");


function agruparPorCategoria(movimientos) {
    const agrupado = movimientos
        .filter(m => m.tipo === 'gasto') // Filtrar solo los movimientos de tipo "gasto"
        .reduce((acc, m)=>{
            const nombreCategoria = m.categoria.nombre;
            acc[nombreCategoria] = (acc[nombreCategoria] || 0) + Number(m.monto);
            return acc;
        }, {});

    return Object.entries(agrupado).map(([categoria, total]) => ({ name: categoria, value: total }));

}

export default agruparPorCategoria;