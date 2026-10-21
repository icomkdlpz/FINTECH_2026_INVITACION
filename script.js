
/* =========================================
   FINTECH - LÓGICA DE LA PÁGINA
========================================= */

// URL de tu aplicación web de Google Apps Script
const URL_APPS_SCRIPT =
    "https://script.google.com/macros/s/AKfycbyf1fS46tgPodvsQBODjTqJGK6ugetFiwM0lLpwl9EtonIt5sNePeKU813rcdip32Zc/exec";


document.addEventListener("DOMContentLoaded", iniciarPagina);


function iniciarPagina() {

    /* =====================================
       1. OBTENER LOS ELEMENTOS DEL HTML
    ===================================== */

    const botonAbrir = document.getElementById("btn-abrir-formulario");
    const modal = document.getElementById("modal-inscripcion");
    const botonCerrar = document.getElementById("btn-cerrar-modal");

    const formulario = document.getElementById("formulario-inscripcion");
    const iframeRespuesta = document.getElementById("frame-apps-script");

    const botonFinalizar = document.getElementById("btn-finalizar");
    const botonReintentar = document.getElementById("btn-reintentar");

    const campoRequestId = document.getElementById("request-id");
    const campoParentOrigin = document.getElementById("parent-origin");

    const estadoCargando = document.getElementById("estado-cargando");
    const estadoExito = document.getElementById("estado-exito");
    const estadoError = document.getElementById("estado-error");

    const mensajeError = document.getElementById("mensaje-error");

    // Compatible con el HTML aunque el párrafo todavía no tenga ID
    const mensajeExito =
        document.getElementById("mensaje-exito") ||
        estadoExito?.querySelector("p");

    const botonEnviar = formulario?.querySelector(".btn-enviar");


    /* =====================================
       2. COMPROBAR QUE EXISTAN LOS ELEMENTOS
    ===================================== */

    const elementosNecesarios = {
        botonAbrir,
        modal,
        botonCerrar,
        formulario,
        iframeRespuesta,
        botonFinalizar,
        botonReintentar,
        campoRequestId,
        campoParentOrigin,
        estadoCargando,
        estadoExito,
        estadoError,
        mensajeError,
        botonEnviar
    };

    const faltantes = Object.entries(elementosNecesarios)
        .filter(([, elemento]) => !elemento)
        .map(([nombre]) => nombre);

    if (faltantes.length > 0) {

        console.error(
            "FINTECH: faltan elementos en el HTML:",
            faltantes
        );

        return;
    }


    /* =====================================
       3. VARIABLES DE CONTROL
    ===================================== */

    let requestIdPendiente = null;
    let temporizador = null;


    /* =====================================
       4. ESTADO INICIAL DE LA PÁGINA
    ===================================== */

    // La ventana no debe aparecer al cargar la página
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");

    // Mostrar el formulario únicamente dentro de la ventana
    formulario.hidden = false;

    // Ocultar las pantallas de estado
    estadoCargando.hidden = true;
    estadoExito.hidden = true;
    estadoError.hidden = true;

    // Recuperar el desplazamiento normal de la página
    document.body.style.overflow = "";

    // Habilitar los botones
    botonEnviar.disabled = false;
    botonCerrar.disabled = false;


    /* =====================================
       5. RESTABLECER EL FORMULARIO
    ===================================== */

    function restablecerFormulario() {

        if (temporizador !== null) {
            clearTimeout(temporizador);
            temporizador = null;
        }

        requestIdPendiente = null;

        formulario.reset();

        formulario.hidden = false;
        estadoCargando.hidden = true;
        estadoExito.hidden = true;
        estadoError.hidden = true;

        botonEnviar.disabled = false;
        botonCerrar.disabled = false;

    }


    /* =====================================
       6. ABRIR LA VENTANA EMERGENTE
    ===================================== */

    function abrirModal() {

        // No reiniciar una operación que todavía está pendiente
        if (requestIdPendiente !== null) {
            return;
        }

        restablecerFormulario();

        modal.classList.add("is-visible");
        modal.setAttribute("aria-hidden", "false");

        // Evitar desplazamientos detrás del formulario
        document.body.style.overflow = "hidden";

        const campoNombre = document.getElementById("nombre");

        if (campoNombre) {
            campoNombre.focus();
        }

    }


    /* =====================================
       7. CERRAR LA VENTANA EMERGENTE
    ===================================== */

    function cerrarModal() {

        // No cerrar mientras se espera la respuesta del servidor
        if (requestIdPendiente !== null) {
            return;
        }

        modal.classList.remove("is-visible");
        modal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        botonAbrir.focus();

    }


    botonAbrir.addEventListener("click", abrirModal);

    botonCerrar.addEventListener("click", cerrarModal);

    botonFinalizar.addEventListener("click", cerrarModal);


    // Cerrar al hacer clic fuera del cuadro
    modal.addEventListener("click", (evento) => {

        if (evento.target === modal) {
            cerrarModal();
        }

    });


    // Cerrar con Escape
    document.addEventListener("keydown", (evento) => {

        if (
            evento.key === "Escape" &&
            modal.classList.contains("is-visible")
        ) {
            cerrarModal();
        }

    });


    /* =====================================
       8. MOSTRAR UN ERROR
    ===================================== */

    function mostrarError(mensaje) {

        formulario.hidden = true;

        estadoCargando.hidden = true;
        estadoExito.hidden = true;
        estadoError.hidden = false;

        mensajeError.textContent = mensaje;

        botonEnviar.disabled = false;
        botonCerrar.disabled = false;

    }


    /* =====================================
       9. ENVIAR LA INSCRIPCIÓN
    ===================================== */

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        // Confirmar que la URL está configurada
        if (
            !URL_APPS_SCRIPT.startsWith(
                "https://script.google.com/macros/s/"
            ) ||
            !URL_APPS_SCRIPT.endsWith("/exec")
        ) {

            mostrarError(
                "La dirección de Google Apps Script no es válida."
            );

            return;
        }


        // Crear un identificador para esta solicitud
        const requestId =
            Date.now() + "-" +
            Math.random().toString(36).slice(2);


        campoRequestId.value = requestId;
        campoParentOrigin.value = window.location.origin;

        requestIdPendiente = requestId;


        // Mostrar la pantalla de carga
        formulario.hidden = true;

        estadoExito.hidden = true;
        estadoError.hidden = true;
        estadoCargando.hidden = false;

        botonEnviar.disabled = true;
        botonCerrar.disabled = true;


        // Preparar el envío al iframe invisible
        formulario.method = "POST";
        formulario.action = URL_APPS_SCRIPT;
        formulario.target = iframeRespuesta.name;


        // Límite de espera: 25 segundos
        temporizador = setTimeout(() => {

            if (requestIdPendiente !== requestId) {
                return;
            }

            requestIdPendiente = null;
            temporizador = null;

            mostrarError(
                "No recibimos respuesta a tiempo. " +
                "Es posible que el registro se haya guardado. " +
                "Comprueba la hoja antes de intentar enviarlo nuevamente."
            );

        }, 25000);


        try {

            /*
             * Enviar el formulario al iframe sin provocar
             * nuevamente el evento submit.
             */
            HTMLFormElement.prototype.submit.call(formulario);

        } catch (error) {

            if (temporizador !== null) {
                clearTimeout(temporizador);
                temporizador = null;
            }

            requestIdPendiente = null;

            console.error(
                "FINTECH: error al enviar el formulario:",
                error
            );

            mostrarError(
                "No se pudo enviar el formulario. " +
                "Comprueba tu conexión e inténtalo nuevamente."
            );

        }

    });


    /* =====================================
       10. RECIBIR RESPUESTA DE APPS SCRIPT
    ===================================== */

    window.addEventListener("message", (evento) => {

        // Comprobar el origen del mensaje
        const origenValido =
            evento.origin === "https://script.google.com" ||
            evento.origin.endsWith(".googleusercontent.com");

        if (!origenValido) {
            return;
        }

        const datos = evento.data;

        // Comprobar que sea una respuesta de FINTECH
        if (
            !datos ||
            datos.tipo !== "FINTECH_INSCRIPCION_RESPUESTA"
        ) {
            return;
        }

        // Ignorar respuestas de solicitudes anteriores
        if (
            requestIdPendiente === null ||
            datos.requestId !== requestIdPendiente
        ) {
            return;
        }

        // Cancelar el tiempo límite
        if (temporizador !== null) {
            clearTimeout(temporizador);
            temporizador = null;
        }

        requestIdPendiente = null;

        botonCerrar.disabled = false;

        const resultado = datos.resultado;


        /* =================================
           10A. REGISTRO CORRECTO
        ================================= */

        if (resultado && resultado.ok === true) {

            formulario.hidden = true;

            estadoCargando.hidden = true;
            estadoError.hidden = true;
            estadoExito.hidden = false;

            if (mensajeExito) {

                mensajeExito.textContent =
                    "Tu inscripción se registró correctamente. " +
                    "Tu código de participante es: " +
                    resultado.idParticipante + ".";

            }

            console.log(
                "FINTECH: inscripción registrada.",
                resultado.idParticipante
            );

        }


        /* =================================
           10B. REGISTRO RECHAZADO O ERROR
        ================================= */

        else {

            mostrarError(
                resultado && resultado.mensaje
                    ? resultado.mensaje
                    : "No se pudo confirmar la inscripción."
            );

            console.warn(
                "FINTECH: inscripción no completada.",
                resultado
            );

        }

    });


    /* =====================================
       11. VOLVER AL FORMULARIO TRAS UN ERROR
    ===================================== */

    botonReintentar.addEventListener("click", () => {

        estadoCargando.hidden = true;
        estadoExito.hidden = true;
        estadoError.hidden = true;

        // Conservar los datos escritos para facilitar la corrección
        formulario.hidden = false;

        botonEnviar.disabled = false;
        botonCerrar.disabled = false;

    });


    console.log("FINTECH: JavaScript iniciado correctamente.");

}