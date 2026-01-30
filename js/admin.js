/**
 * Panel de administración - Gestión de solicitudes HC
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'solicitudesHC';

    function getSolicitudes() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveSolicitudes(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function formatearFecha(iso) {
        if (!iso) return '-';
        var d = new Date(iso);
        return d.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getBadgeClass(estado) {
        return 'badge badge-' + (estado || 'pendiente').replace(/\s/g, '_');
    }

    function getEstadoLabel(estado) {
        var map = {
            pendiente: 'Pendiente',
            en_proceso: 'En proceso',
            completada: 'Completada',
            rechazada: 'Rechazada'
        };
        return map[estado] || estado;
    }

    function renderSolicitudes(solicitudes) {
        var list = document.getElementById('solicitudesList');
        var empty = document.getElementById('emptyState');

        if (!list) return;

        var filtroEstado = (document.getElementById('filtroEstado') || {}).value;
        var busqueda = ((document.getElementById('busqueda') || {}).value || '').toLowerCase();

        var filtradas = solicitudes.filter(function (s) {
            if (filtroEstado && s.estado !== filtroEstado) return false;
            if (busqueda) {
                var texto = [
                    s.nombrePaciente,
                    s.noDocumento,
                    s.id,
                    s.correo
                ].filter(Boolean).join(' ').toLowerCase();
                if (texto.indexOf(busqueda) === -1) return false;
            }
            return true;
        });

        if (filtradas.length === 0) {
            empty.style.display = 'block';
            empty.textContent = filtroEstado || busqueda
                ? 'No hay solicitudes que coincidan con los filtros.'
                : 'No hay solicitudes registradas.';
            list.innerHTML = '';
            list.appendChild(empty);
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = '';

        filtradas.forEach(function (s) {
            var doc = s.documentosSolicitados && s.documentosSolicitados.length
                ? s.documentosSolicitados.join(', ')
                : '-';

            var card = document.createElement('div');
            card.className = 'solicitud-card';
            card.dataset.id = s.id;

            card.innerHTML =
                '<div class="solicitud-card-header">' +
                '<div>' +
                '<p class="solicitud-card-titulo">' + (s.nombrePaciente || 'Sin nombre') + '</p>' +
                '<p class="solicitud-card-meta">' + s.id + ' · ' + formatearFecha(s.fechaSolicitud) + '</p>' +
                '</div>' +
                '<span class="' + getBadgeClass(s.estado) + '">' + getEstadoLabel(s.estado) + '</span>' +
                '</div>' +
                '<div class="solicitud-card-body">' +
                '<p><strong>Doc:</strong> ' + (s.noDocumento || '-') + ' · <strong>Solicitud:</strong> ' + (s.tipoSolicitud === 'tercero' ? 'Por tercero' : 'A nombre propio') + '</p>' +
                '<p><strong>Documentos:</strong> ' + doc + '</p>' +
                '</div>';

            list.appendChild(card);
        });
    }

    function actualizarStats(solicitudes) {
        var pendientes = solicitudes.filter(function (s) { return s.estado === 'pendiente'; }).length;
        var elPend = document.getElementById('statPendientes');
        var elTotal = document.getElementById('statTotal');
        if (elPend) elPend.textContent = pendientes + ' pendientes';
        if (elTotal) elTotal.textContent = solicitudes.length + ' total';
    }

    function abrirDetalle(id) {
        var solicitudes = getSolicitudes();
        var s = solicitudes.find(function (x) { return x.id === id; });
        if (!s) return;

        var modal = document.getElementById('modalOverlay');
        var body = document.getElementById('modalBody');
        var titulo = document.getElementById('modalTitulo');
        var estadoSelect = document.getElementById('cambiarEstado');

        titulo.textContent = 'Solicitud ' + s.id;
        estadoSelect.value = s.estado || 'pendiente';

        var html = '';
        function row(label, value) {
            if (value == null || value === '') return '';
            if (Array.isArray(value)) value = value.join(', ') || '-';
            return '<div class="detalle-row"><div class="detalle-label">' + label + '</div><div class="detalle-value">' + value + '</div></div>';
        }

        html += row('Fecha solicitud', formatearFecha(s.fechaSolicitud));
        html += row('Tipo', s.tipoSolicitud === 'tercero' ? 'Por tercero' : 'A nombre propio');
        html += row('Nombre paciente', s.nombrePaciente);
        html += row('No. documento', s.noDocumento);
        html += row('Tipo documento', s.tipoDocumento);
        html += row('Entidad aseguradora', s.entidadAseguradora);
        html += row('Fecha última atención', s.fechaUltimaAtencion);
        html += row('Correo', s.correo);
        html += row('Teléfonos', s.telefonos);
        html += row('Documentos solicitados', s.documentosSolicitados);
        html += row('Especifique partes', s.especifiquePartes);
        html += row('Motivos', s.motivosSolicitud);
        html += row('¿Cuál?', s.cualOtro);
        html += row('Nombre en firma', s.nombreFirma);
        html += row('Cédula paciente', s.cedulaPaciente);

        if (s.tipoSolicitud === 'tercero') {
            html += row('Nombre solicitante', s.nombreSolicitante);
            html += row('Trae carta autorización', s.traeCarta);
            html += row('Trae copia documentos', s.traeCopiaDocs);
            html += row('Funcionario', s.nombreFuncionario);
            html += row('Fecha entrega', s.fechaEntrega);
            html += row('Cédula tercero', s.cedulaTercero);
        }

        if (s.firmaPaciente) {
            html += '<div class="detalle-row"><div class="detalle-label">Firma paciente</div><img src="' + s.firmaPaciente + '" alt="Firma" class="firma-preview"></div>';
        }
        if (s.firmaFuncionario) {
            html += '<div class="detalle-row"><div class="detalle-label">Firma funcionario</div><img src="' + s.firmaFuncionario + '" alt="Firma" class="firma-preview"></div>';
        }

        body.innerHTML = html;
        modal.classList.add('activo');
    }

    function cerrarModal() {
        document.getElementById('modalOverlay').classList.remove('activo');
    }

    function init() {
        var solicitudes = getSolicitudes();

        document.getElementById('filtroEstado').addEventListener('change', function () {
            renderSolicitudes(getSolicitudes());
        });

        document.getElementById('busqueda').addEventListener('input', function () {
            renderSolicitudes(getSolicitudes());
        });

        document.getElementById('solicitudesList').addEventListener('click', function (e) {
            var card = e.target.closest('.solicitud-card');
            if (card && card.dataset.id) {
                abrirDetalle(card.dataset.id);
            }
        });

        document.getElementById('modalClose').addEventListener('click', cerrarModal);
        document.getElementById('modalOverlay').addEventListener('click', function (e) {
            if (e.target === this) cerrarModal();
        });

        document.getElementById('btnGuardarEstado').addEventListener('click', function () {
            var titulo = document.getElementById('modalTitulo');
            var id = titulo ? titulo.textContent.replace('Solicitud ', '').trim() : null;
            if (!id) return;

            var solicitudes = getSolicitudes();
            var s = solicitudes.find(function (x) { return x.id === id; });
            if (!s) return;

            var estadoSelect = document.getElementById('cambiarEstado');
            s.estado = estadoSelect.value;
            saveSolicitudes(solicitudes);
            renderSolicitudes(solicitudes);
            actualizarStats(solicitudes);
            cerrarModal();
        });

        renderSolicitudes(solicitudes);
        actualizarStats(solicitudes);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
