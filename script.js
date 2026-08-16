/* ==========================================================
   CONFIGURACIÓN Y VARIABLES GLOBALES
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
   GESTIÓN DE ADMINISTRADOR
   ========================================================== */
function verificarAdmin() {
    if (isAdmin) {
        if (confirm('¿Deseas cerrar sesión de Administrador?')) {
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
   NAVEGACIÓN ENTRE VISTAS
   ========================================================== */
function switchView(viewId, btnElement) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId)?.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement?.classList.add('active');
}

/* ==========================================================
   EDICIÓN EN LÍNEA (CORREGIDO Y UNIFICADO)
   ========================================================== */
function toggleEdit(sectionKey) {
    if (!isAdmin) { verificarAdmin(); return; }
    const editBox = document.getElementById(`edit-box-${sectionKey}`);
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
    if (!isAdmin) { alert('Acción no permitida'); return; }
    let savedData = JSON.parse(localStorage.getItem('portfolio_edits')) || {};

    const editBox = document.getElementById(`edit-box-${sectionKey}`);
    const inputElement = editBox ? editBox.querySelector('textarea') : null;

    if (!inputElement) {
        alert("Error técnico: No se encontró el área de edición.");
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

/* ==========================================================
   CARGA DE DATOS LOCALES
   ========================================================== */
function cargarDatosLocales() {
    const savedAvatar = localStorage.getItem('portfolio_avatar');
    if (savedAvatar) {
        const wrapper = document.getElementById('avatar-display-wrapper');
        if (wrapper) wrapper.innerHTML = `<img src="${savedAvatar}" class="avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }

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

/* ==========================================================
   SUBIDA DE IMÁGENES / PROYECTOS / HOBBIES (SE MANTIENE)
   ========================================================== */
async function subirImagenCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
    const data = await res.json();
    if (!data.secure_url) throw new Error("Error en Cloudinary");
    return data.secure_url;
}

function updateAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            localStorage.setItem('portfolio_avatar', e.target.result);
            document.getElementById('avatar-display-wrapper').innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        };
        reader.readAsDataURL(file);
    }
}

function renderProjectsFromStorage() {
    const container = document.getElementById('projects-container');
    if (!container || !window.onSnapshot) return;
    window.onSnapshot(window.collection(window.db, "projects"), (snapshot) => {
        container.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            container.innerHTML += `<div class="project-card"><h3>${p.title}</h3><p>${p.desc}</p></div>`;
        });
    });
}

function renderHobbiesFromStorage() {
    const container = document.getElementById('carousel-container');
    if (!container || !window.onSnapshot) return;
    window.onSnapshot(window.collection(window.db, "hobbies"), (snapshot) => {
        container.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const h = docSnap.data();
            container.innerHTML += `<div class="carousel-item"><h4>${h.title}</h4></div>`;
        });
    });
}

async function eliminar(col, id) {
    if (confirm('¿Eliminar?')) await window.deleteDoc(window.doc(window.db, col, id));
}
