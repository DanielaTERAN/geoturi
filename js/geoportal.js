// ===== iniciar documento de javascript =====
$(document).ready(function () {

  // -- variables globales de capas
  capa_puntos_turismo = L.layerGroup();
  datos_capa_conservacion = null;

  // -- inicializar funciones --
  // mapa
  inicializar_mapa();
  // supabase
  iniciar_supabase();
  // longitud - latitud
  iniciar_localizacion();

});

// ===== funciones =====

// -- funcion para inicializar el mapa --
async function inicializar_mapa() {

  // seteo de coordenadas para ecuador
  map = L.map("map").setView([-1.8312, -78.1834], 7.2);

  // capa de atribución
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "",
  }).addTo(map);

  // deshabilitación de zoom mouse (opcional)
  //map.scrollWheelZoom.disable();

}

// -- Iniciar conexion a supabase --
async function iniciar_supabase() {

  // url supabase (cambiar por url propia)
  //supabase_url = "https://muuddcsdbiserorxfrab.supabase.co";
  supabase_url = "https://nytzdjxdmpmnzcrdmzit.supabase.co"
  // api key supabase (cambiar por api propia)
  //supabase_api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dWRkY3NkYmlzZXJvcnhmcmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDcxNDQsImV4cCI6MjA2ODM4MzE0NH0.vrbxerivramkM_CTF7QFIVxtEvmb6TB_Lgh3o0-QloE";
  supabase_api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dHpkanhkbXBtbnpjcmRteml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Mjc5MDgsImV4cCI6MjA2ODIwMzkwOH0.altu2BeaHT6dTQ60GeuGwkSwrShYEvouY1lPMWcVy0o"
  // conexion supabase
  supabase = window.supabase.createClient(supabase_url, supabase_api_key);

  // consultas iniciales de supabase
  obtener_filtros_geograficos();

  // consultas de capas
  iniciar_capas();

}

// -- Iniciar obtencion de longitud y latitud
async function iniciar_localizacion(){
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        
        $('#latitud_sitio').val(lat)
        
        $('#longitud_sitio').val(lon)
      }, function(error) {
        console.error("Error obteniendo la ubicación:", error.message);
      },{
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    } else {
      console.log("La geolocalización no es soportada por este navegador.");
    }
}

// -- Iniciar filtros geograficos turismo --
async function obtener_filtros_geograficos() {

  // - iniciar provincias
  let datos_provincias = await supabase.rpc("obtener_provincias");

  if (datos_provincias.error) console.error(datos_provincias.error);

  var cmb_provincias = new componente.cmb();
  cmb_provincias.ini("filtro_provincias");
  cmb_provincias.addCmbDataSupabase(datos_provincias.data);

  // - iniciar cantones
  let datos_cantones = await supabase.rpc("obtener_cantones", {
    nombre_provincia: "",
  });

  if (datos_cantones.error) console.error(datos_cantones.error);

  var cmb_cantones = new componente.cmb();
  cmb_cantones.ini("filtro_cantones");
  cmb_cantones.addCmbDataSupabase(datos_cantones.data);
  $("#filtro_cantones").prop("disabled", true);

  // - iniciar parroquias
  let datos_parroquias = await supabase.rpc("obtener_parroquias", {
    nombre_provincia: "",
    nombre_canton: "",
  });

  if (datos_parroquias.error) console.error(datos_parroquias.error);

  var cmb_parroquias = new componente.cmb();
  cmb_parroquias.ini("filtro_parroquias");
  cmb_parroquias.addCmbDataSupabase(datos_parroquias.data);
  $("#filtro_parroquias").prop("disabled", true);

  // - logica de provincias
  $("#filtro_provincias").on("change", async function () {
    valor_provincia = $(this).val(); // Obtiene el valor seleccionado
    if (valor_provincia == "") {
      $("#filtro_cantones").prop("disabled", true);
      $("#filtro_cantones").val(0).trigger("change");
      $("#filtro_parroquias").val(0).trigger("change");
      $("#filtro_parroquias").prop("disabled", true);
    } else {
      $("#filtro_cantones").prop("disabled", false);
      $("#filtro_parroquias").prop("disabled", true);
      $("#filtro_cantones").val(0).trigger("change");
      $("#filtro_parroquias").val(0).trigger("change");

      // - actualiza cantones
      cmb_cantones.clear();
      let datos_cantones = await supabase.rpc("obtener_cantones", {
        nombre_provincia: valor_provincia,
      });

      if (datos_cantones.error) console.error(datos_cantones.error);

      cmb_cantones.addCmbDataSupabase(datos_cantones.data);
    }
  });

  // - logica de cantones
  $("#filtro_cantones").on("change", async function () {
    valor_canton = $(this).val(); // Obtiene el valor seleccionado
    if (valor_canton == "") {
      $("#filtro_parroquias").val(0).trigger("change");
      $("#filtro_parroquias").prop("disabled", true);
    } else {
      $("#filtro_parroquias").prop("disabled", false);
      $("#filtro_parroquias").val(0).trigger("change");

      // - actualiza parroquias
      cmb_parroquias.clear();
      let datos_parroquias = await supabase.rpc("obtener_parroquias", {
        nombre_provincia: valor_provincia,
        nombre_canton: valor_canton,
      });

      if (datos_parroquias.error) console.error(datos_parroquias.error);

      cmb_parroquias.addCmbDataSupabase(datos_parroquias.data);
    }
  });

  // boton de actualizar puntos
  $(".btn-graficar-turismo").click(function () {
    actualizar_turismo();
  });

  // boton para iniciar funcion de longitud - latitud
  

  $(".btn-sitio-turismo").click(function () {
    iniciar_localizacion();
  });

  $(".btn-registro-sitio-turismo").click(function () {
    registrar_sitio_turistico();
  });


}

