const db = new PouchDB('tareas');

const inputName = document.getElementById('nombre');
const inputfecha = document.getElementById('fecha');
const btnAdd = document.getElementById('btnAdd');
const listaTareas = document.getElementById('lista-tareas');
const tabs = document.querySelectorAll('.tab');

let vistaActual = 'pendientes';
let deferredPrompt; // Variable para el evento de instalación

inputfecha.min = new Date().toISOString().split('T')[0];

// ===== CÓDIGO DE INSTALACIÓN PWA =====
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA puede ser instalada');
    
    // Prevenir que el navegador muestre el prompt automático
    e.preventDefault();
    
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    
    // Mostrar botón de instalación
    mostrarBotonInstalar();
});

function mostrarBotonInstalar() {
    // Crear botón de instalación si no existe
    if (!document.getElementById('btnInstalar')) {
        const botonInstalar = document.createElement('button');
        botonInstalar.id = 'btnInstalar';
        botonInstalar.innerHTML = '📱 Instalar App';
        botonInstalar.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
            z-index: 1000;
            transition: all 0.3s;
        `;
        
        botonInstalar.addEventListener('click', instalarPWA);
        document.body.appendChild(botonInstalar);
    }
}

async function instalarPWA() {
    if (!deferredPrompt) {
        alert('La aplicación ya está instalada o no puede ser instalada en este momento.');
        return;
    }
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`Usuario ${outcome} la instalación`);
    
    if (outcome === 'accepted') {
        // Ocultar el botón después de la instalación
        const boton = document.getElementById('btnInstalar');
        if (boton) boton.style.display = 'none';
    }
    
    // Limpiar la referencia
    deferredPrompt = null;
}

// Ocultar el botón si ya está instalado
window.addEventListener('appinstalled', () => {
    console.log('PWA instalada correctamente');
    const boton = document.getElementById('btnInstalar');
    if (boton) boton.style.display = 'none';
    deferredPrompt = null;
});

// ===== FUNCIONALIDAD EXISTENTE DE TAREAS =====
btnAdd.addEventListener('click', (event) => {
    if (!inputName.value.trim()) {
        alert('Por favor ingresa un nombre para la tarea');
        return;
    }

    const tarea = {
        _id: new Date().toISOString(),
        nombre: inputName.value.trim(),
        fecha: inputfecha.value,
        status: 'pendiente', // pendiente | completada
        fechaCreacion: new Date().toISOString()
    };

    db.put(tarea)
    .then((result) => {
        console.log('Tarea agregada con éxito', result);
        inputName.value = '';
        inputfecha.value = '';
        mostrarTareas();
    }).catch((err) => {
        console.error('Error al agregar tarea:', err);
    });
});

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        vistaActual = tab.dataset.tab;
        mostrarTareas();
    });
});

function mostrarTareas() {
    db.allDocs({ include_docs: true })
    .then((result) => {
        const tareas = result.rows.map(row => row.doc);
        
        const tareasFiltradas = tareas.filter(tarea => 
            vistaActual === 'pendientes' ? tarea.status === 'pendiente' : tarea.status === 'completada'
        );

        tareasFiltradas.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

        listaTareas.innerHTML = '';

        if (tareasFiltradas.length === 0) {
            listaTareas.innerHTML = `
                <div class="empty-state">
                    <h3>${vistaActual === 'pendientes' ? ' ¡No hay tareas pendientes!' : ' No hay tareas completadas'}</h3>
                    <p>${vistaActual === 'pendientes' ? 'Agrega una nueva tarea para comenzar' : 'Las tareas completadas aparecerán aquí'}</p>
                </div>
            `;
            return;
        }

        tareasFiltradas.forEach(tarea => {
            const tareaElement = document.createElement('div');
            tareaElement.className = `tarea-item ${tarea.status === 'completada' ? 'completada' : ''}`;
            
            const fechaFormateada = tarea.fecha ? 
                new Date(tarea.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
            
            tareaElement.innerHTML = `
                <div class="tarea-header">
                    <div class="tarea-nombre">${tarea.nombre}</div>
                </div>
                <div class="tarea-fecha"> ${fechaFormateada}</div>
                <div class="tarea-actions">
                    ${tarea.status === 'pendiente' ? 
                        `<button class="btn-completar" onclick="cambiarStatus('${tarea._id}', 'completada')">
                            ✅ Completar
                        </button>` : 
                        `<button class="btn-pendiente" onclick="cambiarStatus('${tarea._id}', 'pendiente')">
                            ↩️ Marcar como Pendiente
                        </button>`
                    }
                </div>
            `;
            
            listaTareas.appendChild(tareaElement);
        });
    })
    .catch((err) => {
        console.error('Error al cargar tareas:', err);
    });
}

function cambiarStatus(id, nuevoStatus) {
    db.get(id)
    .then((doc) => {
        doc.status = nuevoStatus;
        return db.put(doc);
    })
    .then(() => {
        console.log(`Tarea ${nuevoStatus === 'completada' ? 'completada' : 'marcada como pendiente'}`);
        mostrarTareas();
    })
    .catch((err) => {
        console.error('Error al cambiar status:', err);
    });
}

document.addEventListener('DOMContentLoaded', mostrarTareas);
