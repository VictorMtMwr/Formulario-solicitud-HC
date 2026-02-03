/**
 * Panel de administración - Gestión de solicitudes HC (datos desde API/BD)
 */
(function () {
    'use strict';

    var solicitudesCache = [];

    function getSolicitudesFromApi() {
        return fetch('/api/solicitudes', { credentials: 'include' })
            .then(function (res) {
                if (res.status === 401) {
                    window.location.href = '/admin-login.html';
                    return { success: false, error: 'Redirigiendo a login...' };
                }
                if (!res.ok) {
                    return res.json().then(function (d) {
                        return { success: false, error: d.message || d.error || 'Error del servidor' };
                    }).catch(function () {
                        return { success: false, error: 'Servidor no disponible' };
                    });
                }
                return res.json().then(function (data) {
                    if (Array.isArray(data)) {
                        return { success: true, data: data };
                    }
                    return { success: false, error: 'Respuesta inválida' };
                });
            })
            .catch(function () {
                return { success: false, error: 'No se pudo conectar. Abre la aplicación desde http://localhost:' + (window.location.port || '3000') + ' y ejecuta "npm start" en la carpeta del proyecto.' };
            });
    }

    function mostrarErrorConexion(mensaje) {
        var list = document.getElementById('solicitudesList');
        if (!list) return;
        list.innerHTML = '';
        var url = (window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.port === '3000'
            ? window.location.origin
            : 'http://localhost:3000';
        var box = document.createElement('div');
        box.className = 'empty-state error-conexion';
        box.innerHTML = '<p><strong>No se pudo cargar la lista de solicitudes.</strong></p><p>' + mensaje + '</p><p>Abre el formulario y el panel desde <a href="' + url + '" target="_blank">' + url + '</a> con el servidor iniciado (<code>npm start</code> en la carpeta del proyecto).</p>';
        list.appendChild(box);
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
        if (!list) return;
        solicitudes = solicitudes || solicitudesCache;

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
            list.innerHTML = '';
            var emptyEl = document.getElementById('emptyState');
            if (!emptyEl) {
                emptyEl = document.createElement('p');
                emptyEl.className = 'empty-state';
                emptyEl.id = 'emptyState';
            }
            emptyEl.style.display = 'block';
            emptyEl.textContent = filtroEstado || busqueda
                ? 'No hay solicitudes que coincidan con los filtros.'
                : 'No hay solicitudes registradas.';
            list.appendChild(emptyEl);
            return;
        }

        var emptyHide = document.getElementById('emptyState');
        if (emptyHide) emptyHide.style.display = 'none';
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
        var s = solicitudesCache.find(function (x) { return x.id === id; });
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
        
        if (s.cedulaPaciente) {
            var linkPaciente = s.cedulaPaciente.startsWith('/uploads/') 
                ? '<a href="#" class="pdf-link ver-pdf" data-pdf="' + s.cedulaPaciente + '" data-titulo="Cédula del Paciente">📄 Ver PDF cédula paciente</a>'
                : s.cedulaPaciente;
            html += '<div class="detalle-row"><div class="detalle-label">Cédula paciente</div><div class="detalle-value">' + linkPaciente + '</div></div>';
        }

        if (s.tipoSolicitud === 'tercero') {
            html += row('Nombre solicitante (tercero)', s.nombreSolicitante);
            
            if (s.cedulaTercero) {
                var linkTercero = s.cedulaTercero.startsWith('/uploads/') 
                    ? '<a href="#" class="pdf-link ver-pdf" data-pdf="' + s.cedulaTercero + '" data-titulo="Cédula del Tercero">📄 Ver PDF cédula tercero</a>'
                    : s.cedulaTercero;
                html += '<div class="detalle-row"><div class="detalle-label">Cédula tercero</div><div class="detalle-value">' + linkTercero + '</div></div>';
            }
        }

        if (s.firmaPaciente) {
            html += '<div class="detalle-row"><div class="detalle-label">Firma paciente</div><img src="' + s.firmaPaciente + '" alt="Firma" class="firma-preview"></div>';
        }
        
        // Mostrar firma del funcionario si existe (solo lectura)
        if (s.firmaFuncionario) {
            html += '<div class="detalle-row"><div class="detalle-label">Firma funcionario (registrada)</div><img src="' + s.firmaFuncionario + '" alt="Firma funcionario" class="firma-preview"></div>';
        }

        body.innerHTML = html;
        
        // Mostrar/ocultar sección de clínica y cargar valores
        var seccionClinica = document.getElementById('seccionClinica');
        if (s.tipoSolicitud === 'tercero') {
            seccionClinica.style.display = 'block';
            
            // Cargar valores existentes
            document.getElementById('adminTraeCarta').checked = (s.traeCarta === 'si');
            document.getElementById('adminTraeCopiaDocs').checked = (s.traeCopiaDocs === 'si');
            document.getElementById('adminNombreFuncionario').value = s.nombreFuncionario || '';
            document.getElementById('adminFechaEntrega').value = s.fechaEntrega ? s.fechaEntrega.split('T')[0] : '';
            
            // Inicializar canvas de firma
            inicializarFirmaAdmin();
        } else {
            seccionClinica.style.display = 'none';
        }
        
        modal.classList.add('activo');
    }
    
    // Variables para el canvas de firma del admin
    var firmaAdminCanvas = null;
    var firmaAdminCtx = null;
    var dibujandoAdmin = false;
    var lastXAdmin = 0, lastYAdmin = 0;
    
    function inicializarFirmaAdmin() {
        firmaAdminCanvas = document.getElementById('adminFirmaFuncionario');
        if (!firmaAdminCanvas) return;
        
        firmaAdminCtx = firmaAdminCanvas.getContext('2d');
        firmaAdminCtx.clearRect(0, 0, firmaAdminCanvas.width, firmaAdminCanvas.height);
        dibujandoAdmin = false;
        
        function getPosAdmin(e) {
            var r = firmaAdminCanvas.getBoundingClientRect();
            var sx = firmaAdminCanvas.width / r.width;
            var sy = firmaAdminCanvas.height / r.height;
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
        
        function startAdmin(e) {
            e.preventDefault();
            dibujandoAdmin = true;
            var p = getPosAdmin(e);
            lastXAdmin = p.x;
            lastYAdmin = p.y;
        }
        
        function moveAdmin(e) {
            e.preventDefault();
            if (!dibujandoAdmin) return;
            var p = getPosAdmin(e);
            firmaAdminCtx.strokeStyle = '#000';
            firmaAdminCtx.lineWidth = 2;
            firmaAdminCtx.lineCap = 'round';
            firmaAdminCtx.beginPath();
            firmaAdminCtx.moveTo(lastXAdmin, lastYAdmin);
            firmaAdminCtx.lineTo(p.x, p.y);
            firmaAdminCtx.stroke();
            lastXAdmin = p.x;
            lastYAdmin = p.y;
        }
        
        function endAdmin(e) {
            e.preventDefault();
            dibujandoAdmin = false;
        }
        
        // Remover listeners anteriores y agregar nuevos
        firmaAdminCanvas.onmousedown = startAdmin;
        firmaAdminCanvas.onmousemove = moveAdmin;
        firmaAdminCanvas.onmouseup = endAdmin;
        firmaAdminCanvas.onmouseleave = endAdmin;
        firmaAdminCanvas.ontouchstart = startAdmin;
        firmaAdminCanvas.ontouchmove = moveAdmin;
        firmaAdminCanvas.ontouchend = endAdmin;
    }
    
    function limpiarFirmaAdmin() {
        if (firmaAdminCanvas && firmaAdminCtx) {
            firmaAdminCtx.clearRect(0, 0, firmaAdminCanvas.width, firmaAdminCanvas.height);
        }
    }
    
    function obtenerFirmaAdminBase64() {
        if (!firmaAdminCanvas) return null;
        // Verificar si el canvas tiene contenido (no está vacío)
        var ctx = firmaAdminCanvas.getContext('2d');
        var pixelData = ctx.getImageData(0, 0, firmaAdminCanvas.width, firmaAdminCanvas.height).data;
        var hasContent = false;
        for (var i = 3; i < pixelData.length; i += 4) {
            if (pixelData[i] > 0) {
                hasContent = true;
                break;
            }
        }
        return hasContent ? firmaAdminCanvas.toDataURL('image/png') : null;
    }

    function cerrarModal() {
        document.getElementById('modalOverlay').classList.remove('activo');
    }
    
    // Funciones para modal de PDF
    function abrirModalPdf(pdfUrl, titulo) {
        var modal = document.getElementById('modalPdfOverlay');
        var iframe = document.getElementById('pdfViewer');
        var tituloEl = document.getElementById('modalPdfTitulo');
        var downloadLink = document.getElementById('pdfDownloadLink');
        
        tituloEl.textContent = titulo || 'Documento PDF';
        iframe.src = pdfUrl;
        downloadLink.href = pdfUrl;
        
        modal.classList.add('activo');
    }
    
    function cerrarModalPdf() {
        var modal = document.getElementById('modalPdfOverlay');
        var iframe = document.getElementById('pdfViewer');
        
        modal.classList.remove('activo');
        iframe.src = ''; // Limpiar el iframe
    }

    function init() {
        document.getElementById('filtroEstado').addEventListener('change', function () {
            renderSolicitudes(solicitudesCache);
        });

        document.getElementById('busqueda').addEventListener('input', function () {
            renderSolicitudes(solicitudesCache);
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
        
        document.getElementById('btnLogout').addEventListener('click', function () {
            fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                .then(function () { window.location.href = '/admin-login.html'; });
        });
        
        // Event listeners para modal de PDF
        document.getElementById('modalPdfClose').addEventListener('click', cerrarModalPdf);
        document.getElementById('modalPdfOverlay').addEventListener('click', function (e) {
            if (e.target === this) cerrarModalPdf();
        });
        
        // Delegación de eventos para enlaces de PDF dentro del modal de detalle
        document.getElementById('modalBody').addEventListener('click', function (e) {
            var link = e.target.closest('.ver-pdf');
            if (link) {
                e.preventDefault();
                var pdfUrl = link.dataset.pdf;
                var titulo = link.dataset.titulo;
                abrirModalPdf(pdfUrl, titulo);
            }
        });

        // Botón limpiar firma del funcionario
        document.getElementById('btnLimpiarFirmaAdmin').addEventListener('click', limpiarFirmaAdmin);
        
        // Botón guardar cambios (estado + datos de clínica)
        document.getElementById('btnGuardarEstado').addEventListener('click', function () {
            var titulo = document.getElementById('modalTitulo');
            var refId = titulo ? titulo.textContent.replace('Solicitud ', '').trim() : null;
            if (!refId) return;
            
            var s = solicitudesCache.find(function (x) { return x.id === refId; });
            var estadoSelect = document.getElementById('cambiarEstado');
            var nuevoEstado = estadoSelect.value;
            
            // Preparar datos para enviar
            var datosActualizar = { estado: nuevoEstado };
            
            // Si es por tercero, agregar campos de clínica
            if (s && s.tipoSolicitud === 'tercero') {
                datosActualizar.traeCarta = document.getElementById('adminTraeCarta').checked ? 'si' : '';
                datosActualizar.traeCopiaDocs = document.getElementById('adminTraeCopiaDocs').checked ? 'si' : '';
                datosActualizar.nombreFuncionario = document.getElementById('adminNombreFuncionario').value;
                datosActualizar.fechaEntrega = document.getElementById('adminFechaEntrega').value || null;
                
                // Obtener firma del funcionario si se dibujó algo nuevo
                var firmaBase64 = obtenerFirmaAdminBase64();
                if (firmaBase64) {
                    datosActualizar.firmaFuncionario = firmaBase64;
                }
            }

            fetch('/api/solicitudes/' + encodeURIComponent(refId), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosActualizar),
                credentials: 'include'
            })
                .then(function (res) {
                    if (res.status === 401) {
                        window.location.href = '/admin-login.html';
                        return { ok: false };
                    }
                    return res.json();
                })
                .then(function (result) {
                    if (result.ok) {
                        // Actualizar el caché con todos los datos nuevos
                        if (s) {
                            s.estado = nuevoEstado;
                            if (datosActualizar.traeCarta !== undefined) s.traeCarta = datosActualizar.traeCarta;
                            if (datosActualizar.traeCopiaDocs !== undefined) s.traeCopiaDocs = datosActualizar.traeCopiaDocs;
                            if (datosActualizar.nombreFuncionario !== undefined) s.nombreFuncionario = datosActualizar.nombreFuncionario;
                            if (datosActualizar.fechaEntrega !== undefined) s.fechaEntrega = datosActualizar.fechaEntrega;
                            if (datosActualizar.firmaFuncionario) s.firmaFuncionario = datosActualizar.firmaFuncionario;
                        }
                        renderSolicitudes(solicitudesCache);
                        actualizarStats(solicitudesCache);
                        cerrarModal();
                    } else {
                        alert(result.message || 'Error al actualizar');
                    }
                })
                .catch(function () {
                    alert('No se pudo conectar con el servidor.');
                });
        });

        getSolicitudesFromApi().then(function (result) {
            if (result.success) {
                solicitudesCache = result.data;
                renderSolicitudes(result.data);
                actualizarStats(result.data);
            } else {
                mostrarErrorConexion(result.error);
                document.getElementById('statPendientes').textContent = '0 pendientes';
                document.getElementById('statTotal').textContent = '0 total';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
