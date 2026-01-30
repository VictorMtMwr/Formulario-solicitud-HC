/**
 * Formato Solicitud Copia Historia Clínica
 * Inicializa fecha del día y pads de firma
 */
(function () {
    'use strict';

    // Mostrar/ocultar sección "por tercero"
    function initNombrePropioTercero() {
        var seccion = document.getElementById('seccion-tercero');
        var opcionPropio = document.getElementById('opcionPropio');
        var opcionTercero = document.getElementById('opcionTercero');
        if (!seccion || !opcionPropio || !opcionTercero) return;

        function actualizarSeccion() {
            var visible = opcionTercero.checked;
            seccion.style.display = visible ? 'block' : 'none';
            var cedulaTercero = document.getElementById('cedulaTercero');
            if (cedulaTercero) cedulaTercero.required = visible;
        }

        opcionPropio.addEventListener('change', actualizarSeccion);
        opcionTercero.addEventListener('change', actualizarSeccion);
        actualizarSeccion(); // estado inicial (a nombre propio por defecto)
    }

    // Fecha automática del día
    function initFecha() {
        var hoy = new Date();
        var y = hoy.getFullYear();
        var m = String(hoy.getMonth() + 1).padStart(2, '0');
        var d = String(hoy.getDate()).padStart(2, '0');
        var fechaEl = document.getElementById('fecha');
        if (fechaEl) fechaEl.value = y + '-' + m + '-' + d;
    }

    // Pads de firma (mouse y touch)
    function initFirmas() {
        var canvases = ['firmaPaciente', 'firmaFuncionario'];
        canvases.forEach(function (id) {
            var canvas = document.getElementById(id);
            if (!canvas) return;
            var ctx = canvas.getContext('2d');
            var dibujando = false;
            var lastX = 0, lastY = 0;

            function getPos(e) {
                var r = canvas.getBoundingClientRect();
                var sx = canvas.width / r.width;
                var sy = canvas.height / r.height;
                var x, y;
                if (e.touches && e.touches.length) {
                    x = (e.touches[0].clientX - r.left) * sx;
                    y = (e.touches[0].clientY - r.top) * sy;
                } else {
                    x = (e.clientX - r.left) * sx;
                    y = (e.clientY - r.top) * sy;
                }
                return { x: x, y: y };
            }

            function start(e) {
                e.preventDefault();
                dibujando = true;
                var p = getPos(e);
                lastX = p.x;
                lastY = p.y;
            }

            function move(e) {
                e.preventDefault();
                if (!dibujando) return;
                var p = getPos(e);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                lastX = p.x;
                lastY = p.y;
            }

            function end(e) {
                e.preventDefault();
                dibujando = false;
            }

            canvas.addEventListener('mousedown', start);
            canvas.addEventListener('mousemove', move);
            canvas.addEventListener('mouseup', end);
            canvas.addEventListener('mouseleave', end);
            canvas.addEventListener('touchstart', start, { passive: false });
            canvas.addEventListener('touchmove', move, { passive: false });
            canvas.addEventListener('touchend', end, { passive: false });
        });
    }

    // Validar que los adjuntos sean solo PDF
    function initAdjuntos() {
        var cedulaPaciente = document.getElementById('cedulaPaciente');
        var cedulaTercero = document.getElementById('cedulaTercero');
        var infoPaciente = document.getElementById('infoCedulaPaciente');
        var infoTercero = document.getElementById('infoCedulaTercero');

        function validarPdf(input, infoEl) {
            if (!input || !infoEl) return;
            input.addEventListener('change', function () {
                var file = input.files && input.files[0];
                if (!file) {
                    infoEl.textContent = '';
                    infoEl.classList.remove('error');
                    return;
                }
                var esPdf = file.type === 'application/pdf' || file.name.toLowerCase().slice(-4) === '.pdf';
                if (!esPdf) {
                    input.value = '';
                    infoEl.textContent = 'Solo se permiten archivos PDF.';
                    infoEl.classList.add('error');
                } else {
                    infoEl.textContent = file.name;
                    infoEl.classList.remove('error');
                }
            });
        }

        validarPdf(cedulaPaciente, infoPaciente);
        validarPdf(cedulaTercero, infoTercero);
    }

    function limpiarFirma(id) {
        var canvas = document.getElementById(id);
        if (canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function getCheckedValues(name) {
        var inputs = document.querySelectorAll('input[name="' + name + '"]:checked');
        return Array.prototype.map.call(inputs, function (el) { return el.value; });
    }

    function getRadioValue(name) {
        var el = document.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : '';
    }

    function enviarFormulario(e) {
        if (e) e.preventDefault();
        var form = document.getElementById('formSolicitud');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        var firmaPaciente = document.getElementById('firmaPaciente');
        var firmaFuncionario = document.getElementById('firmaFuncionario');
        var esTercero = document.getElementById('opcionTercero').checked;

        var solicitud = {
            id: 'sol_' + Date.now(),
            fechaSolicitud: new Date().toISOString(),
            tipoSolicitud: getRadioValue('nombre_propio_tercero'),
            fecha: document.getElementById('fecha').value,
            nombrePaciente: document.getElementById('nombrePacienteForm').value,
            noDocumento: document.getElementById('noDocumento').value,
            tipoDocumento: getRadioValue('tipo_doc'),
            entidadAseguradora: document.getElementById('entidadAseguradora').value,
            fechaUltimaAtencion: document.getElementById('fechaUltimaAtencion').value,
            correo: document.getElementById('correo').value,
            telefonos: document.getElementById('telefonos').value,
            documentosSolicitados: getCheckedValues('doc_solicitado'),
            especifiquePartes: document.getElementById('especifiquePartes').value,
            motivosSolicitud: getCheckedValues('motivo_solicitud'),
            cualOtro: document.getElementById('cualOtro').value,
            nombreFirma: document.getElementById('nombrePaciente').value,
            firmaPaciente: firmaPaciente ? firmaPaciente.toDataURL('image/png') : null,
            cedulaPaciente: (document.getElementById('cedulaPaciente').files[0] || {}).name || null,
            estado: 'pendiente'
        };

        if (esTercero) {
            solicitud.nombreSolicitante = document.getElementById('nombreSolicitante').value;
            solicitud.traeCarta = document.querySelector('input[name="trae_carta"]:checked') ? 'si' : '';
            solicitud.traeCopiaDocs = document.querySelector('input[name="trae_copia_docs"]:checked') ? 'si' : '';
            solicitud.nombreFuncionario = document.getElementById('nombreFuncionario').value;
            solicitud.firmaFuncionario = firmaFuncionario ? firmaFuncionario.toDataURL('image/png') : null;
            solicitud.nombrePacienteTercero = document.getElementById('nombrePacienteTercero').value;
            solicitud.fechaEntrega = document.getElementById('fechaEntrega').value;
            solicitud.cedulaTercero = (document.getElementById('cedulaTercero').files[0] || {}).name || null;
        }

        var solicitudes = JSON.parse(localStorage.getItem('solicitudesHC') || '[]');
        solicitudes.unshift(solicitud);
        localStorage.setItem('solicitudesHC', JSON.stringify(solicitudes));

        /* Reiniciar todos los campos */
        form.reset();
        initFecha();

        var infoCedulaPaciente = document.getElementById('infoCedulaPaciente');
        var infoCedulaTercero = document.getElementById('infoCedulaTercero');
        if (infoCedulaPaciente) infoCedulaPaciente.textContent = '';
        if (infoCedulaTercero) infoCedulaTercero.textContent = '';

        var seccionTercero = document.getElementById('seccion-tercero');
        var cedulaTercero = document.getElementById('cedulaTercero');
        if (seccionTercero) seccionTercero.style.display = 'none';
        if (cedulaTercero) cedulaTercero.required = false;

        limpiarFirma('firmaPaciente');
        limpiarFirma('firmaFuncionario');

        mostrarModalExito(solicitud.id);
    }

    function mostrarModalExito(refId) {
        var modal = document.getElementById('modalExito');
        var refEl = document.getElementById('modalRefId');
        if (refEl) refEl.textContent = refId;
        if (modal) modal.classList.add('activo');
    }

    function cerrarModalExito() {
        var modal = document.getElementById('modalExito');
        if (modal) modal.classList.remove('activo');
    }

    function initFormSubmit() {
        var form = document.getElementById('formSolicitud');
        if (form) {
            form.addEventListener('submit', enviarFormulario);
        }

        var btnCerrar = document.getElementById('modalExitoCerrar');
        if (btnCerrar) {
            btnCerrar.addEventListener('click', cerrarModalExito);
        }

        var modalExito = document.getElementById('modalExito');
        if (modalExito) {
            modalExito.addEventListener('click', function (e) {
                if (e.target === modalExito) cerrarModalExito();
            });
        }
    }

    // Exponer funciones usadas desde el HTML
    window.limpiarFirma = limpiarFirma;
    window.enviarFormulario = enviarFormulario;

    // Inicializar al cargar el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initNombrePropioTercero();
            initFecha();
            initFirmas();
            initAdjuntos();
            initFormSubmit();
        });
    } else {
        initNombrePropioTercero();
        initFecha();
        initFirmas();
        initAdjuntos();
        initFormSubmit();
    }
})();