// -- actualizar turismo --
async function actualizar_turismo() {

  // - limpiar poligonos
  clear_polygons(0);

  // -- variables de uso
  // provincia
  let provincia = $("#filtro_provincias").val();
  provincia = provincia === "0" ? null : provincia;

  // cantón
  let canton = $("#filtro_cantones").val();
  canton = canton === "0" ? null : canton;

  // parroquia
  let parroquia = $("#filtro_parroquias").val();
  parroquia = parroquia === "0" ? null : parroquia;

  // - consulta puntos turismo
  let datos_turismo = await supabase.rpc("obtener_puntos_turismo", {
    p_provincia: provincia,
    p_canton: canton,
    p_parroquia: parroquia,
  });

  if (datos_turismo.error) console.error(datos_turismo.error);

  // - llamar a funcion para graficar puntos
  graficar_puntos(datos_turismo.data, 'Turismo');

}

// -- iniciar capas --
async function iniciar_capas() {

  // iniciar mensaje de carga de capas
  let timerInterval;
  Swal.fire({
    title: "Cargando capas...",
    html: "",
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // - iniciar capa conservacion
  let datos_conservacion = await supabase.rpc("obtener_conservacion");

  if (datos_conservacion.error) console.error(datos_conservacion.error);

  // pintar capa
  graficar_capa(
    datos_conservacion.data, // los datos recibidos
    "#fa9331", // color
    "conservacion", // base
    true, // activar al cargar
    "Conservación" // título
  );

  // - iniciar capa corredor
  let datos_corredor = await supabase.rpc("obtener_corredor");

  if (datos_corredor.error) console.error(datos_corredor.error);

  // pintar capa
  graficar_capa(
    datos_corredor.data, // los datos recibidos
    "#22dfdf", // color
    "corredor", // base
    true, // activar al cargar
    "Corredor" // título
  );

  // - iniciar capa humedales
  let datos_humedales = await supabase.rpc("obtener_humedales");

  if (datos_humedales.error) console.error(datos_humedales.error);

  // pintar capa
  graficar_capa(
    datos_humedales.data, // los datos recibidos
    "#fa31d8", // color
    "humedales", // base
    true, // activar al cargar
    "Humedales" // título
  );

  // - iniciar capa snap
  let datos_snap = await supabase.rpc("obtener_snap");

  if (datos_snap.error) console.error(datos_snap.error);

  // pintar capa
  graficar_capa(
    datos_snap.data, // los datos recibidos
    "#fa3131", // color
    "snap", // base
    true, // activar al cargar
    "Snap" // título
  );

  // cerrar mensaje de carga de capas
  Swal.close()

}

// -- graficar capas --
async function graficar_capa(datos, color, base, activar, titulo) {

  // iniciar capa vacia
  let capa_datos = L.layerGroup();

  // obtener controles de opacidad del menu desplegable
  const rango_opacidad = document.getElementById("opacity-range-" + base);
  const valor_opacidad = document.getElementById("opacity-value-" + base);
  const checkbox = document.getElementById("capa_" + base);

  // limpiar capa
  capa_datos.clearLayers();

  // recorrer datos
  datos.forEach((item) => {

    // transformar datos json
    const geojson = JSON.parse(item.geojson);

    // establecer datos de capa
    const geojson_capa = L.geoJSON(geojson, {

      // seteo de estilos de capa
      style: {
        color: color,
        weight: 2,
        opacity: 0.75,
        fillOpacity: 0.5,
      },
    });

    // agregar evento de apertura de modal con informacion
    geojson_capa.on("click", function () {

      // iniciar funcion de modal para visualizar informacion
      mostrar_info_modal(item,titulo);

    });

    // agregar capa al arreglo de capa
    geojson_capa.addTo(capa_datos);

  });

  // control checkbox
  if (checkbox) {

    // evitar event listeners duplicados, clonar y reemplazar
    const newCheckbox = checkbox.cloneNode(true);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);

    // establecer evento de encendido de check
    newCheckbox.checked = activar;
    if (activar) {

      // agregar capa al mapa
      capa_datos.addTo(map);
      // mostrar boton de opacidad
      $("#grupo-opacidad-" + base).show();

    }

    // capturar evento de checkbox por capa
    newCheckbox.addEventListener("change", (e) => {

      // si checkbox esta en estado true
      if (e.target.checked) {

        // encender capa en el mapa
        map.addLayer(capa_datos);
        // mostrar boton de opacidad
        $("#grupo-opacidad-" + base).show();
        // establecer rangos de boton de opacidad
        if (valor_opacidad) valor_opacidad.innerHTML = "0.5";
        if (rango_opacidad) rango_opacidad.value = 0.5;
        // restablecer estilo de capa
        capa_datos.eachLayer((layer) =>
          layer.setStyle({ weight: 2, opacity: 0.75, fillOpacity: 0.5 })
        );

      } 
      // si checkbox esta en estado false
      else {

        // descativar capa
        map.removeLayer(capa_datos);
        // ocultar boton de opacidad
        $("#grupo-opacidad-" + base).hide();
        // restablecer valores boton de opacidad
        if (valor_opacidad) valor_opacidad.innerHTML = "0.5";
        if (rango_opacidad) rango_opacidad.value = 0.5;
        // restablecer estilo de capa
        capa_datos.eachLayer((layer) =>
          layer.setStyle({ weight: 2, opacity: 0.65, fillOpacity: 0.5 })
        );

      }

    });
  }

  // control de opacidad
  if (rango_opacidad && valor_opacidad) {

    // obtener valor de opacidad y actualizar en la capa
    rango_opacidad.addEventListener("input", () => {
      const newOpacity = parseFloat(rango_opacidad.value);
      valor_opacidad.innerHTML = newOpacity.toFixed(1);
      capa_datos.eachLayer((layer) =>
        layer.setStyle({ fillOpacity: newOpacity })
      );
    });

  }

  // guardar la capa para control futuro
  window[base] = capa_datos;

}

// -- iniciar puntos --
function graficar_puntos(data, titulo) {

  // icono personalizado
  var icono_personalizado = L.icon({
    iconUrl: "img/viaje-y-turismo.png",
    shadowUrl: "img/viaje-y-turismo.png",
    iconSize: [24, 24],
    shadowSize: [0, 0],
    iconAnchor: [12, 24],
    shadowAnchor: [0, 0],
    popupAnchor: [0, -24],
  });

  var icono_personalizado_nuevo = L.icon({
    iconUrl: "img/destino.png",
    shadowUrl: "img/destino.png",
    iconSize: [24, 24],
    shadowSize: [0, 0],
    iconAnchor: [12, 24],
    shadowAnchor: [0, 0],
    popupAnchor: [0, -24],
  });

  // primero limpiamos los puntos previos para actualizar sin duplicar
  capa_puntos_turismo.clearLayers();

  // recorrido de atos
  data.forEach((item) => {

    // transformar a json
    const geojsonObj = JSON.parse(item.geojson);
    console.log(item.categoria)

    const icono = item.categoria === "Sin datos"
      ? icono_personalizado_nuevo
      : icono_personalizado;

    // crear capa con puntos
    const punto = L.geoJSON(geojsonObj, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: icono,
        });
      },
    });

    // asignar propiedad
    punto.db_punto = 0;

    // agregar evento de apertura de modal con informacion
    punto.on("click", function () {

      // iniciar funcion de modal para visualizar informacion
      mostrar_info_modal(item,titulo);

    });

    // agregar el punto a la capa de puntos
    punto.addTo(capa_puntos_turismo);

  });

  // si la capa no está agregada al mapa, la agregamos
  if (!map.hasLayer(capa_puntos_turismo)) {
    capa_puntos_turismo.addTo(map);
  }

}

