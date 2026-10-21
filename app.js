/* =========================================================
   SESIÓN (backend PHP + session_start)
   - Al cargar CUALQUIER página se consulta el endpoint privado
     api/mis_compras.php. Si responde 200 hay sesión; si responde
     401 el visitante es "invitado".
   - Según el resultado se muestran/ocultan elementos del DOM:
       data-visible="sesion"    -> solo con sesión iniciada
       data-visible="invitado"  -> solo sin sesión
   - Todo dato del usuario se escribe con .textContent (nunca
     innerHTML) para evitar ataques XSS.
   ========================================================= */

let sesionActual = null; // { usuario, compras } cuando hay sesión; null si no

// Pregunta al servidor si hay sesión activa (fetch al endpoint privado)
async function consultarSesion() {
  try {
    const respuesta = await fetch("api/mis_compras.php", { credentials: "same-origin" });
    if (respuesta.status === 401) return null; // sin sesión
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
    const datos = await respuesta.json();
    return datos.estado === "exito" ? datos : null;
  } catch (error) {
    console.error("No se pudo verificar la sesión:", error);
    return null;
  }
}

// Muestra u oculta los elementos marcados con data-visible según la sesión
function alternarVistasPorSesion(haySesion) {
  document.querySelectorAll('[data-visible="sesion"]').forEach((el) => {
    el.hidden = !haySesion;
  });
  document.querySelectorAll('[data-visible="invitado"]').forEach((el) => {
    el.hidden = haySesion;
  });
}

// Construye en el <nav> el bloque de usuario (saludo, Mis compras, Cerrar sesión)
function construirBarraSesion() {
  const nav = document.querySelector("nav");
  if (!nav) return;

  let barra = nav.querySelector(".nav-sesion");
  if (!barra) {
    barra = document.createElement("span");
    barra.className = "nav-sesion";
    nav.appendChild(barra);
  }
  barra.replaceChildren(); // limpia sin usar innerHTML

  if (sesionActual) {
    const saludo = document.createElement("span");
    saludo.className = "nav-saludo";
    // textContent: el nombre viene de la base de datos y NO es confiable
    saludo.textContent = `👤 ${sesionActual.usuario.nombre}`;

    const enlaceCompras = document.createElement("a");
    enlaceCompras.href = "mis_compras.html";
    enlaceCompras.textContent = "Mis compras";

    const botonSalir = document.createElement("button");
    botonSalir.type = "button";
    botonSalir.className = "boton-salir";
    botonSalir.textContent = "Cerrar sesión";
    botonSalir.addEventListener("click", cerrarSesion);

    barra.append(saludo, enlaceCompras, botonSalir);
  } else {
    const enlaceIngreso = document.createElement("a");
    enlaceIngreso.href = "login.html";
    enlaceIngreso.textContent = "Ingresar";
    barra.append(enlaceIngreso);
  }

  // El enlace "INGRESAR / REGISTRARSE" de la barra superior (si existe)
  const enlaceTopbar = document.querySelector("#enlace-ingreso");
  if (enlaceTopbar) {
    if (sesionActual) {
      enlaceTopbar.textContent = `HOLA, ${sesionActual.usuario.nombre.toUpperCase()}`;
      enlaceTopbar.href = "mis_compras.html";
    } else {
      enlaceTopbar.textContent = "INGRESAR / REGISTRARSE";
      enlaceTopbar.href = "login.html";
    }
  }
}

