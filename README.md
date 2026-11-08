# MotoTracer

Aplicación móvil Expo/React Native para registrar rutas en moto y consultar sus métricas. El diseño sigue la paleta oscura, cian y naranja del tablero de Figma.

## Ejecutar

```bash
npm install
npx expo start
```

La grabación requiere un dispositivo físico con GPS y sensores. Android e iOS se compilan con EAS Build:

```bash
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform all
```

Para compilar o enviar a tiendas, conecta el proyecto a una cuenta Expo con `npx eas-cli login` y `npx eas-cli init`, y configura las credenciales de firma de Android/iOS.

## Alcance implementado

- Navegación móvil con Inicio, Rutas, Garaje y Perfil.
- Rodada con permisos de ubicación, posición y velocidad GPS, distancia aproximada, inclinación del giroscopio/acelerómetro, pausa y cierre.
- Estadísticas e historial local, trazado simplificado, compartir mediante la hoja nativa y repetición manual.
- Vehículo activo, intervalo de servicio, registros de mantenimiento y contactos SOS guardados en el dispositivo.
- Calibración de referencia del giroscopio y flujo SOS que prepara un SMS con ubicación para que la persona confirme el envío.
- Perfiles EAS de desarrollo, APK de revisión y producción.

## Requisitos antes de publicar

El proyecto compila como cliente móvil, pero no está listo para una publicación pública ni para activar una emergencia crítica sin trabajo adicional:

- El historial, vehículo, servicios y contactos se guardan solo en AsyncStorage de este dispositivo. No hay inicio de sesión, API, sincronización, feed entre usuarios ni carrera con comparación automática. Para eso hay que seleccionar y configurar un backend; `.env.example` reserva las variables.
- La ubicación se registra mientras la pantalla de rodada está activa. No hay seguimiento en segundo plano; Android/iOS requieren permisos, configuración y validación adicional para esa función.
- La clasificación de estado de aceite, cadena, frenos y llantas es una guía visual, no una lectura real de la motocicleta. Los valores de la pantalla deben sustituirse por datos que el usuario registre.
- La inclinación y la detección de impactos dependen de la posición del teléfono y no son un sistema certificado de seguridad. El SMS se abre para confirmación; la app no envía alertas por sí sola ni reemplaza servicios de emergencia.
- Antes de las tiendas: vincula un proyecto EAS, prepara privacidad/consentimiento de ubicación, revisa las descripciones de permisos, añade pruebas en dispositivos reales y configura las cuentas/credenciales de tienda.

El SDK de Expo está en la versión 57; instala módulos nativos con `npx expo install` para mantener las versiones compatibles.
