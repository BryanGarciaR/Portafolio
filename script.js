/* ==========================================================
   CONFIGURACIÓN DE FIREBASE Y CLOUDINARY
   ========================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyDx_gaDRKRWcXbykR0w9K6T-XdvQ6mumIk",
    authDomain: "bryangr-dev.firebaseapp.com",
    projectId: "bryangr-dev",
    storageBucket: "bryangr-dev.firebasestorage.app",
    messagingSenderId: "505846189271",
    appId: "505846189271:web:dafffb1c5d6a3b33a7b492"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// URL corregida de Cloudinary para el navegador
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/n4ni5wxl/upload";
const CLOUDINARY_PRESET = "portafolio_preset";

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
            console.error("Detalle Cloudinary:", data);
            throw new Error('Error al subir la imagen a Cloudinary');
        }
    } catch (error) {
        console.error("Cloudinary Error:", error);
        alert('Hubo un error al subir el archivo multimedia a Cloudinary.');
        return null;
    }
}

/* ==========================================================
   GESTIÓN DE AVATAR (Cloudinary + Firebase)
   ========================================================== */
async function updateAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!isAdmin) {
        alert('Debes iniciar sesión como Administrador para cambiar el avatar (Haz clic en alguna sección para iniciar sesión).');
        verificarAdmin();
        return;
    }

    alert('Subiendo avatar a la nube...');
    const url = await subirACloudinary(file);
    
    if (url) {
        aplicarImagenAvatar(url);
        try {
            await db.collection('portfolio').doc('config').set({ avatar: url }, { merge: true });
            alert('¡Avatar actualizado y guardado en Firebase con éxito!');
        } catch (err) {
            console.error("Error crítico al guardar avatar en Firestore:", err);
            alert('Error al guardar la URL en Firebase.');
        }
    }
}

