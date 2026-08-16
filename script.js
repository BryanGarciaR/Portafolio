/* ==========================================================
   CONFIGURACIÓN DE FIREBASE Y CLOUDINARY
   ========================================================== */
// Reemplaza con tus credenciales reales de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "BryanGR-dev", // Tu proyecto actual en Firebase
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase (Requiere SDKs de Firebase en el HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Configuración de Cloudinary
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/TU_CLOUD_NAME/upload"; // Reemplaza TU_CLOUD_NAME
const CLOUDINARY_PRESET = "TU_UPLOAD_PRESET"; // Reemplaza con tu Upload Preset de Cloudinary

let isAdmin = sessionStorage.getItem('portfolio_admin') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    aplicarModoAdminVisual();
    cargarDatosRemotos();
    cargarProyectosFirestore();
    cargarHobbiesFirestore();
});

/* ==========================================================
   AUTENTICACIÓN DE ADMINISTRADOR
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
    const editBtns = document.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
        btn.style.display = isAdmin ? 'inline-block' : 'none';
    });
}

/* ==========================================================
   NAVEGACIÓN ENTRE VISTAS
   ========================================================== */
function switchView(viewId, btn) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
    if (btn) btn.classList.add('active');
}

/* ==========================================================
   SUBIR ARCHIVOS A CLOUDINARY
   ========================================================== */
async function subirACloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error('Error al subir la imagen a Cloudinary');
        }
    } catch (error) {
        console.error("Cloudinary Error:", error);
        alert('Hubo un error al subir el archivo multimedia.');
        return null;
    }
}

/* ==========================================================
   GESTIÓN DE AVATAR (Cloudinary + Firebase)
   ========================================================== */
async function updateAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        alert('Subiendo avatar a la nube...');
        const url = await subirACloudinary(file);
        if (url) {
            aplicarImagenAvatar(url);
            await db.collection('portfolio').doc('config').set({ avatar: url }, { merge: true });
            alert('¡Avatar actualizado en la nube!');
        }
    }
}

function aplicarImagenAvatar(src) {
    const wrapper = document.getElementById('avatar-display-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `<img src="${src}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50%;">`;
    }
}

/* ==========================================================
   PROYECTOS PERSONALES (Firestore + Cloudinary)
   ========================================================== */
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isAdmin) { alert('No tienes permisos de administrador'); return; }

        const title = document.getElementById('proj-title').value;
        const desc = document.getElementById('proj-desc').value;
        const link = document.getElementById('proj-link').value;
        const imgInput = document.getElementById('proj-img');

        let imgUrl = '';
        if (imgInput && imgInput.files && imgInput.files[0]) {
            alert('Subiendo imagen del proyecto...');
            imgUrl = await subirACloudinary(imgInput.files[0]);
        }

        try {
            await db.collection('projects').add({
                title,
                desc,
                link,
                img: imgUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('¡Proyecto guardado en Firebase!');
            projectForm.reset();
            cargarProyectosFirestore();
        } catch (error) {
            console.error("Error al guardar proyecto:", error);
        }
    });
}

function cargarProyectosFirestore() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    db.collection('projects').orderBy('createdAt', 'desc').get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            container.innerHTML = '<p style="color: #94a3b8; padding: 1rem; grid-column: 1/-1;">No hay proyectos publicados aún.</p>';
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const id = doc.id;
            container.innerHTML += `
                <div class="project-card" style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; padding: 1rem; margin-bottom: 1rem;">
                    ${p.img ? `<img src="${p.img}" alt="${p.title}" style="width:100%; height:160px; object-fit:cover; border-radius:6px; margin-bottom: 0.75rem;">` : ''}
                    <h3 style="color: #38bdf8; margin-bottom: 0.5rem;">${p.title}</h3>
                    <p style="font-size: 0.9rem; margin-bottom: 0.75rem; color: #cbd5e1;">${p.desc}</p>
                    ${p.link ? `<a href="${p.link}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-size: 0.85rem; display:inline-block; margin-bottom:0.5rem;">Ver Enlace</a>` : ''}
                    ${isAdmin ? `<button onclick="deleteProject('${id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; display: block; margin-top: 5px;">Eliminar</button>` : ''}
                </div>
            `;
        });
    });
}

