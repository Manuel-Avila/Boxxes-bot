const venom = require("venom-bot");

const options = {
  mainMenu: '⬅️ Volver al menú principal ',
  workShift: '🕒 Horario de atención',
  location: '📍Ubicación y cómo llegar',
  models: '📦 Modelos disponibles y precios',
  order: '🛒 Hacer un pedido',
  billing: '💵 Facturación'
}

const menus = {
  mainMenu: `📦 *¡BIENVENIDO A LA CAJA DISTRIBUIDORA!*
  Es un gusto atenderle, seleccione una opción: 
    1. ${options.workShift}
    2. ${options.location}
    3. ${options.models}
    4. ${options.order}
    5. ${options.billing}
  `,
  workShift: `🕒 *HORARIO DE ATENCIÓN*
    Lunes a Viernes: 9:00 AM - 6:00 PM
    Sábados: 9:00 AM - 3:00 PM   
    Domingos: Cerrado
    0. ${options.mainMenu}
    1. ${options.location}
  `,
  location: `📍 *UBICACIÓN*   
    Calle Jalisco entre México y Melitón Albáñez   
    Frente a la preparatoria CBTIS 62
    https://maps.app.goo.gl/54g9VKeb6r1m8L3u7
    0. ${options.mainMenu}
    1. ${options.workShift}
  `,
  models: `📦 *MODELOS DISPONIBLES Y PRECIOS*   
    Te anexamos el catálogo

    0. ${options.mainMenu}
  `,
  order: `🛒 *REALIZAR PEDIDO*   
    Espere a que un agente de ventas se una a la conversación 
    0. ${options.mainMenu}
  `,
  billing: `💵 *Facturación*
    Por favor envía una foto de tu ticket de compra y tu constancia de situación fiscal
    0. ${options.mainMenu}
  `
};

const invalidInputMessage = `⚠️ *Opción no reconocida*   
  Por favor, elige un número dentro del rango del menú. 
`

const userState = {};
const userLastMessageTime = {};

venom
  .create({
    session: "bot-session",
    multidevice: true,
  })
  .then((client) => start(client))
  .catch((error) => console.log("Error al iniciar el bot:", error));

function start(client) {
  console.log("✅ Bot conectado con éxito");

  client.onMessage(async (message) => {
    try {
      // Valida que el mensaje no sea en un grupo y tenga texto
      if (message.isGroupMsg || !message.body) return;
    
      console.log("📩 Mensaje recibido:", message.body);

      const user = message.from;
      const userMessage = validateMessage(message.body);
      const now = Date.now();

      // Delay entre mensajes de 2 segundos para evitar spam
      if(userLastMessageTime[user] && (now - userLastMessageTime[user]) < 2000) return;

      userLastMessageTime[user] = now;

      if(userState[message.from] && userState[message.from] !== 'mainMenu') {
        handleSubMenu(client, user, userMessage);
      } else if(!userState[message.from]) {
        userState[user] = 'mainMenu';
        await displayMainMenu(client, user)
      } else {
        await handleMainMenu(client, user, userMessage);
      }
    } catch(e) {
      console.log(`Error: ${e.message}`)
    }
  });
}

async function displayMainMenu(client, user) {
  await client.sendText(user, menus.mainMenu);
}

async function displayModelsInformation(client, user) {
  try {
    await client.sendText(user, menus[userState[user]])
    await client.sendFile(
      user,
      './assets/modelos.pdf',
      'modelos.pdf',
      ''
    )
  } catch(e) {
    console.log(`Error: ${e.message}`);
  }
}

async function displayLocationInformation(client, user) {
  try {
    await client.sendImage(
      user,
      './assets/location.jpeg',
      'location.jpeg',
      menus[userState[user]]
    );
  } catch(e) {
    console.log(`Error: ${e.message}`);
  }
}

async function sendInvalidOption(client, user) {
  await client.sendText(user, invalidInputMessage);
}

async function handleMainMenu(client, user, userMessage) {
  switch(userMessage) {
    case 1:
      userState[user] = 'workShift';
      break;
    case 2:
      userState[user] = 'location';
      displayLocationInformation(client, user);
      return;
    case 3:
      userState[user] = 'models';
      displayModelsInformation(client, user);
      return;
    case 4:
      userState[user] = 'order';
      break;
    case 5:
      userState[user] = 'billing'
      break;
    default:
      await sendInvalidOption(client, user);
  }

  await client.sendText(user, menus[userState[user]])
}

async function handleSubMenu(client, user, userMessage) {
  const currentMenu = userState[user];

  switch(currentMenu) {
    case 'workShift': 
      await handleWorkShiftMenu(client, user, userMessage);
      break;
    case 'location': 
      await handleLocationMenu(client, user, userMessage);
      break;
    case 'models': 
      await handleModelsMenu(client, user, userMessage);
      break;
    case 'order': 
      await handleOrderMenu(client, user, userMessage);
      break;
    case 'billing': 
      await handleBillingMenu(client, user, userMessage);
      break;
  }
}

async function handleWorkShiftMenu(client, user, userMessage) {
  switch(userMessage) {
    case 0:
      userState[user] = 'mainMenu';
      break;
    case 1:
      userState[user] = 'location';
      displayLocationInformation(client, user);
      return;
    default: 
      await client.sendText(user, invalidInputMessage);
  }

  await client.sendText(user, menus[userState[user]])
}

async function handleLocationMenu(client, user, userMessage) {
  switch(userMessage) {
    case 0:
      userState[user] = 'mainMenu';
      break;
    case 1:
      userState[user] = 'workShift'
      break;
    default: 
      await client.sendText(user, invalidInputMessage);
      await displayLocationInformation(client, user);
      return;
  }

  await client.sendText(user, menus[userState[user]])
}

async function handleModelsMenu(client, user, userMessage) {
  switch(userMessage) {
    case 0:
      userState[user] = 'mainMenu';
      break;
    default: 
      await client.sendText(user, invalidInputMessage);
  }

  await client.sendText(user, menus[userState[user]])
}

async function handleOrderMenu(client, user, userMessage) {
  switch(userMessage) {
    case 0:
      userState[user] = 'mainMenu';
      break;
    default:
      await client.sendText(user, invalidInputMessage);
  }

  await client.sendText(user, menus[userState[user]]);
}

async function handleBillingMenu(client,user,userMessage) {
  switch(userMessage) {
    case 0:
      userState[user] = 'mainMenu';
      break;
    default: 
      await client.sendText(user, invalidInputMessage);
  }

  await client.sendText(user, menus[userState[user]])
}

function validateMessage(userMessage) {
  const message = Number(userMessage.trim());
  return (isNaN(message) || !Number.isInteger(message)) ? NaN : message;
}