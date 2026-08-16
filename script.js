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
        if (isAdmin) {
            el.style.setProperty('display', 'inline-block', 'important');
        } else {
            el.style.setProperty('display', 'none', 'important');
        }
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
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => view.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }
}

/* ==========================================================
   EDICIÓN EN LÍNEA (CORREGIDO)
   ========================================================== */
function toggleEdit(sectionKey) {
    if (!isAdmin) { verificarAdmin(); return; }
    const editBox = document.getElementById(`edit-box-${sectionKey}`);
    if (!editBox) return;

    const isActive = editBox.classList.contains('active');

    if (!isActive) {
        if (sectionKey === 'profile') {
            const disp = document.getElementById('disp-profile');
            const input = document.getElementById('input-profile');
            if (disp && input) input.value = disp.innerText.trim();
        } else if (sectionKey === 'skills') {
            const disp = document.getElementById('disp-skills');
            const input = document.getElementById('input-skills');
            if (disp && input) input.value = disp.innerHTML.trim();
        } else if (sectionKey === 'events') {
            const disp = document.getElementById('disp-events-intro');
            const input = document.getElementById('input-events');
            if (disp && input) input.value = disp.innerText.trim();
        } else if (sectionKey === 'certs') {
            const disp = document.getElementById('disp-certs');
            const input = document.getElementById('input-certs');
            if (disp && input) input.value = disp.innerText.trim();
        }
    }

    editBox.classList.toggle('active');
}

function saveEdit(sectionKey) {
    if (!isAdmin) { alert('Acción no permitida'); return; }
    let savedData = JSON.parse(localStorage.getItem('portfolio_edits')) || {};

    // Buscamos el cuadro de edición por su ID
    const editBox = document.getElementById(`edit-box-${sectionKey}`);
    
    // Buscamos el textarea DENTRO de ese editBox específico (más seguro)
    const inputElement = editBox ? editBox.querySelector('textarea') : null;

    if (!inputElement) {
        console.error("No se encontró el textarea en la sección: " + sectionKey);
        alert("Error técnico: No se encontró el campo de edición.");
        return;
    }

    const val = inputElement.value;

    if (sectionKey === 'profile') {
        const disp = document.getElementById('disp-profile');
        if (disp) disp.innerText = val;
        savedData['profile'] = val;
    } else if (sectionKey === 'skills') {
        const disp = document.getElementById('disp-skills-container');
        if (disp) disp.innerHTML = val;
        savedData['skills'] = val;
    } else if (sectionKey === 'events') {
        const disp = document.getElementById('disp-events-intro');
        if (disp) disp.innerText = val;
        savedData['events'] = val;
    } else if (sectionKey === 'certs') {
        const disp = document.getElementById('disp-certs');
        if (disp) disp.innerHTML = val;
        savedData['certs'] = val;
    }

    localStorage.setItem('portfolio_edits', JSON.stringify(savedData));
    toggleEdit(sectionKey);
}
/* ==========================================================
   SUBIDA DE IMÁGENES Y AVATAR
   ========================================================== */
async function subirImagenCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
    const data = await res.json();
    if (!data.secure_url) throw new Error("No se pudo obtener la URL de Cloudinary");
    return data.secure_url;
}

function triggerAvatarUpload() {
    if (!isAdmin) {
        alert("Debes ser administrador para cambiar la foto");
        return;
    }
    const fileInput = document.getElementById('avatar-file-input');
    if (fileInput) {
        fileInput.click();
    }
}

