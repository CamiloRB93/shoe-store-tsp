// Datos conexion con Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBAClXrD8pOmZ_MdHBYMetrhglDmQcpszo",
  authDomain: "shoe-store-tsp.firebaseapp.com",
  projectId: "shoe-store-tsp",
  storageBucket: "shoe-store-tsp.firebasestorage.app",
  messagingSenderId: "676053540919",
  appId: "1:676053540919:web:01092991417f53e0cf5fb2"
};

//Inicializa aplicación Firebase
firebase.initializeApp(firebaseConfig);

//Creación de variable 'db', puerta de entrada a la base de datos
const db = firebase.firestore();

console.log("¡Firebase conectado exitosamente!");