async function cerrarSesion() {
  try {
    await fetch("api/logout.php", { method: "POST", credentials: "same-origin" });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
  window.location.href = "login.html";
}

// Aplica el estado de sesión a toda la página
function aplicarSesion() {
  alternarVistasPorSesion(Boolean(sesionActual));
  construirBarraSesion();

  // login.html: nombre en el aviso "ya iniciaste sesión"
  const loginNombre = document.querySelector("#login-nombre");
  if (loginNombre && sesionActual) loginNombre.textContent = sesionActual.usuario.nombre;

  // mis_compras.html
  if (document.querySelector("#panel-compras") && sesionActual) renderizarMisCompras();

  // comprar.html: precarga nombre y e-mail del usuario logueado
  const campoNombre = document.querySelector("#formulario-compra #nombre");
  const campoEmail = document.querySelector("#formulario-compra #email");
  if (sesionActual && campoNombre && !campoNombre.value) {
    campoNombre.value = `${sesionActual.usuario.nombre} ${sesionActual.usuario.apellido}`.trim();
  }
  if (sesionActual && campoEmail && !campoEmail.value) {
    campoEmail.value = sesionActual.usuario.email;
  }
}

// Dibuja la tabla de compras del usuario (solo con textContent)
function renderizarMisCompras() {
  document.querySelector("#compras-nombre").textContent =
    `${sesionActual.usuario.nombre} ${sesionActual.usuario.apellido}`.trim();
  document.querySelector("#compras-email").textContent = sesionActual.usuario.email;

  const compras = sesionActual.compras || [];
  const tabla = document.querySelector("#tabla-compras");
  const vacio = document.querySelector("#compras-vacio");
  const cuerpo = document.querySelector("#compras-cuerpo");
  cuerpo.replaceChildren();

  tabla.hidden = compras.length === 0;
  vacio.hidden = compras.length !== 0;

  const MEDIOS = {
    tarjeta_credito: "Tarjeta de crédito",
    tarjeta_debito: "Tarjeta de débito",
    transferencia: "Transferencia bancaria",
    efectivo: "Efectivo (Pago Fácil / Rapipago)"
  };

  compras.forEach((compra) => {
    const fila = document.createElement("tr");
    const celdas = [
      compra.id,
      compra.evento_titulo,
      `$${Number(compra.precio).toLocaleString("es-AR")}`,
      MEDIOS[compra.medio_pago] || compra.medio_pago,
      compra.creado_en
    ];
    celdas.forEach((valor) => {
      const td = document.createElement("td");
      td.textContent = valor; // nunca innerHTML con datos del servidor
      fila.appendChild(td);
    });
    cuerpo.appendChild(fila);
  });
}

// Muestra un mensaje en una caja (info | exito | error) usando textContent
function mostrarMensajeCaja(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = `mensaje-box ${tipo}`;
}

// POST JSON genérico. Devuelve { ok, estado HTTP, cuerpo }
async function enviarJSON(url, datos) {
  const respuesta = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  let cuerpo = {};
  try { cuerpo = await respuesta.json(); } catch (e) { /* respuesta sin JSON */ }
  return { ok: respuesta.ok, status: respuesta.status, cuerpo };
}

/* ---------- Login (login.html) ---------- */
const formLogin = document.querySelector("#form-login");
if (formLogin) {
  const msgLogin = document.querySelector("#msg-login");
  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const email = formLogin.querySelector("#email").value.trim();
    const password = formLogin.querySelector("#password").value;

    if (!email || !password) {
      mostrarMensajeCaja(msgLogin, "Ingresá tu e-mail y tu contraseña.", "error");
      return;
    }

    mostrarMensajeCaja(msgLogin, "Verificando credenciales...", "info");
    try {
      const { ok, cuerpo } = await enviarJSON("api/login.php", { email, password });
      if (ok && cuerpo.estado === "exito") {
        mostrarMensajeCaja(msgLogin, "¡Bienvenido/a! Te estamos redirigiendo...", "exito");
        formLogin.reset();
        setTimeout(() => { window.location.href = "index.html"; }, 800);
      } else {
        mostrarMensajeCaja(msgLogin, cuerpo.mensaje || "Credenciales incorrectas.", "error");
      }
    } catch (error) {
      mostrarMensajeCaja(msgLogin, "No se pudo conectar con el servidor.", "error");
    }
  });
}

