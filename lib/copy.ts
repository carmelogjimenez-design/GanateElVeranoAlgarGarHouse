export const COPY = {
  lobbyTitles: [
    "Disfruta del verano… o quédate en casa.",
    "El sofá no se va a recoger solo.",
    "Hoy hay tareas. Mañana también. Sorpresa.",
  ],
  kidWelcome: (n: string) => [
    `¡Hola ${n}! El ranking no se sube solo.`,
    `${n}, hay gloria pendiente de reclamar.`,
    `${n}, tus hermanos ya están sumando. ¿Tú?`,
    `Bienvenido ${n}. El verano premia a los valientes.`,
  ],
  done: [
    "Marcada. Ahora reza para que papá o mamá la validen.",
    "Hecho. La pelota está en su tejado.",
    "Enviada a revisión. Cruza los dedos.",
  ],
  noTasks: [
    "Hoy no tienes tareas. Sospechoso… disfruta mientras dure.",
    "Cero tareas. ¿Soborno o suerte?",
  ],
};
export const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
