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
    
    // Elementos del selector de modalidad
    const vistaSelector = document.getElementById("vista-selector");
    const vistaIndividual = document.getElementById("vista-individual");
    const vistaGrupal = document.getElementById("vista-grupal");

    const botonModalIndividual =
        document.getElementById("btn-modal-individual");

    const botonModalGrupal =
        document.getElementById("btn-modal-grupal");

    // Elementos del formulario grupal
    const formularioGrupal =
        document.getElementById("formulario-grupal");

    const contenedorParticipantes =
        document.getElementById("participantes-adicionales");

    const botonAnadirParticipante =
        document.getElementById("btn-anadir-participante");

    const contadorParticipantes =
        document.getElementById("contador-participantes");

    const MAX_PARTICIPANTES = 10;
    let cantidadParticipantes = 1;

    const botonVolverSelector =
        document.getElementById("btn-volver-selector");

    const botonVolverSelectorGrupal =
        document.getElementById("btn-volver-selector-grupal");



    /* =====================================
       2. COMPROBAR QUE EXISTAN LOS ELEMENTOS
    ===================================== */

    const elementosNecesarios = {
        botonAbrir,
        modal,
        botonCerrar,
        formulario,
        vistaSelector,
        vistaIndividual,
        vistaGrupal,
        botonModalIndividual,
        botonModalGrupal,
        botonVolverSelector,
        botonVolverSelectorGrupal,
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

    // Control de la modalidad que se está enviando
    let formularioActivo = formulario;
    let botonEnviarActivo = botonEnviar;
    let modalidadPendiente = "individual";

    /* =====================================
       4. ESTADO INICIAL DE LA PÁGINA
    ===================================== */

    // La ventana no debe aparecer al cargar la página
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");

    // Mostrar el formulario únicamente dentro de la ventana
    formulario.hidden = false;

    // Mostrar el selector de modalidad
    vistaSelector.hidden = false;

    // Ocultar los formularios hasta elegir una modalidad
    vistaIndividual.hidden = true;
    vistaGrupal.hidden = true;

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
        // Mostrar el formulario
        formulario.hidden = false;

        // Volver al selector de modalidad
        vistaSelector.hidden = false;

        // Ocultar los formularios individual y grupal
        vistaIndividual.hidden = true;
        vistaGrupal.hidden = true;

        // Ocultar las pantallas de estado
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

    
    // ==========================================
    // SELECTOR DE MODALIDAD
    // ==========================================

    // Elegir modalidad individual
    botonModalIndividual.addEventListener("click", () => {
        vistaSelector.hidden = true;
        vistaIndividual.hidden = false;
        vistaGrupal.hidden = true;
    });

    // Elegir modalidad grupal
    botonModalGrupal.addEventListener("click", () => {
        vistaSelector.hidden = true;
        vistaIndividual.hidden = true;
        vistaGrupal.hidden = false;
    });

    // Volver al selector desde el formulario individual
    botonVolverSelector.addEventListener("click", () => {
        vistaSelector.hidden = false;
        vistaIndividual.hidden = true;
        vistaGrupal.hidden = true;
    });

    // Volver al selector desde el formulario grupal
    botonVolverSelectorGrupal.addEventListener("click", () => {
        vistaSelector.hidden = false;
        vistaIndividual.hidden = true;
        vistaGrupal.hidden = true;
    });

    // ==========================================
    // FORMULARIO GRUPAL: AÑADIR PARTICIPANTES
    // ==========================================

    function actualizarContadorParticipantes() {
        contadorParticipantes.textContent =
            `Participantes: ${cantidadParticipantes} de ${MAX_PARTICIPANTES}`;

        botonAnadirParticipante.disabled =
            cantidadParticipantes >= MAX_PARTICIPANTES;
    }

    function anadirParticipante() {

        if (cantidadParticipantes >= MAX_PARTICIPANTES) {
            return;
        }

        cantidadParticipantes++;

        const numero = cantidadParticipantes;

        const bloque = document.createElement("div");
        bloque.className = "participante-grupal";
        bloque.dataset.participante = numero;

        bloque.innerHTML = `
            <hr>

            <h3>Participante ${numero}</h3>

            <div class="campo-formulario">
                <label for="participante-nombre-${numero}">
                    Nombre Completo:
                </label>

                <input
                    type="text"
                    id="participante-nombre-${numero}"
                    name="participante_nombre_${numero}"
                    placeholder="Nombre completo"
                    required>
            </div>

            <div class="campo-formulario">
                <label for="participante-correo-${numero}">
                    Correo Electrónico:
                </label>

                <input
                    type="email"
                    id="participante-correo-${numero}"
                    name="participante_correo_${numero}"
                    placeholder="correo@ejemplo.com"
                    required>
            </div>

            <div class="campo-formulario">
                <label for="participante-celular-${numero}">
                    Número de Celular:
                </label>

                <input
                    type="tel"
                    id="participante-celular-${numero}"
                    name="participante_celular_${numero}"
                    placeholder="Número de celular"
                    required>
            </div>

            <button
                type="button"
                class="btn-eliminar-participante"
                data-eliminar="${numero}">
                ELIMINAR PARTICIPANTE
            </button>
        `;

        contenedorParticipantes.appendChild(bloque);

        actualizarContadorParticipantes();

        bloque.querySelector(`#participante-nombre-${numero}`).focus();
    }

    botonAnadirParticipante.addEventListener(
        "click",
        anadirParticipante
    );

    // Eliminar un participante
    contenedorParticipantes.addEventListener("click", (evento) => {

        const botonEliminar = evento.target.closest(
            ".btn-eliminar-participante"
        );

        if (!botonEliminar) {
            return;
        }

        const bloque = botonEliminar.closest(".participante-grupal");

        if (!bloque) {
            return;
        }

        bloque.remove();

        cantidadParticipantes--;

        // Renumerar los participantes que quedan
        const bloques = contenedorParticipantes.querySelectorAll(
            ".participante-grupal"
        );

        bloques.forEach((participante, indice) => {

            const nuevoNumero = indice + 2;

            participante.dataset.participante = nuevoNumero;

            const titulo = participante.querySelector("h3");
            titulo.textContent = `Participante ${nuevoNumero}`;

            participante.querySelectorAll("input").forEach((campo) => {

                const tipo = campo.name.split("_")[1];

                campo.id = `participante-${tipo}-${nuevoNumero}`;
                campo.name = `participante_${tipo}_${nuevoNumero}`;

                const etiqueta = participante.querySelector(
                    `label[for="${campo.id.replace(
                        /-(\d+)$/,
                        "-"
                    )}${nuevoNumero}"]`
                );

                if (etiqueta) {
                    etiqueta.htmlFor = campo.id;
                }
            });

            participante.querySelectorAll("label").forEach((etiqueta, i) => {
                const tipos = ["nombre", "correo", "celular"];
                etiqueta.htmlFor =
                    `participante-${tipos[i]}-${nuevoNumero}`;
            });

            participante.querySelector(".btn-eliminar-participante")
                .dataset.eliminar = nuevoNumero;
        });

        // Mantener una numeración consecutiva para nuevas incorporaciones
        cantidadParticipantes = bloques.length + 1;

        actualizarContadorParticipantes();
    });

    actualizarContadorParticipantes();


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
    formularioGrupal.hidden = true;

    estadoCargando.hidden = true;
    estadoExito.hidden = true;
    estadoError.hidden = false;

    mensajeError.textContent = mensaje;

    botonEnviarActivo.disabled = false;
    botonCerrar.disabled = false;
    }

    
   /* =====================================
    9. ENVIAR LA INSCRIPCIÓN
    INDIVIDUAL Y GRUPAL
    ===================================== */

    function enviarInscripcion(evento, formularioActual, modalidad) {

    evento.preventDefault();

    // Comprobar que la URL de Apps Script sea válida
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

    // Evitar envíos simultáneos
    if (requestIdPendiente !== null) {
        return;
    }

    // Identificar el formulario y el botón activos
    formularioActivo = formularioActual;
    modalidadPendiente = modalidad;

    botonEnviarActivo = modalidad === "grupal"
        ? formularioGrupal.querySelector("#btn-enviar-grupal")
        : botonEnviar;

    if (!botonEnviarActivo) {
        mostrarError(
            "No se encontró el botón para enviar la inscripción."
        );
        return;
    }

    // Crear un identificador para esta solicitud
    const requestId =
        Date.now() + "-" +
        Math.random().toString(36).slice(2);

    requestIdPendiente = requestId;

    // El formulario individual ya tiene estos campos ocultos.
    // En el grupal los creamos si todavía no existen.
    function prepararCampoOculto(nombre, valor) {

        let campo = formularioActual.querySelector(
            `input[name="${nombre}"]`
        );

        if (!campo) {
            campo = document.createElement("input");
            campo.type = "hidden";
            campo.name = nombre;
            formularioActual.appendChild(campo);
        }

        campo.value = valor;
    }

    prepararCampoOculto("_requestId", requestId);
    prepararCampoOculto(
        "_parentOrigin",
        window.location.origin
    );

    // Identificar el tipo de inscripción para Apps Script
    prepararCampoOculto("tipoRegistro", modalidad);

    // Mostrar la pantalla de carga
    formulario.hidden = true;
    formularioGrupal.hidden = true;

    estadoExito.hidden = true;
    estadoError.hidden = true;
    estadoCargando.hidden = false;

    botonEnviarActivo.disabled = true;
    botonCerrar.disabled = true;

    // Preparar el envío al iframe invisible
    formularioActual.method = "POST";
    formularioActual.action = URL_APPS_SCRIPT;
    formularioActual.target = iframeRespuesta.name;

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

        // Enviar al iframe sin repetir el evento submit
        HTMLFormElement.prototype.submit.call(formularioActual);

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
  }


   // Envío individual
   formulario.addEventListener("submit", (evento) => {
    enviarInscripcion(evento, formulario, "individual");
   });


   // Envío grupal
   formularioGrupal.addEventListener("submit", (evento) => {
    enviarInscripcion(evento, formularioGrupal, "grupal");
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
       formularioGrupal.hidden = true;

       estadoCargando.hidden = true;
       estadoError.hidden = true;
       estadoExito.hidden = false;

     if (mensajeExito) {

        if (modalidadPendiente === "grupal") {

            mensajeExito.textContent =
                "La inscripción grupal se registró correctamente. " +
                "Participantes registrados: " +
                resultado.cantidadRegistrada + ".";

        } else {

            mensajeExito.textContent =
                "Tu inscripción se registró correctamente. " +
                "Tu código de participante es: " +
                resultado.idParticipante + ".";

        }
     }

      console.log(
        "FINTECH: inscripción registrada.",
        resultado
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

    // Volver al formulario que se estaba utilizando
    vistaSelector.hidden = true;
    vistaIndividual.hidden = modalidadPendiente !== "individual";
    vistaGrupal.hidden = modalidadPendiente !== "grupal";

    formulario.hidden = modalidadPendiente !== "individual";
    formularioGrupal.hidden = modalidadPendiente !== "grupal";

    botonEnviarActivo.disabled = false;
    botonCerrar.disabled = false;

  });

  console.log("FINTECH: JavaScript iniciado correctamente.");

}