function deleteProject(id) {
    if (!isAdmin) return;
    if (confirm('¿Estás seguro de eliminar este proyecto de la nube?')) {
        db.collection('projects').doc(id).delete().then(() => {
            alert('Proyecto eliminado');
            cargarProyectosFirestore();
        });
    }
}

/* ==========================================================
   HOBBIES Y CARRUSEL (Firestore + Cloudinary)
   ========================================================== */
const hobbyForm = document.getElementById('hobby-form');
if (hobbyForm) {
    hobbyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isAdmin) { alert('No tienes permisos de administrador'); return; }

        const category = document.getElementById('hobby-category').value;
        const title = document.getElementById('hobby-title').value;
        const desc = document.getElementById('hobby-desc').value;
        const mediaInput = document.getElementById('hobby-media');

        let mediaUrl = '';
        let type = 'image';

        if (mediaInput && mediaInput.files && mediaInput.files[0]) {
            const file = mediaInput.files[0];
            type = file.type.startsWith('video') ? 'video' : 'image';
            alert('Subiendo multimedia a Cloudinary...');
            mediaUrl = await subirACloudinary(file);
        }

        try {
            await db.collection('hobbies').add({
                category,
                title,
                desc,
                media: mediaUrl,
                type,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('¡Elemento guardado en Firebase!');
            hobbyForm.reset();
            cargarHobbiesFirestore();
        } catch (error) {
            console.error("Error al guardar hobby:", error);
        }
    });
}

function cargarHobbiesFirestore() {
    const container = document.getElementById('carousel-container');
    if (!container) return;

    db.collection('hobbies').orderBy('createdAt', 'desc').get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            container.innerHTML = '<p style="color: #94a3b8; padding: 1rem;">No hay elementos en el carrusel.</p>';
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const h = doc.data();
            const id = doc.id;
            container.innerHTML += `
                <div class="carousel-item" style="min-width: 280px; background: rgba(30, 41, 59, 0.8); border-radius: 8px; padding: 1rem; border: 1px solid rgba(255,255,255,0.05); position: relative; margin-bottom: 1rem;">
                    <span style="font-size: 0.75rem; background: #38bdf8; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-weight: bold; display:inline-block; margin-bottom:5px;">${h.category}</span>
                    <h3 style="margin: 0.5rem 0; color: #fff;">${h.title}</h3>
                    ${h.media ? (h.type === 'video' ? 
                        `<video src="${h.media}" controls style="width:100%; height:140px; object-fit:cover; border-radius:6px; margin-bottom:8px;"></video>` : 
                        `<img src="${h.media}" alt="${h.title}" style="width:100%; height:140px; object-fit:cover; border-radius:6px; margin-bottom:8px;">`
                    ) : ''}
                    <p style="font-size: 0.85rem; margin-top: 0.5rem; color: #cbd5e1;">${h.desc}</p>
                    ${isAdmin ? `<button onclick="deleteHobby('${id}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 8px; font-size: 0.8rem;">Eliminar</button>` : ''}
                </div>
            `;
        });
    });
}

function deleteHobby(id) {
    if (!isAdmin) return;
    if (confirm('¿Estás seguro de eliminar este elemento?')) {
        db.collection('hobbies').doc(id).delete().then(() => {
            alert('Elemento eliminado');
            cargarHobbiesFirestore();
        });
    }
}

/* ==========================================================
   CARGA DE CONFIGURACIÓN GLOBAL (Avatar y otros datos)
   ========================================================== */
function cargarDatosRemotos() {
    db.collection('portfolio').doc('config').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.avatar) {
                aplicarImagenAvatar(data.avatar);
            }
        }
    }).catch((error) => {
        console.error("Error al cargar configuración:", error);
    });
}
