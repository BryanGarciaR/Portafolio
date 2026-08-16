/* ==========================================================
   CONFIGURACION Y VARIABLES GLOBALES
   ========================================================== */
let isAdmin = sessionStorage.getItem('portfolio_admin') === 'true';
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/n4ni5wxl/upload";
const UPLOAD_PRESET = "portafolio_preset";

document.addEventListener('DOMContentLoaded', () => {
    aplicarModoAdminVisual();
    cargarDatosLocales();
    renderProjectsFromStorage();
    renderHobbiesFromStorage();
});

/* ==========================================================
   GESTION DE ADMINISTRADOR
   ========================================================== */
function verificarAdmin() {
    if (isAdmin) {
        if (confirm('¿Deseas cerrar sesion de Administrador?')) {
            sessionStorage.removeItem('portfolio_admin');
            isAdmin = false;
            location.reload();
        }
        return;
    }
    const pass = prompt('Ingrese la contraseña de Administrador:');
    if (pass === 'bryan2026') {
        sessionStorage.setItem('portfolio_admin', 'true');
        isAdmin = true;
        location.reload();
    } else if (pass !== null) {
        alert('Contraseña incorrecta.');
    }
}

function aplicarModoAdminVisual() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.setProperty('display', isAdmin ? 'inline-block' : 'none', 'important');
    });

    const lockIcon = document.getElementById('admin-lock-icon');
    if (lockIcon) {
        lockIcon.className = isAdmin ? "fa-solid fa-unlock" : "fa-solid fa-lock";
        lockIcon.style.color = isAdmin ? "var(--accent)" : "var(--text-muted)";
    }
}

/* ==========================================================
   EDICION EN LINEA (CORREGIDO)
   ========================================================== */
function toggleEdit(sectionKey) {
    if (!isAdmin) { verificarAdmin(); return; }
    const editBox = document.getElementById('edit-box-' + sectionKey);
    if (!editBox) return;

    const isActive = editBox.classList.contains('active');

    if (!isActive) {
        const map = {
            'profile': { disp: 'disp-profile', input: 'input-profile', type: 'text' },
            'skills':  { disp: 'disp-skills-container', input: 'input-skills', type: 'html' },
            'events':  { disp: 'disp-events-intro', input: 'input-events', type: 'text' },
            'certs':   { disp: 'disp-certs', input: 'input-certs', type: 'html' }
        };
        
        const config = map[sectionKey];
        if (config) {
            const disp = document.getElementById(config.disp);
            const input = document.getElementById(config.input);
            if (disp && input) {
                input.value = (config.type === 'html') ? disp.innerHTML.trim() : disp.innerText.trim();
            }
        }
    }
    editBox.classList.toggle('active');
}

function saveEdit(sectionKey) {
    if (!isAdmin) { alert('Accion no permitida'); return; }
    let savedData = JSON.parse(localStorage.getItem('portfolio_edits')) || {};

    const editBox = document.getElementById('edit-box-' + sectionKey);
    const inputElement = editBox ? editBox.querySelector('textarea') : null;

    if (!inputElement) {
        alert("Error tecnico: No se encontro el area de edicion.");
        return;
    }

    const val = inputElement.value;
    const map = {
        'profile': { disp: 'disp-profile', type: 'text' },
        'skills':  { disp: 'disp-skills-container', type: 'html' },
        'events':  { disp: 'disp-events-intro', type: 'text' },
        'certs':   { disp: 'disp-certs', type: 'html' }
    };

    const config = map[sectionKey];
    if (config) {
        const disp = document.getElementById(config.disp);
        if (disp) {
            if (config.type === 'html') disp.innerHTML = val;
            else disp.innerText = val;
        }
        savedData[sectionKey] = val;
    }

    localStorage.setItem('portfolio_edits', JSON.stringify(savedData));
    toggleEdit(sectionKey);
}

function cargarDatosLocales() {
    const savedData = JSON.parse(localStorage.getItem('portfolio_edits')) || {};
    const targets = [
        { key: 'profile', id: 'disp-profile', type: 'text' },
        { key: 'skills',  id: 'disp-skills-container', type: 'html' },
        { key: 'events',  id: 'disp-events-intro', type: 'text' },
        { key: 'certs',   id: 'disp-certs', type: 'html' }
    ];

    targets.forEach(t => {
        if (savedData[t.key]) {
            const disp = document.getElementById(t.id);
            if (disp) {
                if (t.type === 'html') disp.innerHTML = savedData[t.key];
                else disp.innerText = savedData[t.key];
            }
        }
    });
}