// ==========================================
// PANTALLA DE CARGA
// ==========================================
const inicioCarga = Date.now();
window.addEventListener("load", () => {

    const pantallaCarga = document.getElementById("pantalla-carga");

    if (!pantallaCarga) return;

    const tiempoMinimo = 2000; // 2000 ms = 2 segundos
    const tiempoTranscurrido = Date.now() - inicioCarga;

    const tiempoRestante = Math.max(
        0,
        tiempoMinimo - tiempoTranscurrido
    );

    setTimeout(() => {
        pantallaCarga.classList.add("ocultar");
    }, tiempoRestante);

});


/* =========================================
   FINTECH - EFECTO DE PARTÍCULAS
========================================= */

document.addEventListener("DOMContentLoaded", iniciarParticulasFintech);

function iniciarParticulasFintech() {

    const canvas = document.getElementById("canvas-particulas");
    const imagen = document.querySelector(".imagen-invitacion");

    if (!canvas || !imagen) {
        console.warn("FINTECH: no se encontró el canvas o la imagen.");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        console.warn("FINTECH: no se pudo iniciar el canvas.");
        return;
    }

    let ancho = 0;
    let alto = 0;
    let particulas = [];

    let limites = {
        izquierda: 0,
        arriba: 0,
        derecha: window.innerWidth,
        abajo: window.innerHeight,
        ancho: window.innerWidth,
        alto: window.innerHeight
    };

    const movimientoReducido = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


    /* =====================================
       1. CALCULAR EL ÁREA REAL DE LA IMAGEN
    ===================================== */

    function calcularLimitesImagen() {

        const rect = imagen.getBoundingClientRect();

        const anchoNatural = imagen.naturalWidth;
        const altoNatural = imagen.naturalHeight;

        if (!anchoNatural || !altoNatural) {
            return {
                izquierda: rect.left,
                arriba: rect.top,
                derecha: rect.right,
                abajo: rect.bottom,
                ancho: rect.width,
                alto: rect.height
            };
        }

        // La imagen usa object-fit: contain
        const escala = Math.min(
            rect.width / anchoNatural,
            rect.height / altoNatural
        );

        const anchoDibujo = anchoNatural * escala;
        const altoDibujo = altoNatural * escala;

        const izquierda =
            rect.left + (rect.width - anchoDibujo) / 2;

        const arriba =
            rect.top + (rect.height - altoDibujo) / 2;

        return {
            izquierda,
            arriba,
            derecha: izquierda + anchoDibujo,
            abajo: arriba + altoDibujo,
            ancho: anchoDibujo,
            alto: altoDibujo
        };
    }


    /* =====================================
       2. CREAR PARTÍCULAS
    ===================================== */

    function crearParticulas() {

        // Ajustar la cantidad al tamaño de la imagen
        const area = limites.ancho * limites.alto;

        const cantidad = Math.max(
            25,
            Math.min(85, Math.round(area / 14000))
        );

        particulas = [];

        for (let i = 0; i < cantidad; i++) {

            particulas.push({
                x: limites.izquierda +
                    Math.random() * limites.ancho,

                y: limites.arriba +
                    Math.random() * limites.alto,

                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,

                radio: 0.6 + Math.random() * 1.5,

                opacidad: 0.25 + Math.random() * 0.55,

                fase: Math.random() * Math.PI * 2
            });

        }
    }


    /* =====================================
       3. ADAPTAR EL CANVAS A LA PANTALLA
    ===================================== */

    function ajustarCanvas() {

        const dpr = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        ancho = window.innerWidth;
        alto = window.innerHeight;

        canvas.width = Math.round(ancho * dpr);
        canvas.height = Math.round(alto * dpr);

        canvas.style.width = ancho + "px";
        canvas.style.height = alto + "px";

        // Mantener la nitidez en pantallas de alta resolución
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        limites = calcularLimitesImagen();

        crearParticulas();

        dibujar(false);
    }


    /* =====================================
       4. ANIMAR Y DIBUJAR
    ===================================== */

    function dibujar(mover) {

        ctx.clearRect(0, 0, ancho, alto);

        // Movimiento lento y continuo
        if (mover) {

            particulas.forEach(p => {

                p.x += p.vx;
                p.y += p.vy;

                // Rebotar suavemente en los límites de la imagen
                if (p.x < limites.izquierda) {
                    p.x = limites.izquierda;
                    p.vx = Math.abs(p.vx);
                }

                if (p.x > limites.derecha) {
                    p.x = limites.derecha;
                    p.vx = -Math.abs(p.vx);
                }

                if (p.y < limites.arriba) {
                    p.y = limites.arriba;
                    p.vy = Math.abs(p.vy);
                }

                if (p.y > limites.abajo) {
                    p.y = limites.abajo;
                    p.vy = -Math.abs(p.vy);
                }

                p.fase += 0.025;

            });

        }


        // Dibujar líneas entre partículas cercanas
        const distanciaMaxima = 105;

        ctx.lineWidth = 0.7;

        for (let i = 0; i < particulas.length; i++) {

            for (let j = i + 1; j < particulas.length; j++) {

                const a = particulas[i];
                const b = particulas[j];

                const dx = a.x - b.x;
                const dy = a.y - b.y;

                const distancia = Math.sqrt(
                    dx * dx + dy * dy
                );

                if (distancia < distanciaMaxima) {

                    const intensidad =
                        (1 - distancia / distanciaMaxima) * 0.22;

                    ctx.strokeStyle =
                        `rgba(125, 200, 230, ${intensidad})`;

                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();

                }

            }

        }


        // Dibujar los puntos luminosos
        particulas.forEach(p => {

            const brillo =
                0.75 + Math.sin(p.fase) * 0.25;

            const opacidad = p.opacidad * brillo;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.radio,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(225, 245, 255, ${opacidad})`;

            ctx.shadowColor = "rgba(115, 205, 255, 0.6)";
            ctx.shadowBlur = 7;

            ctx.fill();

        });

        // Evitar que el brillo afecte a otras operaciones
        ctx.shadowBlur = 0;
    }


    /* =====================================
       5. BUCLE DE ANIMACIÓN
    ===================================== */

    function animar() {

        dibujar(true);

        if (!movimientoReducido) {
            requestAnimationFrame(animar);
        }

    }


    /* =====================================
       6. INICIAR Y ADAPTAR
    ===================================== */

    ajustarCanvas();

    if (!movimientoReducido) {
        requestAnimationFrame(animar);
    }

    // Recalcular al cambiar tamaño u orientación
    window.addEventListener("resize", ajustarCanvas);

    // Actualizar si <picture> cambia de imagen
    imagen.addEventListener("load", ajustarCanvas);

}