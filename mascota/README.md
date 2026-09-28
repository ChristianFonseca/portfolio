# Mascota animada

Copia la carpeta `mascota/` a tu web.

```html
<script src="/mascota/brain-mascot.js"></script>

<brain-mascot state="idle" style="width:120px"></brain-mascot>
```

Cambiar de estado desde JS:

```js
document.querySelector('brain-mascot').setAttribute('state', 'thinking');
```

## Estados

| state       | Uso |
|-------------|-----|
| `idle`      | Reposo por defecto |
| `hello`     | Saludo al cargar / hover |
| `review`    | Revisando documento, formulario o código |
| `thinking`  | Generando respuesta |
| `loading`   | Procesos largos |
| `chat`      | Abrir el chat |
| `success`   | Tarea completada |
| `error`     | Algo falló |
| `listening` | Voz / esperando al usuario |
| `alert`     | Notificación / atención |
| `confused`  | No entendió la petición |
| `sleep`     | Inactividad |

## Atributos

- `state` — uno de los de arriba.
- `speed` — multiplicador de velocidad (1 = normal).
- `assets` — ruta a la carpeta de imágenes si no está junto al script (debe terminar en `/`).

## Archivos

- `brain-mascot.js` — componente, sin dependencias.
- `assets/mascot-body.png` — cerebro sin fondo, sin ojos (los ojos se dibujan en código).
- `assets/mascot-base.png` — aro de la base.
- `assets/mascot-logo.png` — logo completo sin fondo (estático, sin electrones).
- `estados/*.html` — una página de ejemplo por estado.
