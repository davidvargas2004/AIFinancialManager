import {useState} from 'react';

function AddMovementForm({onAddMovement}) {
  const [form,setForm] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    tipo: 'ingresos',
    ocurrioEn: ''
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const endpoint = form.tipo === 'ingreso' ? 'ingresos' :'gastos';
    const res = await fetch(`/api/${endpoint}`,
        {   method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(form)});




        const nuevo = await res.json();
        onMovementAdded({ ...nuevo, tipo: form.tipo});
        setForm({
          monto: '',
          descripcion: '',
          categoria: '',
          tipo: 'ingresos',
          ocurrioEn: ''
        });    
    }


    return (
        <form onSubmit={handleSubmit} className="add-movement-form">
            <select name="tipo" value={form.tipo} onChange={handleChange}>
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
            </select>
            <input type="number" name="monto" placeholder="Monto" value={form.monto} onChange={handleChange} required />
            <input type="text" name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} required />
            <input type="text" name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} required />
            <input type="date" name="ocurrioEn" value={form.ocurrioEn} onChange={handleChange} required />
            <button type="submit">Agregar Movimiento</button>
        </form>
    );
}


export default AddMovementForm;


    


