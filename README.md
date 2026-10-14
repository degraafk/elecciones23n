# Simulador 29-N 2026 · Congreso de los Diputados y Senado de España

Simulador interactivo y mapa editable de escaños para el Congreso de los Diputados (350 escaños) y Senado de España (209 escaños) con cálculo de coaliciones y pactos en tiempo real.

## 🚀 Despliegue en Vercel

Este proyecto está construido con **React 19 + TypeScript + Vite + Tailwind CSS**. Está 100% optimizado para Vercel:

1. Sube este repositorio a tu cuenta de **GitHub**.
2. Entra en [Vercel](https://vercel.com/) y haz clic en **"Add New Project"**.
3. Selecciona tu repositorio de GitHub. Vercel detectará automáticamente que es un proyecto **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Haz clic en **Deploy**. ¡Estará listo en menos de 30 segundos!

---

## 💻 Ejecución local

Para probar o ejecutar el proyecto en tu máquina:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

---

## 📦 Subir a GitHub desde tu terminal

Si has descargado el archivo `.zip`:

```bash
# 1. Descomprime el archivo y entra en la carpeta
cd simulador-elecciones

# 2. Inicializa git
git init
git add .
git commit -m "Initial commit: Simulador 29-N 2026 optimizado"

# 3. Conecta con tu repositorio de GitHub (crea uno vacío en github.com previamente)
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 4. Sube los archivos
git push -u origin main
```

---

## ✨ Características

- **60fps Fluidity**: Renderizado SVG reactivo sin lag ni bloqueos de interfaz.
- **Congreso (350 escaños)** y **Senado (209 escaños)** con cambio instantáneo.
- **Coalition Maker**: Cálculo dinámico de mayoría absoluta (176) y 3/5 (133) con animación de victoria.
- **Importación y Exportación**:
  - Exportación en formato Excel (`.xlsx`) y `.csv`.
  - Exportación del mapa vectorial en `.svg` de alta resolución.
  - Importación de hojas de cálculo Excel y CSV.
  - Soporte de copia y pega directo de celdas desde Excel (`Ctrl+V`).
