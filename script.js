// Variables globales 
let productos = [];
let usuario = {};
let carrito = [];            // array con los id de los productos añadidos
let categoriaActual = "Todo";

// Elementos del HTML
const contenedor = document.getElementById("productos");
const divCategorias = document.getElementById("categorias");
const buscador = document.getElementById("buscador");
const selectOrden = document.getElementById("orden");
const btnCesta = document.getElementById("btnCesta");
const contador = document.getElementById("contador");
const modal = document.getElementById("modal");
const listaCesta = document.getElementById("listaCesta");
const textoEnvio = document.getElementById("envio");
const textoTotal = document.getElementById("total");
const toast = document.getElementById("toast");

// Cargar carrito guardado (localStorage) 
if (localStorage.getItem("carrito")) {
    carrito = JSON.parse(localStorage.getItem("carrito"));
}
// Guardar carrito en localStorage
function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    contador.innerText = carrito.length;
}

// Cargar los JSON 
fetch("productos.json")
    .then(response => response.json())
    .then(datos => {
        productos = datos;
        crearBotonesCategorias();
        mostrarProductos();
        contador.innerText = carrito.length;
    });
// Cargar datos del usuario
fetch("userData.json")
    .then(response => response.json())
    .then(datos => {
        usuario = datos;
    });

// Botones de categorías 
function crearBotonesCategorias() {
    const categorias = ["Todo"];
    productos.forEach(producto => {
        if (!categorias.includes(producto.category)) {
            categorias.push(producto.category);
        }
    });

    categorias.forEach(categoria => {
        const boton = document.createElement("button");
        boton.innerText = categoria;
        if (categoria == categoriaActual) {
            boton.classList.add("activo");
        }
        boton.addEventListener("click", () => {
            categoriaActual = categoria;
            // Marcar solo el botón pulsado
            divCategorias.querySelectorAll("button").forEach(b => b.classList.remove("activo"));
            boton.classList.add("activo");
            mostrarProductos();
        });
        divCategorias.appendChild(boton);
    });
}

//  Escaparate 
function mostrarProductos() {
    contenedor.innerHTML = "";
    const texto = buscador.value.toLowerCase();

    // Filtrar: stock  0, categoría y texto del buscador
    let lista = productos.filter(producto => {
        const hayStock = producto.stock > 0;
        const categoriaOk = categoriaActual == "Todo" || producto.category == categoriaActual;
        const textoOk = producto.name.toLowerCase().includes(texto) ||
            producto.description.toLowerCase().includes(texto);
        return hayStock && categoriaOk && textoOk;
    });

    // Ordenar
    const orden = selectOrden.value;
    if (orden == "precioAsc") {
        lista.sort((a, b) => a.price - b.price);
    } else if (orden == "precioDesc") {
        lista.sort((a, b) => b.price - a.price);
    } else if (orden == "nombre") {
        lista.sort((a, b) => a.name.localeCompare(b.name));
    } else if (orden == "stock") {
        lista.sort((a, b) => b.stock - a.stock);
    }

    // Pintar las tarjetas
    lista.forEach(producto => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta");

        const imagen = document.createElement("img");
        imagen.src = producto.image;
        imagen.alt = producto.name;

        const nombre = document.createElement("h3");
        nombre.innerText = producto.name;

        const categoria = document.createElement("p");
        categoria.classList.add("categoria");
        categoria.innerText = producto.category;

        const descripcion = document.createElement("p");
        descripcion.innerText = producto.description;

        const precio = document.createElement("p");
        precio.classList.add("precio");
        precio.innerText = producto.price.toFixed(2) + "€";

        const stock = document.createElement("p");
        stock.innerText = "Stock: " + producto.stock;

        const boton = document.createElement("button");
        boton.innerText = "Añadir a la cesta";
        boton.addEventListener("click", () => anadirACesta(producto.id));

        tarjeta.appendChild(imagen);
        tarjeta.appendChild(nombre);
        tarjeta.appendChild(categoria);
        tarjeta.appendChild(descripcion);
        tarjeta.appendChild(precio);
        tarjeta.appendChild(stock);
        tarjeta.appendChild(boton);
        contenedor.appendChild(tarjeta);
    });
}

buscador.addEventListener("input", mostrarProductos);
selectOrden.addEventListener("change", mostrarProductos);

// Carrito 
function buscarProducto(id) {
    return productos.find(producto => producto.id == id);
}

function cantidadEnCesta(id) {
    return carrito.filter(item => item == id).length;
}

function anadirACesta(id) {
    const producto = buscarProducto(id);
    if (cantidadEnCesta(id) >= producto.stock) {
        mostrarToast("No hay más stock de " + producto.name);
        return;
    }
    carrito.push(id);
    guardarCarrito();
    mostrarToast(producto.name + " añadido");
}

// Toast 
function mostrarToast(mensaje) {
    toast.innerText = mensaje;
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

// Modal de la cesta 
btnCesta.addEventListener("click", () => {
    modal.style.display = "flex";
    pintarCesta();
});

document.getElementById("btnCerrar").addEventListener("click", () => {
    modal.style.display = "none";
});

document.getElementById("btnFinalizar").addEventListener("click", () => {
    carrito = [];
    guardarCarrito();
    modal.style.display = "none";
    mostrarToast("Compra finalizada. ¡Gracias!");
});

function pintarCesta() {
    listaCesta.innerHTML = "";
    textoEnvio.innerText = "Enviando pedido a: " + usuario.name + ", " + usuario.address;

    // Ids distintos que hay en el carrito
    const idsUnicos = [];
    carrito.forEach(id => {
        if (!idsUnicos.includes(id)) {
            idsUnicos.push(id);
        }
    });

    let total = 0;

    if (idsUnicos.length == 0) {
        listaCesta.innerText = "La cesta está vacía.";
    }

    idsUnicos.forEach(id => {
        const producto = buscarProducto(id);
        const cantidad = cantidadEnCesta(id);
        total += producto.price * cantidad;

        const linea = document.createElement("div");
        linea.classList.add("lineaCesta");

        const nombre = document.createElement("span");
        nombre.innerText = producto.name + " (" + producto.price.toFixed(2) + " €)";

        const btnMenos = document.createElement("button");
        btnMenos.innerText = "-";
        btnMenos.addEventListener("click", () => {
            // quitar una unidad
            const posicion = carrito.indexOf(id);
            carrito.splice(posicion, 1);
            guardarCarrito();
            pintarCesta();
        });

        const textoCantidad = document.createElement("span");
        textoCantidad.innerText = cantidad;

        const btnMas = document.createElement("button");
        btnMas.innerText = "+";
        btnMas.addEventListener("click", () => {
            if (cantidad >= producto.stock) {
                mostrarToast("No hay más stock de " + producto.name);
                return;
            }
            carrito.push(id);
            guardarCarrito();
            pintarCesta();
        });

        const btnEliminar = document.createElement("button");
        btnEliminar.innerText = "Eliminar";
        btnEliminar.classList.add("btnEliminar");
        btnEliminar.addEventListener("click", () => {
            carrito = carrito.filter(item => item != id);
            guardarCarrito();
            pintarCesta();
        });

        linea.appendChild(nombre);
        linea.appendChild(btnMenos);
        linea.appendChild(textoCantidad);
        linea.appendChild(btnMas);
        linea.appendChild(btnEliminar);
        listaCesta.appendChild(linea);
    });

    textoTotal.innerText = "Total: " + total.toFixed(2) + " €";
}
