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
            seccion.style.display = opcionTercero.checked ? 'block' : 'none';
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

    function enviarFormulario() {
        alert('Formulario enviado correctamente.');
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
        });
    } else {
        initNombrePropioTercero();
        initFecha();
        initFirmas();
        initAdjuntos();
    }
})();
