const db = new PouchDB('tareas');

const inputName = document.getElementById('nombre');
const inputfecha = document.getElementById('fecha');
const btnAdd = document.getElementById('btnAdd');
const listaTareas = document.getElementById('lista-tareas');
const tabs = document.querySelectorAll('.tab');

let vistaActual = 'pendientes';

// Configurar fecha mínima como hoy
inputfecha.min = new Date().toISOString().split('T')[0];

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
        
        // Filtrar según la vista actual
        const tareasFiltradas = tareas.filter(tarea => 
            vistaActual === 'pendientes' ? tarea.status === 'pendiente' : tarea.status === 'completada'
        );

        // Ordenar por fecha de creación (más recientes primero)
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

// Cargar tareas al iniciar
document.addEventListener('DOMContentLoaded', mostrarTareas);