/* ---------- Registro (registro.html) ---------- */
const formRegistro = document.querySelector("#form-registro");
if (formRegistro) {
  const msgRegistro = document.querySelector("#msg-registro");
  formRegistro.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const valor = (id) => formRegistro.querySelector(`#${id}`).value.trim();

    const datos = {
      email: valor("email"),
      password: formRegistro.querySelector("#password").value,
      nombre: valor("nombre"),
      apellido: valor("apellido"),
      pais: valor("pais"),
      telefono: valor("telefono"),
      tipo_doc: valor("tipo_doc"),
      doc: valor("doc"),
      nacimiento: valor("nacimiento"),
      genero: valor("genero"),
      newsletter: formRegistro.querySelector("#newsletter").checked
    };

    if (!datos.nombre || !datos.apellido || !datos.email || !datos.password) {
      mostrarMensajeCaja(msgRegistro, "Completá nombre, apellido, e-mail y contraseña.", "error");
      return;
    }
    if (datos.password.length < 6) {
      mostrarMensajeCaja(msgRegistro, "La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }
    if (datos.password !== formRegistro.querySelector("#password2").value) {
      mostrarMensajeCaja(msgRegistro, "Las contraseñas no coinciden.", "error");
      return;
    }

    mostrarMensajeCaja(msgRegistro, "Creando tu cuenta...", "info");
    try {
      const { ok, cuerpo } = await enviarJSON("api/registro.php", datos);
      if (ok && cuerpo.estado === "exito") {
        mostrarMensajeCaja(msgRegistro, "¡Cuenta creada! Te llevamos a iniciar sesión...", "exito");
        formRegistro.reset();
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
      } else {
        mostrarMensajeCaja(msgRegistro, cuerpo.mensaje || "No se pudo crear la cuenta.", "error");
      }
    } catch (error) {
      mostrarMensajeCaja(msgRegistro, "No se pudo conectar con el servidor.", "error");
    }
  });
}

// Inicio: al cargar la página se verifica la sesión contra el servidor
document.addEventListener("DOMContentLoaded", async () => {
  sesionActual = await consultarSesion();
  aplicarSesion();
});

/* =========================================================
   Ficha de evento dinámica (vive en producto.html)
   Lee ?id=... de la URL y muestra los datos de ese show.
   Para agregar/editar un show, solo hay que tocar este objeto.
   ========================================================= */