function updateAvatar(event) {
    if (!isAdmin) {
        alert("Debes ser administrador para cambiar la foto");
        return;
    }
    
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('portfolio_avatar', e.target.result);
            const wrapper = document.getElementById('avatar-display-wrapper');
            if (wrapper) {
                wrapper.innerHTML = `<img src="${e.target.result}" class="avatar-img" id="profile-avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
            alert('¡Foto de perfil actualizada!');
        };
        reader.readAsDataURL(file);
    }
}

/* ==========================================================
   PROYECTOS Y HOBBIES (FIREBASE / LOCAL)
   ========================================================== */
function renderProjectsFromStorage() {
    const container = document.getElementById('projects-container');
    if (!container || !window.onSnapshot) return;
    window.onSnapshot(window.collection(window.db, "projects"), (snapshot) => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #aaa; text-align: center;">No hay proyectos publicados.</p>';
            return;
        }
        snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            const id = docSnap.id;
            container.innerHTML += `
                <div class="project-card">
                    <div class="project-img-container"><img src="${p.img}" class="project-img"></div>
                    <div class="project-content">
                        <h3>${p.title}</h3>
                        <p>${p.desc}</p>
                        ${p.link ? `<a href="${p.link}" target="_blank" style="color: var(--accent); font-size: 0.9rem;">Ver enlace ↗</a>` : ''}
                        ${isAdmin ? `<br><button class="delete-card-btn" onclick="eliminar('projects', '${id}')">Eliminar Proyecto</button>` : ''}
                    </div>
                </div>`;
        });
    });
}

function renderHobbiesFromStorage() {
    const container = document.getElementById('carousel-container');
    if (!container || !window.onSnapshot) return;
    window.onSnapshot(window.collection(window.db, "hobbies"), (snapshot) => {
        container.innerHTML = '';
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: #aaa; font-size: 0.9rem;">No hay elementos.</p>';
            return;
        }
        snapshot.forEach((docSnap) => {
            const h = docSnap.data();
            const id = docSnap.id;
            const esVideo = h.media.includes('.mp4') || h.media.includes('.webm') || h.media.includes('/video/upload/');
            const multimediaHtml = esVideo 
                ? `<video src="${h.media}" controls style="width:100%; height:120px; object-fit:cover; border-radius: 6px; margin: 8px 0;"></video>`
                : `<img src="${h.media}" style="width:100%; height:120px; object-fit:cover; border-radius: 6px; margin: 8px 0;">`;

            container.innerHTML += `
                <div class="carousel-item">
                    <span style="font-size: 0.75rem; color: var(--accent); font-weight: bold;">[${h.cat}]</span>
                    <h4 style="color: #fff; margin: 5px 0; font-size: 1rem;">${h.title}</h4>
                    ${multimediaHtml}
                    <p style="font-size: 0.85rem; color: var(--text-muted);">${h.desc || ''}</p>
                    ${isAdmin ? `<button class="delete-card-btn" onclick="eliminar('hobbies', '${id}')">Eliminar</button>` : ''}
                </div>`;
        });
    });
}

async function eliminar(col, id) {
    if (confirm('¿Deseas eliminar este elemento?')) {
        try {
            await window.deleteDoc(window.doc(window.db, col, id));
            alert('Eliminado correctamente.');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}

/* ==========================================================
   CARGA DE DATOS LOCALES Y PERSISTENCIA (CORREGIDO)
   ========================================================== */
function cargarDatosLocales() {
    const savedAvatar = localStorage.getItem('portfolio_avatar');
    if (savedAvatar) {
        const wrapper = document.getElementById('avatar-display-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `<img src="${savedAvatar}" class="avatar-img" id="profile-avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
    }

    const savedData = JSON.parse(localStorage.getItem('portfolio_edits')) || {};
    
    if (savedData['profile']) {
        const disp = document.getElementById('disp-profile');
        if (disp) disp.innerText = savedData['profile'];
    }
    // Nueva gestión para skills como bloque completo
    if (savedData['skills']) {
        const disp = document.getElementById('disp-skills');
        if (disp) disp.innerHTML = savedData['skills'];
    }
    if (savedData['events']) {
        const disp = document.getElementById('disp-events-intro');
        if (disp) disp.innerText = savedData['events'];
    }
    if (savedData['certs']) {
        const disp = document.getElementById('disp-certs');
        if (disp) disp.innerText = savedData['certs'];
    }
}
