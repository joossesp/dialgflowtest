
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 // inicializar firebase realtime
const admin = require ('firebase-admin');


// se incorpora la api de nodemailer gestor de e-mails
const nodemailer = require("nodemailer");

// se inializa
admin.initializeApp({
  	credential: admin.credential.applicationDefault(),

  apiKey: "AIzaSyDD61pFALwNTcI9fuIoREVl_hKN0MFYWD0",
  authDomain: "gustogustoso.firebaseapp.com",
  //ws protocolo de websocket
  databaseURL: "ws://gustogustoso.firebaseio.com",
  projectId: "gustogustoso",
  storageBucket: "gustogustoso.appspot.com",
  messagingSenderId: "822845376665",
  appId: "1:822845376665:web:7a60c005c5542c2b341008"
});

var database = admin.database();
var firestore= admin.firestore();



// generamos el inicio de sesion de una cuenta de gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'xxxxp@gmail.com',
        pass: 'PASSHERE'
    }
});



 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  // intent que responde en el caso de que este habilitada la opcion de fulfilment
  function welcome(agent) {
    agent.add(`Bienvenido al intent agent fulfilment!`);
  }
 
  function fallback(agent) {
    agent.add(`no comprendo lo que dices `);
    agent.add(`me encuentro en el fallback de la categoria fulfilment ?`);
  }
   function leerHandler(agent) {
     
       let mediRef = firestore.collection('farmacia/articulos');
     let query = mediRef.where('stock', '>', 0).get()
       .then(snapshot => {
         if (snapshot.empty) {
           console.log('No matching documents.');
           return;
         }
     
         snapshot.forEach(doc => {
           agent.add(doc.id, '=>', doc.data());
         });
       })
       .catch(err => {
         console.log('Error getting documents', err);
       });
     
     
  }


  // funcion de enviar el correo 
  function sendEmailHandler(agent){
      //recuperacion de parametros del intent
      const { email, name , solicitud, text , fecha , espacio } = agent.parameters;
      // formato de correo
    const mailOptions = {
        from: "Sistema de Reservas vía Chatbot", // quien envia el E-mail
        to: email, // a quien es enviado el email
        subject: "Solicitud de espacio Municipio", // Subject 
        html: `<h1>Report de solicitud a nombre de ${name} </h1>
				<br>
				<br>
				<br>
				<p> Tu solicitud  de : ${solicitud} se encuentra ingresada a nombre de ${name}<br>
				para la utilizacion del ${espacio} <br>
				en la fecha ${fecha} <br> 
				tu actividad trata de${text} </p>`
      
    
    };
    
   
     var propuesta = {
       nombre: name,
       solicitud: solicitud,
       text: text,
       espacio : espacio,
       fecha: fecha,
       email: email
       
       
     };
     // aqui agregamos un elemento a la base de datos con los elementos rescatados
     admin.database().ref('/data').push(propuesta);
    // mensaje de consola 
    agent.add(`Su solicitud ${name}, se encuentra ingresada se a enviado un e-mail con la constancia, espere confirmacion del encargardo Gracias `);
   
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
        {
          console.log(err);
        }
    });
  
    
  }
  
  
  // Asociaciones de las funciones handlers con los intents creados.   (nombreIntent,nombreFuncion)
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
   intentMap.set('sendEmail', sendEmailHandler);
  intentMap.set('consultaMed', leerHandler);

  agent.handleRequest(intentMap);
});