const EVENTOS = {
  bts: {
    titulo: "BTS World Tour ARIRANG",
    imagen: "https://cdn.getcrowder.com/images/b66dd286-ad48-4a83-bed7-eeae6da7b866-bts.jpeg",
    fecha: "21 de Octubre de 2026",
    lugar: "Estadio Único de La Plata, Buenos Aires",
    descripcion: "BTS, acrónimo de Bangtan Sonyeondan o “Beyond the Scene”, es una boyband surcoreana nominada al GRAMMY que ha conquistado a millones de fans en todo el mundo desde su debut en junio de 2013. Sus integrantes son RM, Jin, SUGA, j-hope, Jimin, V y Jung Kook.",
    entradas: ["Campo General - $45.000", "Platea Baja - $60.000", "Platea Alta - $50.000", "VIP + Meet & Greet - $120.000"],
    precioDesde: "$45.000"
  },
  olivia: {
    titulo: "Olivia Wald",
    imagen: "https://cdn.getcrowder.com/images/18214696-0d49-49c5-9f24-a4388031fe2e-image.png?w=480&format=webp",
    fecha: "25 de Octubre de 2026",
    lugar: "C Art Media, Buenos Aires",
    descripcion: "Olivia Wald presenta su show en vivo con un repertorio que recorre sus mayores éxitos y canciones nuevas.",
    entradas: ["Campo General - $80.000", "Platea - $95.000", "VIP - $130.000"],
    precioDesde: "$80.000"
  },
  maroon5: {
    titulo: "Maroon 5",
    imagen: "https://cdn.getcrowder.com/images/ea85912e-de3b-41cb-9209-da3d9a7c2034-maroon5-banneraa-640x640-1.jpg?w=480&format=webp",
    fecha: "8 de Noviembre de 2026",
    lugar: "Estadio Obras, Buenos Aires",
    descripcion: "La banda estadounidense liderada por Adam Levine llega a Buenos Aires con sus grandes hits del pop rock.",
    entradas: ["Campo General - $75.000", "Platea Baja - $95.000", "VIP - $140.000"],
    precioDesde: "$75.000"
  },
  calamaro: {
    titulo: "Andrés Calamaro",
    imagen: "https://cdn.getcrowder.com/images/957fb504-d4ae-4d2c-8269-620f49958fbf-image.jpeg?w=480&format=webp",
    fecha: "20 de Noviembre de 2026",
    lugar: "Palacio de los Deportes, Buenos Aires",
    descripcion: "Andrés Calamaro vuelve a los escenarios con un show que repasa las canciones más queridas de su carrera.",
    entradas: ["Campo General - $65.000", "Platea - $80.000", "VIP - $110.000"],
    precioDesde: "$65.000"
  },
  foofighters: {
    titulo: "Foo Fighters",
    imagen: "https://cdn.getcrowder.com/images/6450bfb0-e5a3-4527-b326-20aceb834f98-9cb0ea32-0e49-40ad-b09a-0962eae3a21d-foofighters-bannersaa-1920x720.jpg?w=960&format=webp",
    fecha: "A confirmar",
    lugar: "A confirmar",
    descripcion: "La banda de rock liderada por Dave Grohl llega con su gira en vivo.",
    entradas: ["Campo General - $70.000", "Platea - $90.000"],
    precioDesde: "$70.000"
  },
  // ⚠️ Completá estos shows con sus datos reales (nombre, fecha, lugar, etc.)
  show1: {
    titulo: "Show 1",
    imagen: "https://cdn.getcrowder.com/images/287e865e-4338-4e21-94e2-a45e6c84e122-017547dd-d457-4dd2-a684-080027698ae6-06d3e074-b3c8-4ac9-84c5-88b0bff0dfef.jpg?w=960&format=webp",
    fecha: "A confirmar", lugar: "A confirmar", descripcion: "Próximamente más información.",
    entradas: ["Entrada General - $50.000"], precioDesde: "$50.000"
  },
  show2: {
    titulo: "Show 2",
    imagen: "https://cdn.getcrowder.com/images/96b59e76-950c-4536-bb44-8e30b7c09426-image.png?w=640&format=webp",
    fecha: "A confirmar", lugar: "A confirmar", descripcion: "Próximamente más información.",
    entradas: ["Entrada General - $50.000"], precioDesde: "$50.000"
  },
  show3: {
    titulo: "Show 3",
    imagen: "https://cdn.getcrowder.com/images/94e7857f-33d2-4e86-8c6b-1c2ce07667b3-640x640.png?w=480&format=webp",
    fecha: "A confirmar", lugar: "A confirmar", descripcion: "Próximamente más información.",
    entradas: ["Entrada General - $50.000"], precioDesde: "$50.000"
  },
  show4: {
    titulo: "Show 4",
    imagen: "https://cdn.getcrowder.com/images/e723dbb5-22e6-4f53-b343-ee2383179488-pagweb-17-5.jpg?w=480&format=webp",
    fecha: "A confirmar", lugar: "A confirmar", descripcion: "Próximamente más información.",
    entradas: ["Entrada General - $50.000"], precioDesde: "$50.000"
  },
  show6: {
    titulo: "Show 6",
    imagen: "https://cdn.getcrowder.com/images/12491991-802b-4c4e-95b0-1dcb5f993be0-b94994fd-d6a7-478c-b4a4-b3f640878dda-whatsapp-image-2026-06-12-at-12.53.19.jpg?w=640&format=webp",
    fecha: "A confirmar", lugar: "A confirmar", descripcion: "Próximamente más información.",
    entradas: ["Entrada General - $50.000"], precioDesde: "$50.000"
  }
};

const fichaEvento = document.querySelector("#ficha-evento");