// -- insertar punto --
async function registrar_sitio_turistico(){

  

  // -- variables de uso
  // nombre
  let nombre_sitio = $("#nombre_sitio").val();
  
  // descripcion
  let descripcion_sitio = $("#descripcion_sitio").val();

  // longitud
  let longitud_sitio = $("#longitud_sitio").val();

  // latitud
  let latitud_sitio = $("#latitud_sitio").val();

  if (longitud_sitio == '' || latitud_sitio == '') {
    Swal.fire({
      icon: "info",
      title: "Debes permitir la geolocalizacion",
    });
    iniciar_localizacion()

  }else if (longitud_sitio != '' && latitud_sitio != ''){

    if (nombre_sitio == '' || descripcion_sitio == '') {
    Swal.fire({
      icon: "error",
      title: "Debes llenar todos los campos",
    });
    }else{
      // - consulta puntos turismo
      const { data, error } = await supabase.rpc("insertar_sitio_turistico", {
        p_lon: parseFloat(longitud_sitio),
        p_lat: parseFloat(latitud_sitio),
        p_des: descripcion_sitio,
        p_nom: nombre_sitio
      });

      if (error) {
        console.error("Error Supabase:", error);
      } else {
        console.log("Resultado:", data); // Ej: "Punto insertado correctamente."
        if (data[0].status_code == 1) {
          Swal.fire({
            title: data[0].mensaje,
            icon: "success",
            draggable: true
          });
        }else if (data[0].status_code == 2) {
          Swal.fire({
            title: data[0].mensaje,
            icon: "success",
            draggable: true
          });
        }else{
          Swal.fire({
            title: data[0].mensaje,
            icon: "info",
            draggable: true
          });
        }
      }
    }

  }

  

  

}

