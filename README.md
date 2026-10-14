# AIFinancialManager
🤖 App Web con IA mediante API de GEMINI


NODE.JS
REACT
VITE
EXPRESS
SUPABASE
VERCEL 
PRISMA

## Despliegue

El repositorio contiene dos aplicaciones:

- Frontend Vite: `frontend/ai-finacial-manager`
- Backend Express: `backend`

La configuración de la raíz (`vercel.json`) permite importar el repositorio completo en Vercel y construir únicamente el frontend. En Vercel no es necesario cambiar el Root Directory: déjalo en la raíz del repositorio.

### Variables del frontend en Vercel

Configura estas variables para el entorno de producción:

- `VITE_API_URL`: URL pública donde desplegues el backend, sin una `/` final.
- `VITE_API_KEY`: el mismo valor configurado como `API_KEY` en el backend.

Después de guardar las variables, ejecuta un nuevo deployment para que Vite las incluya en el bundle.

### Backend

El backend Express está expuesto como funciones serverless mediante `api/index.js` y `api/[...path].js`. Por eso frontend y backend pueden vivir en el mismo proyecto de Vercel:

- Frontend: `/`
- API: `/api/*`

Configura en Vercel las variables definidas en `backend/.env.example`, incluyendo la conexión de Supabase/Prisma, `API_KEY` y `GEMINI_API_KEY`.

Deja `VITE_API_URL` vacío para que el frontend use el mismo dominio:

```env
VITE_API_URL=
VITE_API_KEY=la-misma-clave-configurada-en-API_KEY
```