function aplicarImagenAvatar(src) {
    const wrapper = document.getElementById('avatar-display-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `<img src="${src}" alt="Avatar" class="avatar-img" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
}

/* ==========================================================
   EDICIÓN RÁPIDA DE SECCIONES (Modo Admin)
   ========================================================== */
// ==========================================
// EDICIÓN RÁPIDA DE SECCIONES (Modo Admin)
// ==========================================
function toggleEdit(sectionKey) {
    if (!isAdmin) {
        verificarAdmin();
        return;
    }

    const editBox = document.getElementById(`edit-box-${sectionKey}`);
    if (!editBox) return;

    editBox.classList.toggle('active');

    // Precargar datos actuales si se abre el cuadro
    if (editBox.classList.contains('active')) {
        if (sectionKey === 'profile') {
            const disp = document.getElementById('disp-profile');
            const input = document.getElementById('input-profile');
            if (disp && input) input.value = disp.innerText.trim();
        } else if (sectionKey === 'events') {
            const disp = document.getElementById('disp-events-intro');
            const input = document.getElementById('input-events');
            if (disp && input) input.value = disp.innerText.trim();
        }
        // Nota: 'skills' y 'certs' se cargan automáticamente desde cargarDatosRemotos()
    }
}

async function saveEdit(sectionKey) {
    if (!isAdmin) return;

    try {
        let payload = {};

        if (sectionKey === 'profile') {
            payload.profile = document.getElementById('input-profile').value;
        } else if (sectionKey === 'skills') {
            payload.skills = document.getElementById('input-skills').value;
        } else if (sectionKey === 'events') {
            payload.events = document.getElementById('input-events').value;
        } else if (sectionKey === 'certs') {
            // Convierte las líneas del textarea en un arreglo estructurado para la tabla
            const rawText = document.getElementById('input-certs').value;
            const lines = rawText.split('\n');
            const certsArray = lines.map(line => {
                const parts = line.split('|').map(p => p.trim());
                return {
                    curso: parts[0] || "",
                    institucion: parts[1] || "",
                    fecha: parts[2] || ""
                };
            }).filter(c => c.curso !== "");
            
            payload.certs = certsArray;
        } else if (sectionKey === 'contact') {
            payload.contact = {
                srv1: {
                    title: document.getElementById('input-srv1-title').value,
                    desc: document.getElementById('input-srv1-desc').value
                },
                srv2: {
                    title: document.getElementById('input-srv2-title').value,
                    desc: document.getElementById('input-srv2-desc').value
                },
                phone: document.getElementById('input-phone').value,
                wsp: document.getElementById('input-wsp').value,
                fb: document.getElementById('input-fb').value,
                tk: document.getElementById('input-tk').value
            };
        }

        await db.collection('portfolio').doc('config').set(payload, { merge: true });
        alert('¡Cambios guardados con éxito en Firebase!');
        toggleEdit(sectionKey);
        cargarDatosRemotos();
    } catch (error) {
        console.error("Error al guardar cambios:", error);
        alert('Hubo un error al guardar los cambios.');
    }
}

// ==========================================
// 1. CARGAR DATOS REMOTOS DESDE FIRESTORE
// ==========================================
function cargarDatosRemotos() {
    db.collection('portfolio').doc('config').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // Avatar y Perfil
            if (data.avatar && typeof aplicarImagenAvatar === 'function') aplicarImagenAvatar(data.avatar);
            if (data.profile) {
                const el = document.getElementById('disp-profile');
                if (el) el.innerText = data.profile;
                const inputProfile = document.getElementById('input-profile');
                if (inputProfile) inputProfile.value = data.profile;
            }

            // Eventos / Intro
            if (data.events) {
                const el = document.getElementById('disp-events-intro');
                if (el) el.innerHTML = data.events;
                const inputEvents = document.getElementById('input-events');
                if (inputEvents) inputEvents.value = data.events;
            }

            // Certificaciones (Renderizado dinámico de la tabla)
            if (data.certs && Array.isArray(data.certs)) {
                const tbody = document.getElementById('disp-certs');
                if (tbody) {
                    tbody.innerHTML = "";
                    data.certs.forEach(cert => {
                        tbody.innerHTML += `<tr><td><strong>${cert.curso}</strong></td><td>${cert.institucion}</td><td>${cert.fecha}</td></tr>`;
                    });
                }
                // Texto plano para el textarea de edición
                const inputCerts = document.getElementById('input-certs');
                if (inputCerts) {
                    inputCerts.value = data.certs.map(c => `${c.curso} | ${c.institucion} | ${c.fecha}`).join('\n');
                }
            }

            // Contacto y Redes Sociales
            if (data.contact) {
                if (data.contact.srv1) {
                    document.getElementById('disp-srv1-title').innerHTML = `<i class="fa-solid fa-screwdriver-wrench"></i> ${data.contact.srv1.title}`;
                    document.getElementById('disp-srv1-desc').innerText = data.contact.srv1.desc;
                    document.getElementById('input-srv1-title').value = data.contact.srv1.title;
                    document.getElementById('input-srv1-desc').value = data.contact.srv1.desc;
                }
                if (data.contact.srv2) {
                    document.getElementById('disp-srv2-title').innerHTML = `<i class="fa-solid fa-microchip"></i> ${data.contact.srv2.title}`;
                    document.getElementById('disp-srv2-desc').innerText = data.contact.srv2.desc;
                    document.getElementById('input-srv2-title').value = data.contact.srv2.title;
                    document.getElementById('input-srv2-desc').value = data.contact.srv2.desc;
                }
                if (data.contact.phone) {
                    document.getElementById('disp-phone').innerText = data.contact.phone;
                    document.getElementById('input-phone').value = data.contact.phone;
                }
                if (data.contact.wsp) {
                    document.getElementById('disp-wsp-link').href = data.contact.wsp;
                    document.getElementById('input-wsp').value = data.contact.wsp;
                }
                if (data.contact.fb) {
                    document.getElementById('disp-fb-link').href = data.contact.fb;
                    document.getElementById('input-fb').value = data.contact.fb;
                }
                if (data.contact.tk) {
                    document.getElementById('disp-tk-link').href = data.contact.tk;
                    document.getElementById('input-tk').value = data.contact.tk;
                }
            }
        }
    }).catch((error) => {
        console.warn("Aviso: No se pudo conectar a Firestore, operando con valores por defecto locales.", error);
    });
}
// ==========================================
// 2. GUARDAR CAMBIOS DE EDICIÓN (SAVE EDIT)
// ==========================================
function saveEdit(section) {
    let payload = {};

    if (section === 'profile') {
        const val = document.getElementById('input-profile').value;
        payload = { profile: val };
    } 
    else if (section === 'events') {
        const val = document.getElementById('input-events').value;
        payload = { events: val };
    }
    else if (section === 'certs') {
        // Convierte las líneas del textarea en un arreglo de objetos JSON estructurados para la tabla
        const rawText = document.getElementById('input-certs').value;
        const lines = rawText.split('\n');
        const certsArray = lines.map(line => {
            const parts = line.split('|').map(p => p.trim());
            return {
                curso: parts[0] || "",
                institucion: parts[1] || "",
                fecha: parts[2] || ""
            };
        }).filter(c => c.curso !== "");
        
        payload = { certs: certsArray };
    }
    else if (section === 'contact') {
        payload = {
            contact: {
                srv1: {
                    title: document.getElementById('input-srv1-title').value,
                    desc: document.getElementById('input-srv1-desc').value
                },
                srv2: {
                    title: document.getElementById('input-srv2-title').value,
                    desc: document.getElementById('input-srv2-desc').value
                },
                phone: document.getElementById('input-phone').value,
                wsp: document.getElementById('input-wsp').value,
                fb: document.getElementById('input-fb').value,
                tk: document.getElementById('input-tk').value
            }
        };
    }

    // Enviar a Firestore utilizando merge para no sobrescribir los demás campos
    db.collection('portfolio').doc('config').set(payload, { merge: true })
      .then(() => {
          alert("¡Cambios guardados correctamente en la base de datos!");
          toggleEdit(section);
          cargarDatosRemotos(); // Refrescar vista
      })
      .catch((error) => {
          console.error("Error al guardar en Firestore: ", error);
          alert("Hubo un error al guardar los cambios.");
      });
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
            alert('¡Proyecto guardado con éxito en Firebase!');
            projectForm.reset();
            cargarProyectosFirestore();
        } catch (error) {
            console.error("Error al guardar proyecto:", error);
            alert('Hubo un error al registrar el proyecto.');
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
                <div class="project-card">
                    ${p.img ? `<div class="project-img-container"><img src="${p.img}" alt="${p.title}" class="project-img"></div>` : ''}
                    <div class="project-content">
                        <h3>${p.title}</h3>
                        <p>${p.desc}</p>
                        ${p.link ? `<a href="${p.link}" target="_blank" style="color: var(--accent); text-decoration: underline; font-size: 0.85rem; display:inline-block; margin-bottom:10px;">Ver Enlace</a>` : ''}
                        ${isAdmin ? `<button onclick="deleteProject('${id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; display: block; width: 100%;">Eliminar</button>` : ''}
                    </div>
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
            alert('¡Elemento guardado con éxito en Firebase!');
            hobbyForm.reset();
            cargarHobbiesFirestore();
        } catch (error) {
            console.error("Error al guardar hobby:", error);
            alert('Hubo un error al registrar el hobby.');
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
                <div class="carousel-item">
                    <span style="font-size: 0.75rem; background: var(--accent); color: #0f172a; padding: 2px 6px; border-radius: 4px; font-weight: bold; display:inline-block; margin-bottom:5px;">${h.category}</span>
                    <h3 style="margin: 0.5rem 0; color: #fff; font-size: 1rem;">${h.title}</h3>
                    ${h.media ? (h.type === 'video' ? 
                        `<video src="${h.media}" controls style="width:100%; height:120px; object-fit:cover; border-radius:6px; margin-bottom:8px;"></video>` : 
                        `<img src="${h.media}" alt="${h.title}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; margin-bottom:8px;">`
                    ) : ''}
                    <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-muted);">${h.desc}</p>
                    ${isAdmin ? `<button onclick="deleteHobby('${id}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 8px; font-size: 0.8rem; width:100%;">Eliminar</button>` : ''}
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