// -- mostrar modal de informacion --
function mostrar_info_modal(item,titulo) {

  // titulo de modal
  $('.modal-title').html(titulo)

  // obtener elemento body de modal
  const modalBody = document.getElementById('modal-info-body');
  // variable de inicio de contenedor
  let contenido = '<div class="row">';

  // ciclo for de recorrido de propiedades
  for (const [clave, valor] of Object.entries(item)) {
    if (clave === 'geojson') continue; // saltar el geojson
    const label = clave.charAt(0).toUpperCase() + clave.slice(1).toLowerCase(); // formato Nombre, Codigo, etc.
    const esLargo = valor.length > 80; // si es muy largo, mostrar en una línea completa

    contenido += `
      <div class="col-md-${esLargo ? '12' : '6'} mb-2">
        <strong>${label}:</strong><br>${valor}
      </div>
    `;
  }
  // variable de finalizacion de contenedor
  contenido += '</div>';
  // agregar contenido al body del modal
  modalBody.innerHTML = contenido;

  // mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modal-info'));
  modal.show();

}

// -- funcion para la limpieza de poligonos --
function clear_polygons(nivel) {
  var layers = map._layers;
  for (l in layers) {
    if (layers[l].db_polygono == nivel) {
      map.removeLayer(layers[l]);
    }
  }
}