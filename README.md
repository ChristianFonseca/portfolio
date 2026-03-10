# Portfolio - Next.js Project

Este es un proyecto front-end desarrollado con [Next.js](https://nextjs.org/) 15, utilizando [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) y una amplia variedad de componentes de interfaz de usuario de [Radix UI](https://www.radix-ui.com/).

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu entorno local:
- [Node.js](https://nodejs.org/) (se recomienda Node.js 18.17 o superior para Next.js 15)
- [pnpm](https://pnpm.io/) (El gestor de paquetes utilizado en este repositorio, según su archivo `pnpm-lock.yaml`)

Si no tienes `pnpm` instalado, puedes instalarlo globalmente ejecutando:
```bash
npm install -g pnpm
```

## Instalación de Dependencias

Una vez dentro del directorio del proyecto (`/portfolio`), abre una terminal y ejecuta el siguiente comando para instalar las librerías necesarias:

```bash
pnpm install
```

## Entorno de Desarrollo

Para correr la aplicación en modo desarrollo (y aplicar cambios en tiempo real), ejecuta:

```bash
pnpm run dev
```
o simplemente:
```bash
pnpm dev
```

Abre en tu navegador [http://localhost:3000](http://localhost:3000) para ver el resultado. Puedes empezar a editar el proyecto modificando los archivos en la carpeta `app/`. La página se actualizará automáticamente conforme guardes tus cambios.

## Compilación para Producción

Para preparar la aplicación para subirla a producción y crear una versión optimizada del proyecto, utiliza:

```bash
pnpm run build
```

Este comando generará una carpeta `.next/` con la versión de producción de la aplicación.
Una vez compilada, puedes iniciar el proyecto en el puerto de producción ejecutando:

```bash
pnpm run start
```

## Script de Validaciones

Para validar tu código en busca de posibles problemas de tipado o convenciones, puedes ejecutar el linter incluido en el proyecto:

```bash
pnpm run lint
```

## Tecnologías Utilizadas

- **Framework Web:** Next.js 15.5.4
- **Librería de UI:** React 19.1.0
- **Estilos:** Tailwind CSS 4 + PostCSS
- **Componentes:** Radix UI (`@radix-ui/react-*`), Sonner, Vaul, Embla Carousel.
- **Iconografía:** Lucide React
- **Validaciones y Formularios:** React Hook Form + Zod
- **Otros:** Framer Motion o Tailwing CSS Animate para animaciones, Recharts para gráficos, y MailerSend.
