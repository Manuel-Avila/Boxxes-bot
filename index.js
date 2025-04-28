const venom = require("venom-bot");

const goBackOption = '⬅️ Volver al menú principal';
const agentGroupId = '@g.us';

// Agregar el prifijo del principio 521 y la parte final @c.us
const whiteList = [
  {name: 'Gaby', number: '@c.us'},
  {name: 'Jio', number: '@c.us'},
  {name: 'Hola bonita', number: '@c.us'}
]

const menus = {
  mainMenu: `📦 *¡BIENVENIDO A LA CAJA DISTRIBUIDORA!*
  Es un gusto atenderle, seleccione una opción: 
    1. 🕒 Horario de atención
    2. 📍 Ubicación y cómo llegar
    3. 📦 Modelos disponibles
    4. 🛒 Hacer un pedido
    5. 💵 Facturación
    6. 💬 Hablar con un agente
  `,
  workshift: `🕒 *HORARIO DE ATENCIÓN*
    Lunes a Viernes: 9:00 AM - 6:00 PM
    Sábados: 9:00 AM - 3:00 PM   
    Domingos: Cerrado
  `,
  location: `📍 *UBICACIÓN*   
    Calle Jalisco entre México y Melitón Albáñez   
    Frente a la preparatoria CBTIS 62
    https://maps.app.goo.gl/54g9VKeb6r1m8L3u7
  `,
  models: `📦 *MODELOS DISPONIBLES*   
    Te anexamos el catálogo
  `,
  order: `🛒 *REALIZAR PEDIDO*   
    Espere a que un agente de ventas se una a la conversación 
    0. ${goBackOption}
  `,
  billing: `💵 *Facturación*
    Por favor envía una foto de tu ticket de compra y tu constancia de situación fiscal
    0. ${goBackOption}
  `,
  agent: ` 💬 *Agente*
    Espere a que un agente de ventas se una a la conversación 
    0. ${goBackOption}
  `
};

const menuNavegation = {
  mainMenu: {
    '1': 'workshift',
    '2': 'location',
    '3': 'models',
    '4': 'order',
    '5': 'billing',
    '6': 'agent',
  },
  order: {
    '0': 'mainMenu'
  }, 
  billing: {
    '0': 'mainMenu'
  },
  agent: {
    '0': 'mainMenu'
  }
}

const invalidInputMessage = `⚠️ *Opción no reconocida*   
  Por favor, elige un número dentro del rango del menú. 
`;

let client = undefined;
const userState = {};
const userLastMessageTime = {};

venom
  .create({
    session: "bot-session",
    multidevice: true,
    headless: 'new'
  })
  .then((client) => start(client))
  .catch((error) => console.log("Error al iniciar el bot:", error));

function start(c) {
  client = c
  console.log("✅ Bot conectado con éxito");

  client.onMessage(async (message) => {
    try {
      // Valida que el mensaje no sea en un grupo y tenga texto
      if (message.isGroupMsg || !message.body) return;

      const user = message.from;
      
      // Ignora mensajes de las personas en la white list
      if (isOnWhiteList(user)) return;

      console.log("📩 Mensaje recibido:", message.body);
      
      // Delay entre mensajes de 2 segundos para evitar spam
      const now = Date.now();
      if(userLastMessageTime[user] && (now - userLastMessageTime[user]) < 2000) return;
      userLastMessageTime[user] = now;

      const userMessage = message.body.trim();

      if(userState[user]) {
        handleMenuNavegation(user, userMessage);
      } else {
        userState[user] = 'mainMenu';
        sendText(user, menus.mainMenu)
      }
    } catch(e) {
      console.log(`Error: ${e.message}`)
    }
  });
}

function sendText(user, text) {
  return client.sendText(user, text).catch(e => {
    console.log(`Error: ${e.message}`)
  });
}

// Ejemplo sendFile(user, './assets/test.pdf', 'test.pdf', 'Pdf')
function sendFile(user, path, name, description = '') {
  return client.sendFile(
    user,
    path,
    name,
    description
  ).catch(e => {
    console.log(`Error: ${e.message}`)
  });
}


function sendImage(user, path, name, description = '') {
  return client.sendImage(
    user,
    path,
    name,
    description
  ).catch(e => {
    console.log(`Error: ${e.message}`)
  });
}

async function handleMenuNavegation(user, userMessage) {
  const currentMenu = userState[user];
  const nextMenu = menuNavegation[currentMenu]?.[userMessage];
  const userInputOptions = ['order', 'billing', 'agent'];
  const needAgent = ['order', 'agent'];
  const redirectToMainMenu = ['workshift'];

  if(nextMenu === 'location') {
    await sendImage(user, './assets/location.jpeg', 'location.jpeg', menus['location']);
    await sendText(user, menus[currentMenu]);
    return;
  }

  if(nextMenu === 'models') {
    await sendText(user, menus['models']);
    await sendFile(user, './assets/catalogo.pdf', 'Catalogo.pdf', '');
    await sendText(user, menus[currentMenu]);
    return;
  }

  // Si se cumple esta condicion es porque se espera input del usuario, ignorara cualquier cosa que no sea el '0' para regresar
  if(userInputOptions.includes(currentMenu) && !nextMenu) {
    return;
  }

  // Entra si escogio una opcion invalida
  if(!nextMenu) {
    await sendText(user, invalidInputMessage);
    await sendText(user, menus[currentMenu]);
    return;
  }

  userState[user] = nextMenu;
  await sendText(user, menus[nextMenu]);

  // Si entra en esta condicion significa que el usuario acaba de solicitar a un agente.
  if(needAgent.includes(nextMenu)) {
    await sendText(agentGroupId, 
      `💬 *SE SOLICITO UN AGENTE*
        Número del usuario: ${user.replace('@c.us', '')}`);
    return;
  }

  if(redirectToMainMenu.includes(nextMenu)) {
    userState[user] = 'mainMenu';
    await sendText(user, menus['mainMenu']);
    return;
  }
}

function isOnWhiteList(user) {
  return whiteList.some(person => person.number === user);
}