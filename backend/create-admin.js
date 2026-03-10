import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { nombre: 'admin' },
    create: {
      nombre: 'admin',
      password: passwordHash,
      rol: 'ADMIN',
    },
    update: {
      password: passwordHash,
      rol: 'ADMIN',
    },
  });
  console.log('Usuario admin creado/actualizado:', user.nombre, '(rol:', user.rol, ')');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