if (fichaEvento) {
  const idEvento = new URLSearchParams(window.location.search).get("id") || "bts";
  const evento = EVENTOS[idEvento];

  if (!evento) {
    fichaEvento.innerHTML = `
      <h2>Evento no encontrado</h2>
      <p>No encontramos ese show. Volvé a la <a href="index.html">cartelera</a>.</p>
    `;
  } else {
    document.title = `TicketShow - ${evento.titulo}`;
    document.querySelector("#evento-titulo").textContent = evento.titulo;
    const imagen = document.querySelector("#evento-imagen");
    imagen.src = evento.imagen;
    imagen.alt = evento.titulo;
    document.querySelector("#evento-fecha").textContent = evento.fecha;
    document.querySelector("#evento-lugar").textContent = evento.lugar;
    document.querySelector("#evento-descripcion").textContent = evento.descripcion;
    document.querySelector("#evento-precio").textContent = evento.precioDesde;
    const listaEntradas = document.querySelector("#evento-entradas");
    listaEntradas.replaceChildren();
    evento.entradas.forEach((entrada) => {
      const li = document.createElement("li");
      li.textContent = entrada;
      listaEntradas.appendChild(li);
    });
    // Pasamos el id a la pantalla de compra para preseleccionar el show
    document.querySelector("#evento-comprar").href = `comprar.html?id=${idEvento}`;
  }
}

/* =========================================================
   Preselecciona el show en comprar.html según ?id=...
   ========================================================= */

const selectTickets = document.querySelector("#tickets");
if (selectTickets) {
  const idPreseleccionado = new URLSearchParams(window.location.search).get("id");
  if (idPreseleccionado && [...selectTickets.options].some((o) => o.value === idPreseleccionado)) {
    selectTickets.value = idPreseleccionado;
  }
}

/* =========================================================
   Al finalizar la compra, se muestra la Encuesta de Satisfacción
   (vive en comprar.html)
   ========================================================= */

const formularioCompra = document.querySelector("#formulario-compra");
const confirmacionCompra = document.querySelector("#confirmacion-compra");

if (formularioCompra && confirmacionCompra) {
  formularioCompra.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const pintar = (texto, claseCaja, claseTexto) => {
      confirmacionCompra.replaceChildren();
      confirmacionCompra.className = claseCaja;
      const p = document.createElement("p");
      p.className = claseTexto;
      p.textContent = texto;
      confirmacionCompra.appendChild(p);
    };

    const datos = {
      direccion: formularioCompra.querySelector("#direccion").value.trim(),
      telefono: formularioCompra.querySelector("#telefono").value.trim(),
      pago: formularioCompra.querySelector("#pago").value,
      tickets: formularioCompra.querySelector("#tickets").value
    };

    try {
      const { ok, status, cuerpo } = await enviarJSON("api/comprar.php", datos);

      if (status === 401) {
        // La sesión expiró o nunca existió: el endpoint privado rechazó la compra
        pintar("Tu sesión no es válida. Iniciá sesión para comprar...", "mensaje-error-caja", "mensaje-error");
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
        return;
      }
      if (!ok || cuerpo.estado !== "exito") {
        pintar(cuerpo.mensaje || "No se pudo registrar la compra.", "mensaje-error-caja", "mensaje-error");
        return;
      }

      pintar("¡Compra confirmada! Te estamos llevando a la encuesta de satisfacción...", "mensaje-exito", "");
      setTimeout(() => { window.location.href = "encuesta.html"; }, 1800);
    } catch (error) {
      console.error(error);
      pintar("No se pudo conectar con el servidor.", "mensaje-error-caja", "mensaje-error");
    }
  });
}

/* =========================================================
   Opción 14 — Encuesta de Satisfacción del Usuario
   (vive en encuesta.html)
   ========================================================= */

const formularioEncuesta = document.querySelector("#formulario-encuesta");
const textareaComentario = document.querySelector("#comentario");
const contadorCaracteres = document.querySelector("#contador-caracteres");
const resultadoEncuesta = document.querySelector("#resultado-encuesta");

const LIMITE_CARACTERES = 300;

// Palabras clave usadas para simular una clasificación de sentimiento
// (representa, de forma simplificada, lo que haría una RNA entrenada para PLN)
const PALABRAS_POSITIVAS = [
  "excelente", "genial", "increíble", "increible", "buena", "bueno",
  "rápido", "rapido", "fácil", "facil", "recomiendo", "satisfecho",
  "contento", "perfecto", "cómodo", "comodo", "amable"
];

