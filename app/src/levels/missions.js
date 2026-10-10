export const CHAPTERS = [
  {
    id: 'ch1',
    title: 'CAPÍTULO 1: OPERACIÓN CERROJO',
    synopsis: 'Infiltra los servidores de Helix Dynamics y descubre qué esconde Protocolo Cero.',
  },
  {
    id: 'ch2',
    title: 'CAPÍTULO 2: PROTOCOLO CERO',
    synopsis: 'La traición viene de dentro. Cada pista te acerca a la verdad... y a un enemigo que ya conoce tu huella.',
    price: '$49 MXN',
  },
];

export const MISSIONS = [
  {
    id: 'm1',
    chapter: 'ch1',
    title: 'Operación Cerrojo',
    briefing: 'Helix Dynamics guarda un expediente llamado Protocolo Cero. La sala de servidores tiene una cerradura digital: usa tu terminal como ganzúa.',
    sensor: 'Acelerómetro',
    story:
      'Cerradura vencida. Estás dentro de la sala de servidores de Helix, agente. Las cámaras todavía no ven tu señal, pero hay guardias virtuales en los pasillos. Muévete con cuidado.',
  },
  {
    id: 'm2',
    chapter: 'ch1',
    title: 'Sombras en el Pasillo',
    briefing: 'Los guardias patrullan. Cuando miren hacia ti, oculta tu terminal volteándola boca abajo. Cuando se vayan, sentirás tres vibraciones: ya puedes voltearla.',
    sensor: 'Acelerómetro / Luz',
    story:
      'Pasaste sin dejar rastro. En la terminal central aparece un nombre que no esperabas: Protocolo Cero. Helix lleva años rastreando agentes de La Central. Falta el archivo maestro, y solo se abre con una huella autorizada.',
  },
  {
    id: 'm3',
    chapter: 'ch1',
    title: 'Núcleo Encriptado',
    briefing: 'El archivo maestro está protegido. Autoriza la desencriptación con tu huella.',
    sensor: 'Biometría',
    story:
      'El archivo se abre y es una lista de agentes de La Central con sus huellas biométricas. La tuya está ahí. Alguien de adentro las entregó a Helix. CIFRA corta la comunicación. Lo último que escribes en pantalla es su mensaje: "No confíes en nadie. Ni en mí."',
  },
  {
    id: 'm4',
    chapter: 'ch2',
    title: 'Señal Fantasma',
    briefing: 'Helix rastrea tu señal. Un satélite abandonado puede ocultar tu transmisión: gira hasta alinear la antena con su órbita antes de que te localicen.',
    sensor: 'Magnetómetro',
    story:
      'Enlace establecido. Mientras la señal rebota por el espacio, CIFRA reaparece. Dice que la filtración vino de un topo en La Central y que solo él puede probar tu inocencia... o culparte. No sabes a quién creer.',
  },
  {
    id: 'm5',
    chapter: 'ch2',
    title: 'Equilibrio Crítico',
    briefing: 'Para subir las pruebas necesitas estabilizar la antena en la azotea mientras las ráfagas la sacuden. Mantén la señal en el centro.',
    sensor: 'Acelerómetro 2D',
    story:
      'Pruebas subidas. Entre los archivos hay una orden firmada por la directora de La Central: Protocolo Cero no es de Helix. La Central lo construyó para vigilar a sus propios agentes. Helix solo lo compró.',
  },
  {
    id: 'm6',
    chapter: 'ch2',
    title: 'Protocolo Cero',
    briefing: 'El núcleo está en la sede de Helix. Fase 1: infiltración. Fase 2: estabiliza el enlace. Fase 3: autoriza el borrado con tu huella.',
    sensor: 'Combinado',
    story:
      'Borrado completado. Protocolo Cero ha desaparecido... o eso parece. En pantalla queda un último mensaje: "Gracias por tu huella, agente. Ya no la necesitábamos." Algo sigue vivo allá afuera.',
  },
];