const PALABRAS_NEGATIVAS = [
  "malo", "mala", "lento", "difícil", "dificil", "pésimo", "pesimo",
  "horrible", "problema", "error", "insatisfecho", "tardó", "tardo",
  "demora", "queja", "reclamo"
];

// Clasifica el comentario en Positivo / Negativo / Neutro contando coincidencias
function clasificarSentimiento(texto) {
  const textoNormalizado = texto.toLowerCase();
  let puntaje = 0;

  PALABRAS_POSITIVAS.forEach((palabra) => {
    if (textoNormalizado.includes(palabra)) puntaje += 1;
  });

  PALABRAS_NEGATIVAS.forEach((palabra) => {
    if (textoNormalizado.includes(palabra)) puntaje -= 1;
  });

  if (puntaje > 0) return "Positivo";
  if (puntaje < 0) return "Negativo";
  return "Neutro";
}

// Actualiza el contador de caracteres restantes del textarea
function actualizarContador() {
  const restantes = LIMITE_CARACTERES - textareaComentario.value.length;
  contadorCaracteres.textContent = `${restantes} caracteres restantes`;
  contadorCaracteres.classList.toggle("contador-caracteres--limite", restantes <= 20);
}

// Muestra un mensaje de error de validación en el DOM, sin enviar nada
function mostrarErrorValidacion(mensaje) {
  resultadoEncuesta.classList.remove("mensaje-exito");
  resultadoEncuesta.classList.add("mensaje-error-caja");
  resultadoEncuesta.innerHTML = `<p class="mensaje-error">${mensaje}</p>`;
}

// Valida los radio buttons obligatorios, clasifica el comentario y "envía" la encuesta
async function manejarEnvioEncuesta(evento) {
  evento.preventDefault();

  const satisfaccionElegida = formularioEncuesta.querySelector('input[name="satisfaccion"]:checked');
  const recomendacionElegida = formularioEncuesta.querySelector('input[name="recomendacion"]:checked');

  if (!satisfaccionElegida) {
    mostrarErrorValidacion("Por favor, elegí una opción de satisfacción antes de enviar.");
    return;
  }

  if (!recomendacionElegida) {
    mostrarErrorValidacion("Por favor, indicá si recomendarías TicketShow antes de enviar.");
    return;
  }

  const comentario = textareaComentario.value.trim();
  const sentimiento = comentario ? clasificarSentimiento(comentario) : "Sin comentario";

  try {
    const respuesta = await fetch("confirmacion-encuesta.json");

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status} al leer confirmacion-encuesta.json`);
    }

    const datos = await respuesta.json();

    resultadoEncuesta.classList.remove("mensaje-error-caja");
    resultadoEncuesta.classList.add("mensaje-exito");
    resultadoEncuesta.replaceChildren();
    const agregarLinea = (texto, destacado) => {
      const p = document.createElement("p");
      p.append(texto);
      if (destacado !== undefined) {
        const fuerte = document.createElement("strong");
        fuerte.textContent = destacado;
        p.append(fuerte);
      }
      resultadoEncuesta.appendChild(p);
    };
    agregarLinea(datos.mensaje);
    agregarLinea("Satisfacción: ", satisfaccionElegida.value);
    agregarLinea("¿Recomendaría TicketShow?: ", recomendacionElegida.value);
    agregarLinea("Análisis de sentimiento del comentario (RNA simplificada): ", sentimiento);

    formularioEncuesta.reset();
    actualizarContador();
  } catch (error) {
    console.error(error);
    mostrarErrorValidacion("No pudimos enviar tu encuesta. Probá nuevamente más tarde.");
  }
}

// Escuchadores desacoplados: solo se registran si estamos en encuesta.html
if (formularioEncuesta && textareaComentario && contadorCaracteres && resultadoEncuesta) {
  actualizarContador();
  textareaComentario.addEventListener("input", actualizarContador);
  formularioEncuesta.addEventListener("submit", manejarEnvioEncuesta);
}
